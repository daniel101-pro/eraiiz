'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
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

  const load = useCallback(async () => {
    const data = await adminFetch(`/api/admin/mail?folder=${folder}&q=${encodeURIComponent(query)}`);
    setMessages(data.messages || []);
    setCounts(data.counts || {});
  }, [folder, query]);

  useEffect(() => {
    load().catch(() => setMessages([]));
  }, [load]);

  const open = async (id: string) => {
    setActiveId(id);
    const data = await adminFetch(`/api/admin/mail/${id}`);
    setThread(data.thread || [data.message]);
    if (!data.message.read) {
      await adminFetch(`/api/admin/mail/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ read: true }),
      });
      load().catch(() => {});
    }
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
    setActiveId(null);
    setThread([]);
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
    try {
      await adminFetch('/api/admin/mail', {
        method: 'POST',
        body: JSON.stringify(draft),
      });
      setCompose(false);
      setDraft({ to: '', subject: '', text: '', threadId: '' });
      setFolder('sent');
      await load();
    } finally {
      setSending(false);
    }
  };

  const visible = useMemo(() => messages, [messages]);

  const folders = [
    { id: 'inbox' as Folder, label: 'Inbox', count: counts.unread },
    { id: 'sent' as Folder, label: 'Sent', count: counts.sent },
    { id: 'support' as Folder, label: 'Support', count: counts.support },
    { id: 'reports' as Folder, label: 'Reports', count: counts.reports },
    { id: 'starred' as Folder, label: 'Starred', count: counts.starred },
    { id: 'archived' as Folder, label: 'Archive', count: counts.archived },
  ];

  return (
    <div className="flex h-screen">
      <aside className="w-48 shrink-0 border-r border-gray-200 bg-white">
        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              setDraft({ to: '', subject: '', text: '', threadId: '' });
              setCompose(true);
            }}
            className="w-full bg-green-900 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Compose
          </button>
        </div>
        {folders.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setFolder(item.id);
              setActiveId(null);
              setThread([]);
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

      <section className={`min-w-0 flex-1 flex-col border-r border-gray-200 bg-white ${thread.length ? 'hidden lg:flex' : 'flex'}`}>
        <div className="border-b border-gray-200 p-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search mail"
            className="w-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-green-900 focus:bg-white focus:outline-none"
          />
        </div>
        <ul className="flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-gray-500">Empty</li>
          ) : (
            visible.map((item) => {
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

      <article className={`${thread.length ? 'flex' : 'hidden'} min-w-0 flex-[1.2] flex-col bg-gray-50 lg:flex`}>
        {!thread.length ? (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">Select a message</div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
              <button
                type="button"
                className="mr-3 text-sm text-gray-500 underline lg:hidden"
                onClick={() => {
                  setActiveId(null);
                  setThread([]);
                }}
              >
                Back
              </button>
              <h1 className="truncate text-sm font-semibold">{thread[thread.length - 1]?.subject}</h1>
              <div className="flex gap-3 text-sm">
                <button type="button" onClick={reply} className="text-green-800 underline">
                  Reply
                </button>
                <button type="button" onClick={archive} className="text-gray-500 underline">
                  Archive
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {thread.map((item) => (
                <div key={item.id} className="mb-4 border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {item.fromName} <span className="font-normal text-gray-500">&lt;{item.fromEmail}&gt;</span>
                      </p>
                      <p className="text-xs text-gray-500">to {item.toEmail}</p>
                    </div>
                    <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                  {item.productId ? (
                    <p className="mt-2 text-xs text-gray-500">
                      {item.reason} · {item.productId}
                    </p>
                  ) : null}
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{item.text}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </article>

      {compose ? (
        <div className="fixed bottom-4 right-4 z-40 w-full max-w-md border border-gray-300 bg-white shadow-xl">
          <div className="flex items-center justify-between bg-green-950 px-4 py-2 text-white">
            <p className="text-sm font-medium">New message</p>
            <button type="button" onClick={() => setCompose(false)} className="text-sm">
              Close
            </button>
          </div>
          <form onSubmit={send} className="p-4">
            <input
              value={draft.to}
              onChange={(event) => setDraft((prev) => ({ ...prev, to: event.target.value }))}
              placeholder="To"
              className="w-full border-b border-gray-200 py-2 text-sm focus:outline-none"
              required
            />
            <input
              value={draft.subject}
              onChange={(event) => setDraft((prev) => ({ ...prev, subject: event.target.value }))}
              placeholder="Subject"
              className="w-full border-b border-gray-200 py-2 text-sm focus:outline-none"
              required
            />
            <textarea
              value={draft.text}
              onChange={(event) => setDraft((prev) => ({ ...prev, text: event.target.value }))}
              rows={8}
              className="mt-2 w-full resize-none text-sm focus:outline-none"
              placeholder="Write"
              required
            />
            <button
              type="submit"
              disabled={sending}
              className="mt-3 bg-green-900 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:bg-gray-300"
            >
              {sending ? 'Sending…' : 'Send'}
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
        <div className="flex h-screen items-center justify-center">
          <div className="h-6 w-6 rounded-full border border-gray-200 border-t-green-950 animate-spin" />
        </div>
      }
    >
      <Mailbox />
    </Suspense>
  );
}
