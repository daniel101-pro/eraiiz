import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import {
  createMailIdentity,
  deleteMailIdentity,
  listMailIdentities,
  mailIdentityDomain,
} from '@/lib/mailIdentitiesStore';
import { recordAdminAudit, secureAdminJson } from '@/lib/adminSecurity';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const identities = await listMailIdentities();
  return secureAdminJson({
    identities,
    domain: mailIdentityDomain(),
  });
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const localPart = String(body.localPart || body.name || body.email || '').trim();
  const displayName = String(body.displayName || body.label || '').trim();

  try {
    const identity = await createMailIdentity({
      localPart,
      displayName,
      createdBy: session.email,
    });
    await recordAdminAudit(request, session, {
      action: 'mail.identity.create',
      resource: `identity:${identity.email}`,
    });
    return secureAdminJson({ ok: true, identity, domain: mailIdentityDomain() });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Could not create address' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { session, error } = await requireAdmin(request);
  if (error) return error;

  const localPart =
    request.nextUrl.searchParams.get('localPart') ||
    String((await request.json().catch(() => ({}))).localPart || '').trim();

  try {
    await deleteMailIdentity(localPart);
    await recordAdminAudit(request, session, {
      action: 'mail.identity.delete',
      resource: `identity:${localPart}@eraiiz.com`,
    });
    return secureAdminJson({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Could not delete address' },
      { status: 400 }
    );
  }
}
