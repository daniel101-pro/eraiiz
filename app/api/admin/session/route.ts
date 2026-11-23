import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { secureAdminJson } from '@/lib/adminSecurity';
import { upsertDirectoryUser } from '@/lib/userDirectoryStore';

export async function GET(request: NextRequest) {
  const { session, error } = await requireAdmin(request);
  if (error) return error;
  void upsertDirectoryUser({
    id: session.id,
    email: session.email,
    name: session.name,
    role: session.role || 'admin',
    source: 'admin-session',
  }).catch(() => {});
  return secureAdminJson(session);
}
