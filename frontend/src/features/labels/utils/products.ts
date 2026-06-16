import type { Label, LabelProduct } from '../../../shared/types/api';

export function parseLabelProducts(label: Pick<Label, 'productsJson' | 'productDescription'>): LabelProduct[] {
  if (label.productsJson) {
    try {
      const parsed = JSON.parse(label.productsJson) as LabelProduct[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((product) => ({
          productName: product.productName,
          quantity: Number(product.quantity),
        }));
      }
    } catch {
      // Fallback for legacy values.
    }
  }

  if (!label.productDescription.trim()) {
    return [{ productName: '', quantity: 1 }];
  }

  return [{ productName: label.productDescription, quantity: 1 }];
}
