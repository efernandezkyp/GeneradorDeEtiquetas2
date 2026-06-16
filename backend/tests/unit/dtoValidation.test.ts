import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  createCompanySchema,
  createUserSchema,
  createLabelSchema,
  passwordSchema,
} from '../../src/application/dto';

describe('DTO Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({ email: 'invalid', password: 'pass' });
      expect(result.success).toBe(false);
    });
  });

  describe('passwordSchema', () => {
    it('should accept valid password', () => {
      expect(passwordSchema.safeParse('SuperAdmin123*').success).toBe(true);
    });

    it('should reject weak password', () => {
      expect(passwordSchema.safeParse('weak').success).toBe(false);
    });
  });

  describe('createCompanySchema', () => {
    it('should validate company data', () => {
      const result = createCompanySchema.safeParse({ name: 'Test Co', code: 'TEST' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid code', () => {
      const result = createCompanySchema.safeParse({ name: 'Test', code: 'test-lowercase' });
      expect(result.success).toBe(false);
    });
  });

  describe('createUserSchema', () => {
    it('should validate user data', () => {
      const result = createUserSchema.safeParse({
        companyId: 'c1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SuperAdmin123*',
        role: 'ADMIN',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('createLabelSchema', () => {
    it('should validate label data', () => {
      const result = createLabelSchema.safeParse({
        externalReference: 'REF-001',
        reason: 'Entrega',
        products: [{ productName: 'Producto', quantity: 1 }],
        address: 'Calle 1',
        phone: '555-1234',
        receiver: 'Juan',
        originCompany: 'Empresa A',
        destinationCompany: 'Empresa B',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing fields', () => {
      const result = createLabelSchema.safeParse({ externalReference: 'REF-001' });
      expect(result.success).toBe(false);
    });
  });
});
