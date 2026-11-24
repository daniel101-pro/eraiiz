import { getValidAccessToken } from '../../utils/auth';

export async function adminFetch(path: string, options: RequestInit = {}) {
  const token = await getValidAccessToken();
  if (!token) {
    const error = new Error('Sign in required') as Error & { status?: number };
    error.status = 401;
    throw error;
  }
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('X-Requested-With', 'EraiizAdmin');
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...options,
    headers,
    cache: 'no-store',
    credentials: 'same-origin',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Admin request failed') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return data;
}
