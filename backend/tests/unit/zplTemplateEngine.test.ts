import { describe, it, expect } from 'vitest';
import { ZplTemplateEngine } from '../../src/infrastructure/zpl/templateEngine';

describe('ZplTemplateEngine', () => {
  const engine = new ZplTemplateEngine('^XA^FD{{externalReference}} - {{reason}}^XZ');
  const baseData = {
    externalReference: 'REF-001',
    reason: 'Entrega',
    products: [{ productName: 'Producto de prueba', quantity: 2 }],
    address: 'Calle 123',
    phone: '555-1234',
    receiver: 'Juan Perez',
    originCompany: 'Empresa A',
    destinationCompany: 'Empresa B',
  };

  it('should replace placeholders with values', () => {
    const result = engine.generate(baseData);
    expect(result).toBe('^XA^FDREF-001 - Entrega^XZ');
  });

  it('should escape ZPL special characters', () => {
    const result = engine.generate({
      ...baseData,
      externalReference: 'TEST^123',
      reason: 'Motivo~test',
    });
    expect(result).toContain('TEST_123');
    expect(result).toContain('Motivo_test');
  });

  it('should handle empty values', () => {
    const result = engine.generate({
      ...baseData,
      externalReference: '',
      reason: '',
      products: [{ productName: '', quantity: 1 }],
    });
    expect(result).toBe('^XA^FD - ^XZ');
  });

  it('should use default template with all fields', () => {
    const defaultEngine = new ZplTemplateEngine();
    const result = defaultEngine.generate({
      externalReference: 'REF-001',
      reason: 'Entrega urgente',
      products: [{ productName: 'Producto de prueba', quantity: 4 }],
      address: 'Calle 123',
      phone: '555-1234',
      receiver: 'Juan Perez',
      originCompany: 'Empresa A',
      destinationCompany: 'Empresa B',
    });
    expect(result).toContain('REF-001');
    expect(result).toContain('Entrega urgente');
    expect(result).toContain('Empresa A');
    expect(result).toContain('Empresa B');
    expect(result).toContain('^XZ');
  });

  it('should expand the label as more products are added', () => {
    const defaultEngine = new ZplTemplateEngine();
    const shortResult = defaultEngine.generate({
      ...baseData,
      products: [{ productName: 'Producto corto', quantity: 1 }],
    });
    const longResult = defaultEngine.generate({
      ...baseData,
      products: [
        { productName: 'Producto corto', quantity: 1 },
        { productName: 'Segundo producto con descripcion larga para ocupar varias lineas', quantity: 3 },
        { productName: 'Tercer producto', quantity: 5 },
      ],
    });

    expect(shortResult).toContain('^FDNOMBRE DE PRODUCTO^FS');
    expect(longResult).toContain('^FD5^FS');
    expect(longResult.length).toBeGreaterThan(shortResult.length);
  });
});
