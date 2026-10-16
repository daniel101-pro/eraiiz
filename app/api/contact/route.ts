import { NextRequest, NextResponse } from 'next/server';
import { addAdminMail } from '@/lib/adminMailStore';
import { sendEraiizEmail, escapeHtml } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim().toLowerCase();
    const subject = String(data.subject || '').trim();
    const message = String(data.message || '').trim();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    await addAdminMail({
      folder: 'support',
      fromName: name,
      fromEmail: email,
      toName: 'Eraiiz',
      toEmail: 'projecterraiz@gmail.com',
      subject,
      text: message,
    });

    try {
      await sendEraiizEmail({
        to: email,
        subject: `We got your message: ${subject}`,
        text: `Hi ${name},\n\nWe received your message and will reply from this thread.\n\n${message}`,
        html: `<p>Hi ${escapeHtml(name)},</p><p>We received your message.</p><blockquote style="border-left:3px solid #ddd;padding-left:12px;color:#555">${escapeHtml(message)}</blockquote>`,
      });
    } catch {
      // inbound mail is stored even if the receipt send fails
    }

    return NextResponse.json({ message: 'Message sent successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
