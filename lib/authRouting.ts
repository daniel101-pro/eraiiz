export function normalizeRole(role?: string | null) {
  return String(role || '').trim().toLowerCase();
}

export function isPendingRole(role?: string | null) {
  return normalizeRole(role) === 'pending';
}

export function homePathForRole(role?: string | null) {
  const value = normalizeRole(role);
  if (value === 'seller') return '/dashboard/seller';
  if (value === 'buyer') return '/dashboard/buyer';
  if (value === 'pending') return '/role-selection';
  return '/dashboard/buyer';
}
