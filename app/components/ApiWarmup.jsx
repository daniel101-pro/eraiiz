'use client';

import { useEffect } from 'react';

/**
 * Fire-and-forget ping so Render stays warm while people browse.
 */
export default function ApiWarmup() {
  useEffect(() => {
    const key = 'eraiiz_warmup_at';
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last < 4 * 60 * 1000) return;

    sessionStorage.setItem(key, String(Date.now()));
    const controller = new AbortController();
    fetch('/api/warmup', {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    }).catch(() => {});

    return () => controller.abort();
  }, []);

  return null;
}
