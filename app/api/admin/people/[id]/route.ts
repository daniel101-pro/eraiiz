import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { buildPersonActivity, collectAdminPeople, matchesPerson } from '@/lib/adminPeople';
import { secureAdminJson } from '@/lib/adminSecurity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { id } = await params;
  const authHeader = request.headers.get('authorization') || '';
  const { people, orders } = await collectAdminPeople(authHeader);
  const person = people.find((item) => matchesPerson(item, decodeURIComponent(id)));

  if (!person) {
    return secureAdminJson({ message: 'Person not found' }, { status: 404 });
  }

  const activity = await buildPersonActivity(person, orders);
  return secureAdminJson(activity);
}
