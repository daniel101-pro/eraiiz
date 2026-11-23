import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { secureAdminJson } from '@/lib/adminSecurity';

export async function GET(request: NextRequest) {
  const { session, error } = await requireAdmin(request);
  if (error) return error;
  return secureAdminJson(session);
}
