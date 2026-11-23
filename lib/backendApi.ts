export const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

export async function fetchBackend(
  path: string,
  init: RequestInit & { timeoutMs?: number; revalidate?: number | false } = {}
) {
  const { timeoutMs = 12000, revalidate = 60, ...rest } = init;
  const url = path.startsWith('http') ? path : `${BACKEND_API_URL}${path}`;

  const response = await fetch(url, {
    ...rest,
    signal: rest.signal || AbortSignal.timeout(timeoutMs),
    next:
      revalidate === false
        ? { revalidate: 0 }
        : {
            revalidate: typeof revalidate === 'number' ? revalidate : 60,
          },
  });

  return response;
}

export async function warmBackend() {
  const started = Date.now();
  const results = await Promise.allSettled([
    fetchBackend('/api/products?limit=12', { timeoutMs: 15000, revalidate: false }),
    fetchBackend('/api/products/random?limit=4', { timeoutMs: 15000, revalidate: false }),
  ]);

  return {
    ok: results.some((result) => result.status === 'fulfilled' && result.value.ok),
    ms: Date.now() - started,
    checks: results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return { index, ok: result.value.ok, status: result.value.status };
      }
      return {
        index,
        ok: false,
        error: result.reason instanceof Error ? result.reason.message : 'failed',
      };
    }),
  };
}
