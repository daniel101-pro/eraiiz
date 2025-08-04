'use client';

import React from 'react';
import AdminLayout from '../components/AdminLayout';
import ShippingManager from '../components/ShippingManager';

export default function ShippingPage() {
  return (
    <AdminLayout>
      <ShippingManager />
    </AdminLayout>
  );
}