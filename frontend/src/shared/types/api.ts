export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'ASESOR' | 'PICKER';
export type LabelStatus = 'PENDIENTE' | 'DESPACHADA';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  companyId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  defaultOriginCompany: string;
  defaultDestinationCompany: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabelProduct {
  productName: string;
  quantity: number;
}

export interface Label {
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
  createdAt: string;
  updatedAt: string;
  downloaded?: boolean;
  downloadCount?: number;
  lastDownloadedAt?: string | null;
  status?: LabelStatus;
  scannedBy?: string | null;
  scannedAt?: string | null;
}

export interface LabelHistoryChange {
  field: string;
  label: string;
  from: string;
  to: string;
}

export interface LabelHistoryEntry {
  id: string;
  action: string;
  createdAt: string;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  ipAddress: string | null;
  summary: string;
  changes: LabelHistoryChange[];
  metadata?: Record<string, unknown> | null;
}

export interface LabelDetail {
  label: Label;
  history: LabelHistoryEntry[];
}

export interface DashboardStats {
  totalLabels: number;
  labelsThisMonth: number;
  activeUsers: number;
  activeCompanies?: number;
}

export interface PaginatedLabels {
  labels: Label[];
  total: number;
}

export interface LabelFilters {
  externalReference?: string;
  receiver?: string;
  createdBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
