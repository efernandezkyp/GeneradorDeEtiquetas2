function normalizeApiUrl(value?: string): string {
  const fallback = 'http://localhost:3001/api';
  if (!value) {
    return fallback;
  }

  const trimmedValue = value.trim().replace(/\/+$/, '');
  if (!trimmedValue) {
    return fallback;
  }

  return trimmedValue.endsWith('/api') ? trimmedValue : `${trimmedValue}/api`;
}

export const env = {
  apiUrl: normalizeApiUrl(import.meta.env.VITE_API_URL),
  appName: 'Sistema Multiempresa de Etiquetas ZPL',
};
