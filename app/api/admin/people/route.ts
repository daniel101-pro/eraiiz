import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { collectAdminPeople, isUserRole } from '@/lib/adminPeople';
import { secureAdminJson } from '@/lib/adminSecurity';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const authHeader = request.headers.get('authorization') || '';
  const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
  const role = (request.nextUrl.searchParams.get('role') || 'all').trim().toLowerCase();

  const { people, sources, warnings } = await collectAdminPeople(authHeader);
  const backendLinked = sources.some((source) => source.includes('/api/admin/users'));

  const list = people.filter((person) => {
    const roleOk =
      role === 'all' ||
      (role === 'seller' && person.role === 'seller') ||
      (role === 'user' && isUserRole(person.role)) ||
      person.role === role;
    if (!roleOk) return false;
    if (!q) return true;
    return [person.name, person.email, person.role, person.id, person.plan]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  return secureAdminJson({
    people: list,
    meta: {
      count: list.length,
      role,
      sources,
      warnings,
      backendLinked,
      generatedAt: new Date().toISOString(),
    },
  });
}
