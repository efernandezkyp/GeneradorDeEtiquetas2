const fallbackApiUrl = 'http://localhost:3001/api';

function stripWrappingQuotes(value: string): string {
  return value.replace(/^['"]+|['"]+$/g, '');
}

function normalizeApiUrl(value?: string): string {
  if (!value) {
    return fallbackApiUrl;
  }

  const sanitizedValue = stripWrappingQuotes(value.trim()).replace(/\/+$/, '');
  if (!sanitizedValue) {
    return fallbackApiUrl;
  }

  try {
    const parsedUrl = new URL(sanitizedValue);
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, '');

    if (!parsedUrl.pathname || parsedUrl.pathname === '/') {
      parsedUrl.pathname = '/api';
    } else if (!parsedUrl.pathname.endsWith('/api')) {
      parsedUrl.pathname = `${parsedUrl.pathname}/api`;
    }

    return parsedUrl.toString().replace(/\/$/, '');
  } catch {
    return sanitizedValue.endsWith('/api') ? sanitizedValue : `${sanitizedValue}/api`;
  }
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${env.apiUrl}${normalizedPath}`;
}

export const env = {
  apiUrl: normalizeApiUrl(import.meta.env.VITE_API_URL),
  appName: 'Sistema Multiempresa de Etiquetas ZPL',
};
