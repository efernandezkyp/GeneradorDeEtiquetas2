# Plan: Rol Picker - Escaneo QR de Etiquetas

## Estado Actual
- **Backend**: Completo ✅ (pickerService, pickerController, migration, routes, DI container)
- **Frontend**: Sin implementar ❌

## Cambios Necesarios

### 1. Tipos - Agregar `PICKER`
**Archivo:** `frontend/src/shared/types/api.ts`
```diff
- export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'ASESOR';
+ export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'ASESOR' | 'PICKER';
```

### 2. RoleBadge - Agregar label
**Archivo:** `frontend/src/shared/components/RoleBadge.tsx`
```diff
  const roleLabels: Record<Role, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    ASESOR: 'Asesor',
+   PICKER: 'Picker',
  };
```

**Archivo:** Label interface en `api.ts` - agregar campos que devuelve el backend:
```diff
export interface Label {
  ...
+ status?: LabelStatus;
+ scannedBy?: string | null;
+ scannedAt?: string | null;
}
```

### 3. Frontend Scan Page
**Nuevo archivo:** `frontend/src/features/picker/pages/PickerScanPage.tsx`

Componente principal que:
- Abre la cámara al montar el componente
- Escanea QR continuamente (la cámara no se cierra entre escaneos)
- Por cada QR escaneado → `POST /labels/scan` con `{ qrData }`
- Muestra lista con resultados (labelId, externalReference, status)
- Botón **"Finalizar"** → cierra cámara, muestra reporte
- Botón **"Compartir por WhatsApp"** → link `wa.me` con reporte
- Botón **"Descargar PDF"** → genera PDF con `jspdf` + `jspdf-autotable`

**Librería a instalar:** `html5-qrcode` para escaneo QR vía cámara.

Estructura del componente:
```tsx
// PickerScanPage.tsx
// - Estado: scannedLabels[], isScanning, showReport
// - useRef para instancia Html5Qrcode
// - useEffect para iniciar/detener cámara
// - scanLabel(): POST /labels/scan + agrega a lista
// - handleFinish(): cierra cámara, set showReport = true
// - sendWhatsApp(): genera wa.me link
// - downloadPdf(): genera y descarga PDF con jspdf
```

### 4. Router - Agregar ruta /scan
**Archivo:** `frontend/src/app/router.tsx`
```diff
  children: [
    { index: true, element: <DashboardPage /> },
+   { path: 'scan', element: <PickerScanPage /> },
    ...
  ]
```

### 5. ProtectedRoute - Guard para PICKER
**Archivo:** `frontend/src/app/guards/ProtectedRoute.tsx`
- Agregar lógica: si el usuario es `PICKER`, redirigir a `/scan` en lugar del dashboard
- O mejor: crear un `PickerRoute` wrapper que renderice solo si el rol es `PICKER`

**Opción recomendada:** Usar `PickerRoute` en el router para la ruta `/scan`:
```tsx
{ path: 'scan', element: <PickerRoute><PickerScanPage /></PickerRoute> }
```

### 6. AppLayout - Nav item para PICKER
**Archivo:** `frontend/src/app/layout/AppLayout.tsx`
```diff
  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/', roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR'] },
    { label: 'Empresas', path: '/companies', roles: ['SUPER_ADMIN'] },
    { label: 'Usuarios', path: '/users', roles: ['SUPER_ADMIN', 'ADMIN'] },
    { label: 'Etiquetas', path: '/labels', roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR'] },
+   { label: 'Escanear', path: '/scan', roles: ['PICKER'] },
  ];
```

Además, el AppLayout actual tiene un `main` con `p: 4` que deja espacio lateral. Para la vista mobile del Picker, necesito detectar el rol y si es PICKER usar un layout full-width sin drawer lateral.

**Opción recomendada:** Cuando `user.role === 'PICKER'`, ocultar el Drawer y renderizar el contenido en full-width con estilos mobile-first.

### 7. PDF Generation
Instalar `jspdf` y `jspdf-autotable`:
```
npm install jspdf jspdf-autotable
```

El PDF debe incluir:
- Título "Reporte de Escaneo"
- Fecha y hora
- Tabla con: ID, Referencia, Estado, Hora de escaneo
- Resumen: Total etiquetas, Despachadas, Ya despachadas

### 8. WhatsApp Sharing
Usar URL: `https://wa.me/?text=...` con el reporte codificado como texto.

## Archivos a Modificar
1. `frontend/src/shared/types/api.ts` - agregar `PICKER` a Role, agregar status fields a Label
2. `frontend/src/shared/components/RoleBadge.tsx` - agregar label
3. `frontend/src/app/router.tsx` - agregar ruta `/scan`
4. `frontend/src/app/layout/AppLayout.tsx` - agregar nav item, layout responsivo para PICKER

## Archivos a Crear
1. `frontend/src/features/picker/pages/PickerScanPage.tsx` - página de escaneo
2. `frontend/src/app/guards/PickerRoute.tsx` - guard para rutas PICKER

## Dependencias a Instalar
- `html5-qrcode` - escaneo QR por cámara
- `jspdf` - generación de PDF
- `jspdf-autotable` - tablas en PDF

## Verificación
1. `cd frontend && npm run build` - sin errores de TypeScript ni build
2. Login con usuario PICKER → redirige a `/scan`
3. Cámara se abre, escanea QR, muestra resultados
4. Botón Finalizar → muestra reporte
5. WhatsApp y PDF funcionan
