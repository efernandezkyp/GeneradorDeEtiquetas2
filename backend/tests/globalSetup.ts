import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function globalSetup(): Promise<() => void> {
  const backendRoot = path.resolve(__dirname, '..');
  const testDbPath = path.resolve(backendRoot, 'test.db');

  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  const env = {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: 'file:./test.db',
    JWT_SECRET: 'test-jwt-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
  };

  execSync('npx prisma db push --force-reset --skip-generate', {
    cwd: backendRoot,
    env,
    stdio: 'pipe',
  });

  execSync('npx tsx prisma/seed.ts', {
    cwd: backendRoot,
    env,
    stdio: 'pipe',
  });

  return () => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  };
}
