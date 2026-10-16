import { getValidAccessToken } from '../../utils/auth';

export async function adminFetch(path: string, options: RequestInit = {}) {
  const token = await getValidAccessToken();
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Admin request failed') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return data;
}
