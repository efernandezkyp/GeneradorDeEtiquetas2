import {
  CompanyEntity,
  UserEntity,
  LabelEntity,
  AuditLogEntity,
  RefreshTokenEntity,
} from '../entities';
import { Role, AuditAction } from '../enums';

export interface LabelProductInput {
  productName: string;
  quantity: number;
}

export interface CreateCompanyData {
  name: string;
  code: string;
  defaultOriginCompany: string;
  defaultDestinationCompany: string;
  active?: boolean;
}

export interface UpdateCompanyData {
  name?: string;
  code?: string;
  defaultOriginCompany?: string;
  defaultDestinationCompany?: string;
  active?: boolean;
}

export interface CreateUserData {
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  googleId?: string;
  role: Role;
  active?: boolean;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: Role;
  active?: boolean;
  googleId?: string;
}

export interface CreateLabelData {
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
}

export interface UpdateLabelData {
  externalReference?: string;
  reason?: string;
  productDescription?: string;
  productsJson?: string;
  address?: string;
  phone?: string;
  receiver?: string;
  originCompany?: string;
  destinationCompany?: string;
  zplContent?: string;
}

export interface LabelFilters {
  companyId?: string;
  externalReference?: string;
  createdBy?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface CreateAuditLogData {
  userId?: string;
  companyId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
}

export interface ICompanyRepository {
  findAll(): Promise<CompanyEntity[]>;
  findById(id: string): Promise<CompanyEntity | null>;
  findByCode(code: string): Promise<CompanyEntity | null>;
  create(data: CreateCompanyData): Promise<CompanyEntity>;
  update(id: string, data: UpdateCompanyData): Promise<CompanyEntity>;
  countActive(): Promise<number>;
}

export interface IUserRepository {
  findAll(companyId?: string): Promise<UserEntity[]>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByGoogleId(googleId: string): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
  update(id: string, data: UpdateUserData): Promise<UserEntity>;
  countActive(companyId?: string): Promise<number>;
}

export interface ILabelRepository {
  findAll(filters: LabelFilters): Promise<{ labels: LabelEntity[]; total: number }>;
  findById(id: string): Promise<LabelEntity | null>;
  create(data: CreateLabelData): Promise<LabelEntity>;
  update(id: string, data: UpdateLabelData): Promise<LabelEntity>;
  delete(id: string): Promise<void>;
  count(companyId?: string): Promise<number>;
  countThisMonth(companyId?: string): Promise<number>;
}

export interface IAuditLogRepository {
  create(data: CreateAuditLogData): Promise<AuditLogEntity>;
}

export interface IRefreshTokenRepository {
  create(userId: string, token: string, expiresAt: Date): Promise<RefreshTokenEntity>;
  findByToken(token: string): Promise<RefreshTokenEntity | null>;
  deleteByToken(token: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}

export interface IZplTemplateEngine {
  generate(data: {
    externalReference: string;
    reason: string;
    products: LabelProductInput[];
    address: string;
    phone: string;
    receiver: string;
    originCompany: string;
    destinationCompany: string;
  }): string;
}

export interface ITokenService {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(payload: TokenPayload): string;
  verifyAccessToken(token: string): TokenPayload;
  verifyRefreshToken(token: string): TokenPayload;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  companyId: string;
}

export interface IGoogleAuthService {
  verifyIdToken(idToken: string): Promise<{ googleId: string; email: string; firstName: string; lastName: string }>;
  getAuthUrl(): string;
  getTokensFromCode(code: string): Promise<{ idToken: string }>;
}

export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}
