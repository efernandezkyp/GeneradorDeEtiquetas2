import { describe, it, expect } from 'vitest';
import { TenantGuard } from '../../src/application/services/tenantGuard';
import { Role } from '../../src/domain/enums';
import { ForbiddenError } from '../../src/domain/errors';
import { TokenPayload } from '../../src/domain/interfaces';

const superAdmin: TokenPayload = {
  userId: '1',
  email: 'admin@test.com',
  role: Role.SUPER_ADMIN,
  companyId: 'company-1',
};

const admin: TokenPayload = {
  userId: '2',
  email: 'admin@company.com',
  role: Role.ADMIN,
  companyId: 'company-2',
};

const asesor: TokenPayload = {
  userId: '3',
  email: 'asesor@company.com',
  role: Role.ASESOR,
  companyId: 'company-2',
};

describe('TenantGuard', () => {
  describe('assertCompanyAccess', () => {
    it('should allow super admin to access any company', () => {
      expect(() => TenantGuard.assertCompanyAccess(superAdmin, 'any-company')).not.toThrow();
    });

    it('should allow user to access own company', () => {
      expect(() => TenantGuard.assertCompanyAccess(admin, 'company-2')).not.toThrow();
    });

    it('should deny access to other company', () => {
      expect(() => TenantGuard.assertCompanyAccess(admin, 'company-1')).toThrow(ForbiddenError);
    });
  });

  describe('getCompanyFilter', () => {
    it('should return undefined for super admin', () => {
      expect(TenantGuard.getCompanyFilter(superAdmin)).toBeUndefined();
    });

    it('should return companyId for other roles', () => {
      expect(TenantGuard.getCompanyFilter(admin)).toBe('company-2');
    });
  });

  describe('assertCanManageCompanies', () => {
    it('should allow super admin', () => {
      expect(() => TenantGuard.assertCanManageCompanies(superAdmin)).not.toThrow();
    });

    it('should deny admin', () => {
      expect(() => TenantGuard.assertCanManageCompanies(admin)).toThrow(ForbiddenError);
    });
  });

  describe('assertCanManageUsers', () => {
    it('should allow super admin for any company', () => {
      expect(() => TenantGuard.assertCanManageUsers(superAdmin, 'any')).not.toThrow();
    });

    it('should allow admin for own company', () => {
      expect(() => TenantGuard.assertCanManageUsers(admin, 'company-2')).not.toThrow();
    });

    it('should deny admin for other company', () => {
      expect(() => TenantGuard.assertCanManageUsers(admin, 'company-1')).toThrow(ForbiddenError);
    });

    it('should deny asesor', () => {
      expect(() => TenantGuard.assertCanManageUsers(asesor, 'company-2')).toThrow(ForbiddenError);
    });
  });

  describe('assertCanManageLabels', () => {
    it('should allow all roles', () => {
      expect(() => TenantGuard.assertCanManageLabels(superAdmin)).not.toThrow();
      expect(() => TenantGuard.assertCanManageLabels(admin)).not.toThrow();
      expect(() => TenantGuard.assertCanManageLabels(asesor)).not.toThrow();
    });
  });
});
