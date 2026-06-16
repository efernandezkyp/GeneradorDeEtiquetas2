import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index';

describe('Auth Integration', () => {
  let accessToken: string;
  let refreshToken: string;

  it('should login with valid credentials', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'superadmin@system.local',
      password: 'SuperAdmin123*',
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();
    expect(response.body.data.user.email).toBe('superadmin@system.local');

    accessToken = response.body.data.accessToken;
    refreshToken = response.body.data.refreshToken;
  });

  it('should reject invalid credentials', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'superadmin@system.local',
      password: 'wrongpassword',
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('should refresh token', async () => {
    const response = await request(app).post('/api/auth/refresh').send({ refreshToken });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeDefined();
    accessToken = response.body.data.accessToken;
    refreshToken = response.body.data.refreshToken;
  });

  it('should return current authenticated user', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe('superadmin@system.local');
    expect(response.body.data.role).toBe('SUPER_ADMIN');
  });

  it('should get dashboard stats', async () => {
    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('totalLabels');
    expect(response.body.data).toHaveProperty('activeCompanies');
  });

  it('should list companies as super admin', async () => {
    const response = await request(app)
      .get('/api/companies')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('should create and manage labels', async () => {
    const createResponse = await request(app)
      .post('/api/labels')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        externalReference: 'TEST-REF-001',
        reason: 'Entrega de prueba',
        products: [{ productName: 'Producto de prueba', quantity: 2 }],
        address: 'Calle Test 123',
        phone: '555-0000',
        receiver: 'Test Receiver',
        originCompany: 'Empresa Origen',
        destinationCompany: 'Empresa Destino',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.zplContent).toContain('TEST-REF-001');

    const labelId = createResponse.body.data.id;

    const duplicateResponse = await request(app)
      .post(`/api/labels/${labelId}/duplicate`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(duplicateResponse.status).toBe(201);
    expect(duplicateResponse.body.data.externalReference).toContain('COPY');

    const zplResponse = await request(app)
      .get(`/api/labels/${labelId}/zpl`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(zplResponse.status).toBe(200);
    expect(zplResponse.body.data.zpl).toContain('^XA');
  });

  it('should reject unauthenticated requests', async () => {
    const response = await request(app).get('/api/labels');
    expect(response.status).toBe(401);
  });

  it('health check should work', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});
