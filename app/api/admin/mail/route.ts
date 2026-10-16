import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import {
  addAdminMail,
  adminMailCounts,
  listAdminMail,
  type AdminMailFolder,
} from '@/lib/adminMailStore';
import { sendEraiizEmail, escapeHtml } from '@/lib/email';

const FOLDERS: AdminMailFolder[] = ['inbox', 'sent', 'support', 'reports', 'starred', 'archived'];

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const folder = (request.nextUrl.searchParams.get('folder') || 'inbox') as AdminMailFolder;
  const query = request.nextUrl.searchParams.get('q') || '';
  const messages = await listAdminMail(FOLDERS.includes(folder) ? folder : 'inbox', query);
  const counts = await adminMailCounts();

  return NextResponse.json({ messages, counts });
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin(request);
  if (error || !session) return error;

  const body = await request.json().catch(() => ({}));
  const to = String(body.to || '').trim().toLowerCase();
  const subject = String(body.subject || '').trim();
  const text = String(body.text || '').trim();

  if (!to.includes('@') || !subject || !text) {
    return NextResponse.json({ message: 'To, subject, and message are required' }, { status: 400 });
  }

  await sendEraiizEmail({
    to,
    subject,
    text,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;white-space:pre-wrap">${escapeHtml(text)}</div>`,
  });

  const message = await addAdminMail({
    folder: 'sent',
    fromName: session.name,
    fromEmail: session.email,
    toName: String(body.toName || to.split('@')[0]),
    toEmail: to,
    subject,
    text,
    read: true,
    threadId: body.threadId,
  });

  return NextResponse.json(message);
}
