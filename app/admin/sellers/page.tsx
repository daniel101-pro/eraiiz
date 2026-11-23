'use client';

import DirectoryPanel from '../../components/admin/DirectoryPanel';

export default function AdminSellersPage() {
  return (
    <DirectoryPanel
      title="Sellers"
      subtitle="Seller accounts, plans, listings, and sales activity."
      role="seller"
    />
  );
}
