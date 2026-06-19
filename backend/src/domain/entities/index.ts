import { Role, LabelStatus } from '../enums';

export interface CompanyEntity {
  id: string;
  name: string;
  code: string;
  defaultOriginCompany: string;
  defaultDestinationCompany: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserEntity {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  role: Role;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LabelEntity {
  id: string;
  companyId: string;
  externalReference: string;
  reason: string;
  productDescription: string;
  productsJson: string;
  address: string;
  phone: string;
  receiver: string;
  originCompany: string;
  destinationCompany: string;
  zplContent: string;
  createdBy: string;
  status: LabelStatus;
  scannedBy: string | null;
  scannedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogEntity {
  id: string;
  userId: string | null;
  companyId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface RefreshTokenEntity {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}
