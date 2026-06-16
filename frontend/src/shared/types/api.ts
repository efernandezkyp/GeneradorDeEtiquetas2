export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'ASESOR';

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
  createdBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
