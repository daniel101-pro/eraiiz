'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Star } from 'lucide-react';
import { adminFetch } from '../../components/admin/adminApi';

type Folder = 'inbox' | 'sent' | 'support' | 'reports' | 'starred' | 'archived';

type Mail = {
  id: string;
  threadId: string;
  folder: Folder;
  fromName: string;
  fromEmail: string;
  toName: string;
  toEmail: string;
  subject: string;
  text: string;
  read: boolean;
  starred: boolean;
  createdAt: string;
  productId?: string;
  reason?: string;
};

function timeLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function Mailbox() {
  const searchParams = useSearchParams();
  const initialFolder = (searchParams.get('folder') as Folder) || 'inbox';
  const [folder, setFolder] = useState<Folder>(initialFolder);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Mail[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<Mail[]>([]);
  const [compose, setCompose] = useState(false);
  const [draft, setDraft] = useState({ to: '', subject: '', text: '', threadId: '' });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [provider, setProvider] = useState<{ resend?: boolean; from?: string }>({});

  const load = useCallback(async () => {
    const data = await adminFetch(`/api/admin/mail?folder=${folder}&q=${encodeURIComponent(query)}`);
    setMessages(data.messages || []);
    setCounts(data.counts || {});
    setProvider(data.provider || {});
  }, [folder, query]);

  useEffect(() => {
    load().catch(() => setMessages([]));
  }, [load]);

  const open = async (id: string) => {
    setActiveId(id);
    // Resend-hydrated sent items may only exist in the list payload
    if (String(id).startsWith('resend:')) {
      const local = messages.find((item) => item.id === id);
      if (local) {
        setThread([local]);
        return;
      }
    }
    try {
      const data = await adminFetch(`/api/admin/mail/${id}`);
      setThread(data.thread || [data.message]);
      if (data.message && !data.message.read) {
        await adminFetch(`/api/admin/mail/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ read: true }),
        });
        load().catch(() => {});
      }
    } catch {
      const local = messages.find((item) => item.id === id);
      setThread(local ? [local] : []);
    }
  };

  const closeThread = () => {
    setActiveId(null);
    setThread([]);
  };

  const toggleStar = async (event: React.MouseEvent, item: Mail) => {
    event.stopPropagation();
    await adminFetch(`/api/admin/mail/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ starred: !item.starred }),
    });
    load().catch(() => {});
  };

  const archive = async () => {
    if (!activeId) return;
    await adminFetch(`/api/admin/mail/${activeId}`, {
      method: 'PATCH',
      body: JSON.stringify({ folder: 'archived' }),
    });
    closeThread();
    load().catch(() => {});
  };

  const reply = () => {
    const latest = thread[thread.length - 1];
    if (!latest) return;
    const inbound = latest.folder === 'sent';
    setDraft({
      to: inbound ? latest.toEmail : latest.fromEmail,
      subject: latest.subject.startsWith('Re:') ? latest.subject : `Re: ${latest.subject}`,
      text: '',
      threadId: latest.threadId,
    });
    setCompose(true);
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setSendError('');
    try {
      await adminFetch('/api/admin/mail', {
        method: 'POST',
        body: JSON.stringify(draft),
      });
      setCompose(false);
      setDraft({ to: '', subject: '', text: '', threadId: '' });
      setFolder('sent');
      await load();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send via Resend');
    } finally {
      setSending(false);
    }
  };

  const folders = [
    { id: 'inbox' as Folder, label: 'Inbox', count: counts.unread },
    { id: 'sent' as Folder, label: 'Sent', count: counts.sent },
    { id: 'support' as Folder, label: 'Support', count: counts.support },
    { id: 'reports' as Folder, label: 'Reports', count: counts.reports },
    { id: 'starred' as Folder, label: 'Starred', count: counts.starred },
    { id: 'archived' as Folder, label: 'Archive', count: counts.archived },
  ];

  const reading = thread.length > 0;

  return (
    <div className="relative flex h-[calc(100dvh-7.5rem)] md:h-screen">
      <aside className="hidden w-48 shrink-0 border-r border-gray-200 bg-white md:block">
        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              setSendError('');
              setDraft({ to: '', subject: '', text: '', threadId: '' });
              setCompose(true);
            }}
            className="w-full bg-green-900 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Compose
          </button>
          <p className={`mt-2 text-[11px] ${provider.resend ? 'text-emerald-700' : 'text-amber-700'}`}>
            {provider.resend ? 'Resend connected' : 'Resend not configured'}
          </p>
        </div>
        {folders.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setFolder(item.id);
              closeThread();
            }}
            className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm ${
              folder === item.id ? 'bg-green-50 font-medium text-green-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{item.label}</span>
            {item.count ? <span className="text-xs text-gray-500">{item.count}</span> : null}
          </button>
        ))}
      </aside>

      <section className={`min-w-0 flex-1 flex-col bg-white ${reading ? 'hidden lg:flex' : 'flex'}`}>
        <div className="border-b border-gray-200 p-3">
          <div className="mb-3 flex items-center gap-2 md:hidden">
            <div className="flex-1 overflow-x-auto">
              <div className="flex w-max gap-1">
                {folders.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setFolder(item.id);
                      closeThread();
                    }}
                    className={`whitespace-nowrap px-3 py-1.5 text-xs ${
                      folder === item.id ? 'bg-green-900 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.label}
                    {item.count ? ` ${item.count}` : ''}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDraft({ to: '', subject: '', text: '', threadId: '' });
                setCompose(true);
              }}
              className="shrink-0 bg-green-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              Compose
            </button>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search mail"
            className="w-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-green-900 focus:bg-white focus:outline-none"
          />
        </div>
        <ul className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-gray-500">Empty</li>
          ) : (
            messages.map((item) => {
              const who = folder === 'sent' ? item.toName || item.toEmail : item.fromName || item.fromEmail;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => open(item.id)}
                    className={`flex w-full items-start gap-3 border-b border-gray-100 px-3 py-3 text-left ${
                      activeId === item.id ? 'bg-green-50' : 'hover:bg-gray-50'
                    } ${item.read ? 'font-normal' : 'font-semibold'}`}
                  >
                    <span
                      role="presentation"
                      onClick={(event) => toggleStar(event, item)}
                      className="mt-0.5 text-gray-300"
                    >
                      <Star className={`h-4 w-4 ${item.starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm">{who}</span>
                        <span className="shrink-0 text-xs text-gray-500">{timeLabel(item.createdAt)}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-sm">{item.subject}</span>
                      <span className="mt-0.5 block truncate text-xs font-normal text-gray-500">{item.text}</span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <article
        className={`${
          reading ? 'absolute inset-0 z-20 flex md:static md:flex-[1.2]' : 'hidden lg:flex'
        } min-w-0 flex-col bg-gray-50`}
      >
        {!thread.length ? (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">Select a message</div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
              <button type="button" className="text-sm text-gray-500 lg:hidden" onClick={closeThread}>
                Back
              </button>
              <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{thread[thread.length - 1]?.subject}</h1>
              <button type="button" onClick={reply} className="text-sm text-green-800">
                Reply
              </button>
              <button type="button" onClick={archive} className="text-sm text-gray-500">
                Archive
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-5">
              {thread.map((item) => (
                <div key={item.id} className="mb-4 border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.fromName}</p>
                      <p className="truncate text-xs text-gray-500">{item.fromEmail}</p>
                      <p className="truncate text-xs text-gray-500">to {item.toEmail}</p>
                    </div>
                    <p className="shrink-0 text-xs text-gray-500">{timeLabel(item.createdAt)}</p>
                  </div>
                  {item.productId ? (
                    <p className="mt-2 text-xs text-gray-500">
                      {item.reason} · {item.productId}
                    </p>
                  ) : null}
                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">{item.text}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </article>

      {compose ? (
        <div className="fixed inset-0 z-40 flex flex-col bg-white md:inset-auto md:bottom-4 md:right-4 md:h-auto md:w-full md:max-w-md md:border md:border-gray-300 md:shadow-xl">
          <div className="flex items-center justify-between bg-green-950 px-4 py-3 text-white md:py-2">
            <p className="text-sm font-medium">New message</p>
            <button type="button" onClick={() => setCompose(false)} className="text-sm">
              Close
            </button>
          </div>
          <form onSubmit={send} className="flex flex-1 flex-col p-4">
            <input
              value={draft.to}
              onChange={(event) => setDraft((prev) => ({ ...prev, to: event.target.value }))}
              placeholder="To"
              className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none md:py-2"
              required
            />
            <input
              value={draft.subject}
              onChange={(event) => setDraft((prev) => ({ ...prev, subject: event.target.value }))}
              placeholder="Subject"
              className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none md:py-2"
              required
            />
            <textarea
              value={draft.text}
              onChange={(event) => setDraft((prev) => ({ ...prev, text: event.target.value }))}
              className="mt-2 min-h-[40vh] w-full flex-1 resize-none text-sm focus:outline-none md:min-h-[12rem]"
              placeholder="Write"
              required
            />
            {sendError ? <p className="mt-2 text-sm text-red-600">{sendError}</p> : null}
            {!provider.resend ? (
              <p className="mt-2 text-xs text-amber-700">
                Set RESEND_API_KEY and EMAIL_FROM on Vercel before sending.
              </p>
            ) : null}
            <button
              type="submit"
              disabled={sending || provider.resend === false}
              className="mt-3 bg-green-900 px-4 py-3 text-sm font-medium text-white hover:bg-green-800 disabled:bg-gray-300 md:py-2"
            >
              {sending ? 'Sending via Resend…' : 'Send with Resend'}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminMailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-6 w-6 rounded-full border border-gray-200 border-t-green-950 animate-spin" />
        </div>
      }
    >
      <Mailbox />
    </Suspense>
  );
}
