'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPeopleRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/users');
  }, [router]);
  return (
    <div className="flex h-[40vh] items-center justify-center text-sm text-gray-500">
      Redirecting to Users…
    </div>
  );
}
