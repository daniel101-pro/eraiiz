import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import {
  appBaseUrl,
  createAdminInvite,
  listAdminOperators,
  revokeAdminOperator,
} from '@/lib/adminOperatorsStore';
import { escapeHtml, isEmailConfigured, sendEraiizEmail } from '@/lib/email';
import { renderEraiizEmailHtml } from '@/lib/emailLayout';
import { recordAdminAudit, secureAdminJson } from '@/lib/adminSecurity';
import { clientIp, rateLimit } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const operators = await listAdminOperators();
  return secureAdminJson({
    operators: operators.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      status: row.status,
      source: row.source,
      invitedBy: row.invitedBy,
      invitedAt: row.invitedAt,
      acceptedAt: row.acceptedAt,
      revokedAt: row.revokedAt,
      revokedBy: row.revokedBy,
      lastSeenAt: row.lastSeenAt,
      inviteExpiresAt: row.inviteExpiresAt,
    })),
    meta: {
      active: operators.filter((row) => row.status === 'active').length,
      invited: operators.filter((row) => row.status === 'invited').length,
      revoked: operators.filter((row) => row.status === 'revoked').length,
      resend: isEmailConfigured(),
    },
  });
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin(request);
  if (error) return error;

  const limited = rateLimit(`admin-invite:${session.email || clientIp(request)}`, 20, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ message: 'Too many invites. Try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim();

  if (!email.includes('@')) {
    return NextResponse.json({ message: 'Valid email required' }, { status: 400 });
  }

  try {
    const invite = await createAdminInvite({
      email,
      name,
      invitedBy: session.email,
    });

    const joinUrl = `${appBaseUrl()}/join-admin/${invite.inviteToken}`;
    let emailed = false;
    let emailError = '';

    if (isEmailConfigured()) {
      const sent = await sendEraiizEmail({
        to: email,
        subject: 'You’re invited to the Eraiiz admin panel',
        text: [
          `Hi${name ? ` ${name}` : ''},`,
          '',
          `${session.name || session.email} invited you to the Eraiiz admin panel.`,
          '',
          'Accept your invite (sign in with this email if prompted):',
          joinUrl,
          '',
          'This link expires in 7 days.',
          '',
          '— Eraiiz',
        ].join('\n'),
        html: renderEraiizEmailHtml({
          eyebrow: 'Admin access',
          title: 'You’re invited to Eraiiz Admin',
          bodyHtml: `
            <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#14231a">Hi${name ? ` ${escapeHtml(name)}` : ''},</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#14231a"><strong>${escapeHtml(session.name || session.email)}</strong> invited you to the Eraiiz admin panel.</p>
            <p style="margin:0;font-size:13px;line-height:1.5;color:#5b6b61">Sign in with <strong>${escapeHtml(email)}</strong>. This invite expires in 7 days.</p>
          `,
          cta: { label: 'Accept invite', href: joinUrl },
          fromLabel: 'Eraiiz Admin',
          footerNote: 'If you weren’t expecting this, you can ignore the email.',
        }),
        idempotencyKey: `admin-invite:${email}:${invite.inviteToken}`,
      });
      emailed = sent.ok;
      emailError = sent.error || '';
    }

    await recordAdminAudit(request, session, {
      action: 'operators.invite',
      resource: `admin:${email}`,
      detail: emailed ? 'emailed' : emailError || 'invite-created',
    });

    return secureAdminJson({
      ok: true,
      operator: {
        id: invite.id,
        email: invite.email,
        name: invite.name,
        status: invite.status,
        invitedAt: invite.invitedAt,
        inviteExpiresAt: invite.inviteExpiresAt,
      },
      joinUrl,
      emailed,
      emailError: emailed ? undefined : emailError || (isEmailConfigured() ? undefined : 'RESEND_API_KEY missing'),
    });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Could not create invite' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { session, error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const action = String(body.action || 'revoke').trim().toLowerCase();

  if (action !== 'revoke') {
    return NextResponse.json({ message: 'Unsupported action' }, { status: 400 });
  }
  if (email === session.email) {
    return NextResponse.json({ message: 'You cannot revoke your own access' }, { status: 400 });
  }

  try {
    const operator = await revokeAdminOperator({ email, revokedBy: session.email });
    await recordAdminAudit(request, session, {
      action: 'operators.revoke',
      resource: `admin:${email}`,
    });
    return secureAdminJson({ ok: true, operator });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Could not revoke admin' },
      { status: 400 }
    );
  }
}
