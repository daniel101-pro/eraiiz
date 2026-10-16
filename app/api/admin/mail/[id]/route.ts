import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminMail, getAdminThread, patchAdminMail } from '@/lib/adminMailStore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { id } = await params;
  const message = await getAdminMail(id);
  if (!message) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const thread = await getAdminThread(message.threadId);
  return NextResponse.json({ message, thread });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const patch: { read?: boolean; starred?: boolean; folder?: 'inbox' | 'sent' | 'support' | 'reports' | 'archived' } = {};
  if (typeof body.read === 'boolean') patch.read = body.read;
  if (typeof body.starred === 'boolean') patch.starred = body.starred;
  if (['inbox', 'sent', 'support', 'reports', 'archived'].includes(body.folder)) {
    patch.folder = body.folder;
  }
  const updated = await patchAdminMail(id, patch);

  if (!updated) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}
