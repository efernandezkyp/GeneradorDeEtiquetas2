# Despliegue

## Opcion Docker Compose

1. Ajusta secretos y variables en `docker-compose.yml`.
2. Configura credenciales reales de Google OAuth.
3. Ejecuta:

```bash
docker compose up --build -d
```

4. Verifica:

- Frontend en `http://localhost:3000`
- Backend en `http://localhost:3001`
- Healthcheck en `http://localhost:3001/health`

## Opcion manual

### Backend

```bash
cd backend
copy .env.example .env
npm ci
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm ci
npm run build
npx serve -s dist -l 3000
```

## Checklist previa a produccion

- Reemplazar `JWT_SECRET` y `JWT_REFRESH_SECRET`
- Configurar `CORS_ORIGIN` y `FRONTEND_URL`
- Configurar `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y callback real
- Mover `DATABASE_URL` a un volumen persistente o motor gestionado
- Activar backups y monitoreo
- Añadir TLS y proxy reverso en el entorno final

## Migracion de motor de base de datos

La aplicacion usa Prisma en toda la capa de persistencia. Para migrar a MySQL, PostgreSQL o SQL Server:

1. Cambia el `provider` y `DATABASE_URL` en `backend/prisma/schema.prisma`
2. Regenera cliente con `npx prisma generate`
3. Crea y aplica migraciones del nuevo motor
4. Valida integraciones y permisos multiempresa
