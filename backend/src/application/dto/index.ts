import { z } from 'zod';
import { Role } from '../../domain/enums';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido'),
});

export const googleTokenSchema = z.object({
  idToken: z.string().min(1, 'ID token requerido'),
});

export const createCompanySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  code: z
    .string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(20, 'El código no puede exceder 20 caracteres')
    .regex(/^[A-Z0-9_]+$/, 'El código solo puede contener letras mayúsculas, números y guiones bajos'),
  defaultOriginCompany: z.string().min(1, 'Empresa origen requerida'),
  defaultDestinationCompany: z.string().min(1, 'Empresa destino requerida'),
  active: z.boolean().optional().default(true),
});

export const updateCompanySchema = createCompanySchema.partial();

export const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    'Debe incluir mayúscula, minúscula, número y carácter especial',
  );

export const createUserSchema = z.object({
  companyId: z.string().min(1, 'Empresa requerida'),
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  email: z.string().email('Email inválido'),
  password: passwordSchema,
  role: z.nativeEnum(Role),
  active: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: passwordSchema.optional(),
  role: z.nativeEnum(Role).optional(),
  active: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export const createLabelSchema = z.object({
  externalReference: z.string().min(1, 'Referencia externa requerida'),
  reason: z.string().min(1, 'Motivo requerido'),
  products: z
    .array(
      z.object({
        productName: z.string().min(1, 'Nombre del producto requerido'),
        quantity: z.coerce.number().int().positive('Cantidad debe ser mayor a cero'),
      }),
    )
    .min(1, 'Debe agregar al menos un producto'),
  address: z.string().min(1, 'Dirección requerida'),
  phone: z.string().min(1, 'Teléfono requerido'),
  receiver: z.string().min(1, 'Destinatario requerido'),
});

export const updateLabelSchema = createLabelSchema.partial();

export const bulkCreateLabelsSchema = z.object({
  labels: z.array(createLabelSchema).min(1, 'Debe enviar al menos una etiqueta'),
});

export const labelFiltersSchema = z.object({
  externalReference: z.string().optional(),
  receiver: z.string().optional(),
  createdBy: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const scanLabelSchema = z.object({
  qrData: z.string().min(1, 'Datos QR requeridos'),
});

export const bulkDeleteLabelsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'Debe enviar al menos un ID'),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type CreateCompanyDto = z.infer<typeof createCompanySchema>;
export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type CreateLabelDto = z.infer<typeof createLabelSchema>;
export type UpdateLabelDto = z.infer<typeof updateLabelSchema>;
export type LabelFiltersDto = z.infer<typeof labelFiltersSchema>;
export type ScanLabelDto = z.infer<typeof scanLabelSchema>;
