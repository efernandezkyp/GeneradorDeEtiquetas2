import { IZplTemplateEngine, LabelProductInput } from '../../domain/interfaces';

const DEFAULT_TEMPLATE = '__DYNAMIC_TEMPLATE__';

function encodeZplFieldDataUtf8(value: string): string {
  const bytes = Buffer.from(value, 'utf8');
  let result = '';

  for (const byte of bytes) {
    const isPrintableAscii = byte >= 0x20 && byte <= 0x7e;
    const mustEscape = !isPrintableAscii || byte === 0x5e || byte === 0x7e || byte === 0x5f || byte === 0x7c;
    if (!mustEscape) {
      result += String.fromCharCode(byte);
      continue;
    }

    result += `_${byte.toString(16).toUpperCase().padStart(2, '0')}`;
  }

  return result;
}

function splitText(value: string, maxLength: number): string[] {
  const sanitized = value.trim().replace(/\s+/g, ' ');
  if (!sanitized) return [''];

  const words = sanitized.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxLength) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    if (word.length <= maxLength) {
      current = word;
      continue;
    }

    for (let index = 0; index < word.length; index += maxLength) {
      const chunk = word.slice(index, index + maxLength);
      if (chunk.length === maxLength) {
        lines.push(chunk);
      } else {
        current = chunk;
      }
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [''];
}

function renderFieldBlock(
  lines: string[],
  startY: number,
  fontSize: number,
  lineHeight: number,
  encodeFieldData: (value: string) => string,
  x = 35,
): string {
  return lines
    .map(
      (line, index) =>
        `^CF0,${fontSize}\n^FO${x},${startY + index * lineHeight}^FH^FD${encodeFieldData(line)}^FS`,
    )
    .join('\n');
}

function buildProductRows(
  products: LabelProductInput[],
  encodeFieldData: (value: string) => string,
): Array<{ quantity: string | null; description: string }> {
  return products.flatMap((product) => {
    const descriptionLines = splitText(product.productName, 34).map((line) => encodeFieldData(line));
    return descriptionLines.map((description, index) => ({
      quantity: index === 0 ? String(product.quantity) : null,
      description,
    }));
  });
}

export class ZplTemplateEngine implements IZplTemplateEngine {
  constructor(private readonly template: string = DEFAULT_TEMPLATE) {}

  generate(data: {
    id: string;
    externalReference: string;
    reason: string;
    products: LabelProductInput[];
    address: string;
    phone: string;
    receiver: string;
    originCompany: string;
    destinationCompany: string;
  }): string {
    if (this.template !== DEFAULT_TEMPLATE) {
      return this.renderWithTemplate(data);
    }

    const externalReference = this.encodeFieldData(data.externalReference);
    const reasonLines = splitText(data.reason, 38);
    const addressLines = splitText(data.address, 42);
    const productRows = buildProductRows(data.products, (value) => this.encodeFieldData(value));
    const contactLine = this.encodeFieldData(`${data.phone} - ${data.receiver}`);
    const companyLine = this.encodeFieldData(`${data.originCompany} - ${data.destinationCompany}`);
    const qrData = this.encodeFieldData(
      `LA,ID=${data.id};REF=${data.externalReference};SELLER=${data.destinationCompany};COMPANY=${data.originCompany}`,
    );

    const reasonStartY = 290;
    const reasonLineHeight = 36;
    const reasonBoxHeight = 90 + Math.max(reasonLines.length - 1, 0) * reasonLineHeight;

    const productsBoxY = 360 + Math.max(reasonBoxHeight - 90, 0);
    const productRowsStartY = productsBoxY + 80;
    const productRowHeight = 34;
    const productsBoxHeight = 100 + Math.max(productRows.length, 1) * productRowHeight;

    const addressBoxY = productsBoxY + productsBoxHeight + 20;
    const addressStartY = addressBoxY + 50;
    const addressLineHeight = 30;
    const addressBoxHeight = 80 + Math.max(addressLines.length, 1) * addressLineHeight;

    const contactBoxY = addressBoxY + addressBoxHeight + 20;
    const contactBoxHeight = 80;
    const labelLength = contactBoxY + contactBoxHeight + 40;

    const renderedProducts = productRows
      .map((row, index) => {
        const y = productRowsStartY + index * productRowHeight;
        const quantityBlock = row.quantity
          ? `^CF0,26\n^FO45,${y}^FH^FD${this.encodeFieldData(row.quantity)}^FS\n`
          : '';
        return `${quantityBlock}^CF0,26\n^FO145,${y}^FH^FD${row.description}^FS`;
      })
      .join('\n');

    return `^XA
^CI28
^PW800
^LL${labelLength}
^LH0,400

^CF0,40
^FO20,20^FH^FDETIQUETA DE ENTREGA^FS

^CF0,22
^FO20,65^FH^FD${companyLine}^FS

^FO20,95^GB500,2,2^FS

^FO540,10^BQN,2,6
^FH^FD${qrData}^FS

^CF0,22
^FO20,120^FH^FDREF EXTERNA^FS

^CF0,42
^FO20,150^FH^FD${externalReference}^FS

^FO20,250^GB760,${reasonBoxHeight + 20},2^FS

^CF0,22
^FO35,265^FH^FDMOTIVO^FS

${renderFieldBlock(reasonLines, reasonStartY, 34, reasonLineHeight, (value) => this.encodeFieldData(value))}

^FO20,${productsBoxY}^GB760,${productsBoxHeight},2^FS
^FO110,${productsBoxY + 35}^GB2,${productsBoxHeight - 50},2^FS

^CF0,22
^FO35,${productsBoxY + 15}^FH^FDPRODUCTOS^FS
^FO45,${productsBoxY + 50}^FH^FDCANT^FS
^FO145,${productsBoxY + 50}^FH^FDNOMBRE DE PRODUCTO^FS

${renderedProducts}

^FO20,${addressBoxY}^GB760,${addressBoxHeight},2^FS

^CF0,22
^FO35,${addressBoxY + 15}^FH^FDDETALLE DE ENVIO^FS

${renderFieldBlock(addressLines, addressStartY, 26, addressLineHeight, (value) => this.encodeFieldData(value))}

^FO20,${contactBoxY}^GB760,${contactBoxHeight},2^FS

^CF0,22
^FO35,${contactBoxY + 25}^FH^FDCONTACTO^FS

^CF0,28
^FO180,${contactBoxY + 20}^FH^FD${contactLine}^FS

^XZ`;
  }

  private renderWithTemplate(data: {
    id: string;
    externalReference: string;
    reason: string;
    products: LabelProductInput[];
    address: string;
    phone: string;
    receiver: string;
    originCompany: string;
    destinationCompany: string;
  }): string {
    const flattened: Record<string, string> = {
      externalReference: data.externalReference,
      reason: data.reason,
      productDescription: data.products.map((product) => `${product.quantity} x ${product.productName}`).join(', '),
      address: data.address,
      phone: data.phone,
      receiver: data.receiver,
      originCompany: data.originCompany,
      destinationCompany: data.destinationCompany,
    };

    let result = this.template;
    for (const [key, value] of Object.entries(flattened)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(placeholder, this.sanitizeForTemplate(value));
    }
    return result;
  }

  private sanitizeForTemplate(value: string): string {
    return value.replace(/[\^~]/g, ' ');
  }

  private encodeFieldData(value: string): string {
    return encodeZplFieldDataUtf8(value);
  }
}

export const zplTemplateEngine = new ZplTemplateEngine();
