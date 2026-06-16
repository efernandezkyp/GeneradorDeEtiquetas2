import { z } from 'zod';

export const labelProductSchema = z.object({
  productName: z.string().min(1, 'El nombre del producto es obligatorio'),
  quantity: z.number().int().positive('La cantidad debe ser mayor a cero'),
});

export const labelSchema = z.object({
  externalReference: z.string().min(1, 'La referencia externa es obligatoria'),
  reason: z.string().min(1, 'El motivo es obligatorio'),
  products: z.array(labelProductSchema).min(1, 'Debe agregar al menos un producto'),
  address: z.string().min(1, 'La direccion es obligatoria'),
  phone: z.string().min(1, 'El telefono es obligatorio'),
  receiver: z.string().min(1, 'El destinatario es obligatorio'),
});

export type LabelFormValues = z.infer<typeof labelSchema>;
