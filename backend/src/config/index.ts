import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function parseCorsOrigins(value: string): string | string[] {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length <= 1) {
    return origins[0] ?? '';
  }

  return origins;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  databaseUrl: requireEnv('DATABASE_URL'),
  jwt: {
    secret: requireEnv('JWT_SECRET', 'dev-jwt-secret-change-me'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshSecret: requireEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3001/api/auth/google/callback',
  },
  cors: {
    origin: parseCorsOrigins(process.env.CORS_ORIGIN ?? 'http://localhost:5173'),
  },
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  logLevel: process.env.LOG_LEVEL ?? 'info',
} as const;

export type Config = typeof config;
