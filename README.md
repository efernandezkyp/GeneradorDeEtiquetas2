# Sistema Multiempresa de Etiquetas ZPL

Aplicacion full stack para gestion multiempresa de etiquetas ZPL con backend en Node.js + Express + Prisma y frontend en React + Vite + TypeScript.

## Stack

- Backend: Node.js, TypeScript, Express, Prisma, SQLite, JWT, Google OAuth, Zod, Vitest
- Frontend: React, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, Material UI, Vitest
- Infraestructura: Docker, Docker Compose

## Arquitectura

- `backend/src/domain`: entidades, enums, errores e interfaces
- `backend/src/application`: DTOs y servicios de negocio
- `backend/src/infrastructure`: Prisma, auth, logging, repositorios y motor ZPL
- `backend/src/presentation`: controladores, middlewares y rutas
- `frontend/src/features`: modulos por dominio
- `frontend/src/shared`: cliente HTTP, tipos, storage, componentes y utilidades
- `frontend/src/app`: providers, layout, guards, router y tema

## Caracteristicas implementadas

- Multiempresa con aislamiento por `companyId`
- Roles `SUPER_ADMIN`, `ADMIN` y `ASESOR`
- Login con email/password y refresh tokens
- OAuth Google sin autocreacion de usuarios
- CRUD de empresas, usuarios y etiquetas
- Vista previa ZPL, descarga, impresion y duplicado
- Dashboard con metricas segun permisos
- Auditoria y logging centralizado
- Seeds iniciales para compania `SYSTEM` y usuario `superadmin@system.local`

## Requisitos

- Node.js 22+
- npm 10+

## Instalacion local

### 1. Backend

```bash
cd backend
copy .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Credenciales iniciales

- Email: `superadmin@system.local`
- Password: `SuperAdmin123*`

## Tests

### Backend

```bash
cd backend
npm test
```

### Frontend

```bash
cd frontend
npm test
```

## Build

### Backend

```bash
cd backend
npm run build
```

### Frontend

```bash
cd frontend
npm run build
```

## Docker

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## Notas

- La persistencia de aplicacion usa Prisma y evita SQL hardcodeado.
- La base arranca en SQLite, pero la capa de acceso queda preparada para migrar a otros motores soportados por Prisma.
- Para Google OAuth debes completar `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_CALLBACK_URL`.
