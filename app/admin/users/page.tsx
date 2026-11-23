'use client';

import DirectoryPanel from '../../components/admin/DirectoryPanel';

export default function AdminUsersPage() {
  return (
    <DirectoryPanel
      title="Users"
      subtitle="Buyers and shoppers — purchases, spend, and full activity trail."
      role="user"
    />
  );
}
