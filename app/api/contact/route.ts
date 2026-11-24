import { NextRequest, NextResponse } from 'next/server';
import { addAdminMail } from '@/lib/adminMailStore';
import { adminNotifyEmail, isEmailConfigured, notifyAdminInbox, sendEraiizEmail } from '@/lib/email';
import { renderAdminAlertHtml, renderContactReceiptHtml } from '@/lib/emailLayout';
import { clientIp, rateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(`contact:${clientIp(request)}`, 8, 10 * 60_000);
    if (!limited.ok) {
      return NextResponse.json({ error: 'Too many messages. Try again later.' }, { status: 429 });
    }

    const data = await request.json().catch(() => ({}));
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
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message is too long' }, { status: 400 });
    }

    // Durable admin desk copy (survives Vercel cold starts via Stripe-backed store)
    const saved = await addAdminMail({
      folder: 'support',
      fromName: name,
      fromEmail: email,
      toName: 'Eraiiz Support',
      toEmail: adminNotifyEmail(),
      subject,
      text: message,
    });

    const notify = await notifyAdminInbox({
      subject: `[Support] ${subject}`,
      text: `From: ${name} <${email}>\n\n${message}`,
      html: renderAdminAlertHtml({
        title: subject,
        rows: [
          { label: 'From', value: `${name} <${email}>` },
          { label: 'Type', value: 'Contact form' },
        ],
        body: message,
      }),
      replyTo: email,
      idempotencyKey: `support:${email}:${subject}:${message.slice(0, 40)}`,
    });

    // Best-effort receipt to the sender
    let receiptOk = false;
    try {
      const receipt = await sendEraiizEmail({
        to: email,
        subject: `We got your message: ${subject}`,
        text: `Hi ${name},\n\nWe received your message and will reply soon.\n\n— Eraiiz Support`,
        html: renderContactReceiptHtml({ name, subject, message }),
      });
      receiptOk = receipt.ok;
    } catch {
      receiptOk = false;
    }

    return NextResponse.json({
      message: 'Message sent successfully',
      id: saved.id,
      emailed: Boolean(notify.ok),
      receipt: receiptOk,
      resendConfigured: isEmailConfigured(),
    });
  } catch (error) {
    console.error('contact POST failed', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send message. Please try again or email support@eraiiz.com.',
      },
      { status: 500 }
    );
  }
}
