const DEFAULT_ADMIN_EMAILS = [
  'projecterraiz@gmail.com',
  'falodun379@gmail.com',
];

function adminAllowlist() {
  const extra = String(process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(/[,\s]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_ADMIN_EMAILS, ...extra]);
}

export function normalizeRole(role?: string | null) {
  return String(role || '').trim().toLowerCase();
}

export function isPendingRole(role?: string | null) {
  return normalizeRole(role) === 'pending';
}

export function isSellerRole(role?: string | null) {
  return normalizeRole(role) === 'seller';
}

export function isAdminRole(role?: string | null) {
  return normalizeRole(role) === 'admin';
}

export function isAdminEmail(email?: string | null) {
  return adminAllowlist().has(String(email || '').trim().toLowerCase());
}

export function isAdminAccount(input?: { role?: string | null; email?: string | null } | null) {
  if (!input) return false;
  return isAdminRole(input.role) || isAdminEmail(input.email);
}

export function homePathForRole(role?: string | null, email?: string | null) {
  if (isAdminAccount({ role, email })) return '/admin';
  const value = normalizeRole(role);
  if (value === 'seller') return '/dashboard/seller';
  if (value === 'buyer') return '/dashboard/buyer';
  if (value === 'pending') return '/role-selection';
  return '/dashboard/buyer';
}
