import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { apiRoutes } from './presentation/routes';
import { errorHandler } from './presentation/middlewares/errorHandler';
import { requestLogger } from './presentation/middlewares/requestLogger';
import { logger } from './infrastructure/logging/logger';

const app = express();

// Render y otros proveedores pasan la IP real via X-Forwarded-*.
app.set('trust proxy', config.nodeEnv === 'production' ? 1 : false);

app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: { message: 'Demasiadas solicitudes', code: 'RATE_LIMIT' } },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: { message: 'Demasiados intentos de autenticación', code: 'RATE_LIMIT' },
  },
});

app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/google', authLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', apiRoutes);
app.use(errorHandler);

export { app };

export function startServer(): void {
  app.listen(config.port, () => {
    logger.info(`Servidor iniciado en puerto ${config.port}`, { env: config.nodeEnv });
  });
}

if (require.main === module) {
  startServer();
}
