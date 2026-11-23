'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminCatalogRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/products');
  }, [router]);
  return (
    <div className="flex h-[40vh] items-center justify-center text-sm text-gray-500">
      Opening products…
    </div>
  );
}
