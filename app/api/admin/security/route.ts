import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import {
  adminSecuritySnapshot,
  listAdminAudit,
  secureAdminJson,
} from '@/lib/adminSecurity';

export async function GET(request: NextRequest) {
  const { session, error } = await requireAdmin(request);
  if (error) return error;

  const audit = await listAdminAudit(80);
  return secureAdminJson({
    session: {
      id: session.id,
      email: session.email,
      name: session.name,
      role: session.role,
    },
    controls: adminSecuritySnapshot(),
    audit,
    generatedAt: new Date().toISOString(),
  });
}
