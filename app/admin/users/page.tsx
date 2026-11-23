'use client';

import DirectoryPanel from '../../components/admin/DirectoryPanel';

export default function AdminUsersPage() {
  return (
    <DirectoryPanel
      title="Users"
      subtitle="All registered accounts — buyers, sellers, and shoppers."
      role="all"
    />
  );
}
