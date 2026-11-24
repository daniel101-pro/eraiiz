'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Archive,
  ArrowLeft,
  ChevronDown,
  Clock3,
  Inbox,
  Mail,
  Menu,
  MoreVertical,
  Pencil,
  Printer,
  RefreshCw,
  Reply,
  Search,
  Send,
  Settings,
  Shield,
  SlidersHorizontal,
  Smile,
  SquareArrowOutUpRight,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { adminFetch } from '../../components/admin/adminApi';
import AdminsMonitor from '../../components/admin/AdminsMonitor';

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

type Tab = 'primary' | 'support' | 'reports' | 'updates';

function timeLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function relativeLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return timeLabel(iso);
}

function initials(name: string, email: string) {
  const source = (name || email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function snippet(text: string) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function Mailbox() {
  const searchParams = useSearchParams();
  const initialFolder = (searchParams.get('folder') as Folder) || 'inbox';
  const [folder, setFolder] = useState<Folder>(initialFolder);
  const [tab, setTab] = useState<Tab>(
    initialFolder === 'support' ? 'support' : initialFolder === 'reports' ? 'reports' : 'primary'
  );
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Mail[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<Mail[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [compose, setCompose] = useState(false);
  const [composeExpanded, setComposeExpanded] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [draft, setDraft] = useState({ to: '', subject: '', text: '', threadId: '' });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [provider, setProvider] = useState<{ resend?: boolean; from?: string; notify?: string }>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('Admin');
  const [panel, setPanel] = useState<'mail' | 'admins'>(
    searchParams.get('view') === 'admins' ? 'admins' : 'mail'
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch(`/api/admin/mail?folder=${folder}&q=${encodeURIComponent(query)}`);
      setMessages(data.messages || []);
      setCounts(data.counts || {});
      setProvider(data.provider || {});
    } finally {
      setLoading(false);
    }
  }, [folder, query]);

  useEffect(() => {
    load().catch(() => setMessages([]));
  }, [load]);

  useEffect(() => {
    adminFetch('/api/admin/session')
      .then((session) => setAdminName(session.name || session.email || 'Admin'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const nextFolder =
      tab === 'support' ? 'support' : tab === 'reports' ? 'reports' : folder === 'sent' || folder === 'starred' || folder === 'archived' ? folder : 'inbox';
    if (tab === 'primary' && (folder === 'support' || folder === 'reports')) {
      setFolder('inbox');
      return;
    }
    if (tab === 'support' || tab === 'reports') {
      if (folder !== nextFolder) setFolder(nextFolder);
    }
  }, [tab, folder]);

  const openCompose = (preset?: Partial<typeof draft>) => {
    setSendError('');
    setDraft({
      to: preset?.to || '',
      subject: preset?.subject || '',
      text: preset?.text || '',
      threadId: preset?.threadId || '',
    });
    setComposeExpanded(false);
    setCompose(true);
  };

  const open = async (id: string) => {
    setActiveId(id);
    setReplyOpen(false);
    if (String(id).startsWith('resend:') || String(id).startsWith('resend-in:')) {
      const local = messages.find((item) => item.id === id);
      if (local) {
        setThread([local]);
        return;
      }
    }
    try {
      const data = await adminFetch(`/api/admin/mail/${id}`);
      setThread(data.thread || [data.message].filter(Boolean));
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
    setReplyOpen(false);
  };

  const toggleStar = async (event: React.MouseEvent, item: Mail) => {
    event.stopPropagation();
    await adminFetch(`/api/admin/mail/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ starred: !item.starred }),
    });
    setMessages((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, starred: !row.starred } : row))
    );
    setThread((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, starred: !row.starred } : row))
    );
  };

  const archive = async (id?: string) => {
    const target = id || activeId;
    if (!target || String(target).startsWith('resend')) {
      if (target === activeId) closeThread();
      return;
    }
    await adminFetch(`/api/admin/mail/${target}`, {
      method: 'PATCH',
      body: JSON.stringify({ folder: 'archived' }),
    });
    if (target === activeId) closeThread();
    load().catch(() => {});
  };

  const markUnread = async (id?: string) => {
    const target = id || activeId;
    if (!target || String(target).startsWith('resend')) return;
    await adminFetch(`/api/admin/mail/${target}`, {
      method: 'PATCH',
      body: JSON.stringify({ read: false }),
    });
    load().catch(() => {});
  };

  const reply = (inline = false) => {
    const latest = thread[thread.length - 1];
    if (!latest) return;
    const outbound = latest.folder === 'sent';
    const next = {
      to: outbound ? latest.toEmail : latest.fromEmail,
      subject: latest.subject.startsWith('Re:') ? latest.subject : `Re: ${latest.subject}`,
      text: '',
      threadId: latest.threadId,
    };
    if (inline) {
      setDraft(next);
      setReplyOpen(true);
      return;
    }
    openCompose(next);
  };

  const send = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setSending(true);
    setSendError('');
    try {
      await adminFetch('/api/admin/mail', {
        method: 'POST',
        body: JSON.stringify(draft),
      });
      setCompose(false);
      setReplyOpen(false);
      setDraft({ to: '', subject: '', text: '', threadId: '' });
      setFolder('sent');
      setTab('primary');
      await load();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send via Resend');
    } finally {
      setSending(false);
    }
  };

  const folders = [
    { id: 'inbox' as Folder, label: 'Inbox', count: counts.unread || counts.inbox, icon: Inbox },
    { id: 'starred' as Folder, label: 'Starred', count: counts.starred, icon: Star },
    { id: 'sent' as Folder, label: 'Sent', count: counts.sent, icon: Send },
    { id: 'support' as Folder, label: 'Support', count: counts.support, icon: Mail },
    { id: 'reports' as Folder, label: 'Reports', count: counts.reports, icon: Mail },
    { id: 'archived' as Folder, label: 'Trash', count: counts.archived, icon: Trash2 },
  ];

  const tabs = useMemo(
    () => [
      { id: 'primary' as Tab, label: 'Primary', count: counts.inbox },
      { id: 'support' as Tab, label: 'Support', count: counts.support, tone: 'green' as const },
      { id: 'reports' as Tab, label: 'Reports', count: counts.reports, tone: 'blue' as const },
      { id: 'updates' as Tab, label: 'Updates', count: 0 },
    ],
    [counts]
  );

  const reading = thread.length > 0;
  const latest = thread[thread.length - 1];
  const rangeLabel = messages.length
    ? `1-${messages.length} of ${messages.length}`
    : '0-0 of 0';

  const selectFolder = (id: Folder) => {
    setPanel('mail');
    setFolder(id);
    if (id === 'support') setTab('support');
    else if (id === 'reports') setTab('reports');
    else setTab('primary');
    closeThread();
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#f6f8fc] text-[#202124] [font-family:Roboto,Arial,Helvetica,sans-serif]">
      {/* Top bar */}
      <header className="flex h-16 shrink-0 items-center gap-2 px-2 sm:px-3">
        <button
          type="button"
          className="rounded-full p-2.5 text-[#444746] hover:bg-black/5"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/admin" className="mr-2 flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-black/[0.03]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a73e8] text-sm font-bold text-white">
            M
          </span>
          <span className="hidden text-[22px] font-normal tracking-tight text-[#5f6368] sm:inline">Eraiiz Mail</span>
        </Link>

        <div className="mx-auto flex h-12 w-full max-w-[720px] items-center rounded-full bg-[#eaf1fb] px-4 focus-within:bg-white focus-within:shadow-[0_1px_3px_1px_rgba(60,64,67,.15)]">
          <Search className="mr-3 h-5 w-5 shrink-0 text-[#5f6368]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search mail"
            className="h-full w-full bg-transparent text-[16px] text-[#202124] outline-none placeholder:text-[#5f6368]"
          />
          <button type="button" className="rounded-full p-2 text-[#5f6368] hover:bg-black/5" aria-label="Search options">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="ml-2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => load()}
            className="hidden rounded-full p-2.5 text-[#5f6368] hover:bg-black/5 sm:inline-flex"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" className="hidden rounded-full p-2.5 text-[#5f6368] hover:bg-black/5 sm:inline-flex" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </button>
          <div
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#1a73e8] text-xs font-medium text-white"
            title={adminName}
          >
            {initials(adminName, '')}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Gmail sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-[256px] px-2' : 'w-[72px] px-1'
          } hidden shrink-0 flex-col pb-4 pt-2 md:flex`}
        >
          <button
            type="button"
            onClick={() => openCompose()}
            className={`mb-4 flex items-center gap-3 rounded-2xl bg-[#c2e7ff] text-[#001d35] shadow-sm transition hover:shadow-md ${
              sidebarOpen ? 'h-14 px-4' : 'mx-auto h-14 w-14 justify-center'
            }`}
          >
            <Pencil className="h-5 w-5" />
            {sidebarOpen ? <span className="text-sm font-medium">Compose</span> : null}
          </button>

          <nav className="space-y-0.5">
            {folders.map((item) => {
              const active = folder === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectFolder(item.id)}
                  className={`flex w-full items-center gap-4 rounded-r-full py-1.5 pr-3 text-sm transition ${
                    sidebarOpen ? 'pl-6' : 'justify-center px-0'
                  } ${
                    active
                      ? 'bg-[#d3e3fd] font-bold text-[#001d35]'
                      : 'font-medium text-[#444746] hover:bg-[#e8eaed]'
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] shrink-0 ${item.id === 'starred' && active ? 'fill-current' : ''}`} />
                  {sidebarOpen ? (
                    <>
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      {item.count ? (
                        <span className={`text-xs ${active ? 'font-bold' : 'font-medium'}`}>{item.count}</span>
                      ) : null}
                    </>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="mt-4 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setPanel('admins');
                closeThread();
              }}
              className={`flex w-full items-center gap-4 rounded-r-full py-1.5 pr-3 text-sm transition ${
                sidebarOpen ? 'pl-6' : 'justify-center px-0'
              } ${
                panel === 'admins'
                  ? 'bg-[#d3e3fd] font-bold text-[#001d35]'
                  : 'font-medium text-[#444746] hover:bg-[#e8eaed]'
              }`}
            >
              <Shield className="h-[18px] w-[18px] shrink-0" />
              {sidebarOpen ? <span className="flex-1 truncate text-left">Admins</span> : null}
            </button>
          </div>

          {sidebarOpen ? (
            <div className="mt-6 px-4">
              <p className="mb-2 text-xs font-medium text-[#444746]">Labels</p>
              <div className="space-y-1 text-sm text-[#444746]">
                <p className="flex items-center gap-3 rounded-r-full py-1.5 pl-2 hover:bg-[#e8eaed]">
                  <span className="h-3 w-3 rounded-sm bg-[#1a73e8]" /> Support
                </p>
                <p className="flex items-center gap-3 rounded-r-full py-1.5 pl-2 hover:bg-[#e8eaed]">
                  <span className="h-3 w-3 rounded-sm bg-[#188038]" /> Reports
                </p>
              </div>
              <p className={`mt-6 text-[11px] ${provider.resend ? 'text-[#188038]' : 'text-[#b06000]'}`}>
                {provider.resend
                  ? `Resend · ${provider.notify || 'admin alerts'}`
                  : 'Set RESEND_API_KEY on Vercel'}
              </p>
              <Link href="/admin" className="mt-2 inline-block text-xs text-[#1a73e8] hover:underline">
                ← Back to Admin
              </Link>
            </div>
          ) : null}
        </aside>

        {/* Main card */}
        <section className="relative mr-0 flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)] md:mr-4 md:mb-4">
          {panel === 'admins' ? (
            <AdminsMonitor />
          ) : !reading ? (
            <>
              {/* List toolbar */}
              <div className="flex h-12 items-center gap-1 border-b border-[#eceff1] px-2">
                <button
                  type="button"
                  className="rounded p-2 text-[#5f6368] hover:bg-black/5"
                  onClick={() => {
                    if (selected.size === messages.length) setSelected(new Set());
                    else setSelected(new Set(messages.map((item) => item.id)));
                  }}
                  aria-label="Select"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-[2px] border ${
                      selected.size ? 'border-[#1a73e8] bg-[#1a73e8]' : 'border-[#5f6368]'
                    }`}
                  >
                    {selected.size ? <span className="h-0.5 w-2 bg-white" /> : null}
                  </span>
                </button>
                <ChevronDown className="mr-1 h-3.5 w-3.5 text-[#5f6368]" />
                <button
                  type="button"
                  onClick={() => load()}
                  className="rounded-full p-2 text-[#5f6368] hover:bg-black/5"
                  aria-label="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button type="button" className="rounded-full p-2 text-[#5f6368] hover:bg-black/5" aria-label="More">
                  <MoreVertical className="h-4 w-4" />
                </button>
                <div className="ml-auto flex items-center gap-2 pr-2 text-xs text-[#5f6368]">
                  <span>{rangeLabel}</span>
                </div>
              </div>

              {/* Category tabs */}
              {(folder === 'inbox' || folder === 'support' || folder === 'reports') && (
                <div className="flex border-b border-[#eceff1]">
                  {tabs.map((item) => {
                    const active = tab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setTab(item.id);
                          if (item.id === 'support') setFolder('support');
                          else if (item.id === 'reports') setFolder('reports');
                          else if (item.id === 'primary') setFolder('inbox');
                        }}
                        className={`relative flex min-w-[120px] flex-1 items-center justify-center gap-2 px-3 py-3.5 text-sm sm:flex-none sm:justify-start sm:px-6 ${
                          active ? 'font-medium text-[#1a73e8]' : 'font-medium text-[#5f6368] hover:bg-black/[0.03]'
                        }`}
                      >
                        {item.label}
                        {item.count && item.id !== 'primary' ? (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[11px] font-medium text-white ${
                              item.tone === 'green' ? 'bg-[#188038]' : 'bg-[#1a73e8]'
                            }`}
                          >
                            {item.count} new
                          </span>
                        ) : null}
                        {active ? (
                          <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t bg-[#1a73e8]" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Mobile compose + folders */}
              <div className="flex items-center gap-2 border-b border-[#eceff1] px-3 py-2 md:hidden">
                <button
                  type="button"
                  onClick={() => openCompose()}
                  className="flex items-center gap-2 rounded-2xl bg-[#c2e7ff] px-4 py-2 text-sm font-medium text-[#001d35]"
                >
                  <Pencil className="h-4 w-4" />
                  Compose
                </button>
                <div className="flex flex-1 gap-1 overflow-x-auto">
                  {folders.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectFolder(item.id)}
                      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${
                        panel === 'mail' && folder === item.id
                          ? 'bg-[#d3e3fd] font-bold text-[#001d35]'
                          : 'bg-[#e8eaed] text-[#444746]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setPanel('admins');
                      closeThread();
                    }}
                    className="whitespace-nowrap rounded-full bg-[#e8eaed] px-3 py-1.5 text-xs text-[#444746]"
                  >
                    Admins
                  </button>
                </div>
              </div>

              {/* Message list */}
              <ul className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                  <li className="px-6 py-16 text-center text-sm text-[#5f6368]">
                    {loading ? 'Loading mail…' : 'No messages in this folder.'}
                  </li>
                ) : (
                  messages.map((item) => {
                    const who =
                      folder === 'sent' ? item.toName || item.toEmail : item.fromName || item.fromEmail;
                    const unread = !item.read;
                    const isChecked = selected.has(item.id);
                    return (
                      <li key={item.id} className="group relative">
                        <button
                          type="button"
                          onClick={() => open(item.id)}
                          className={`flex w-full items-center gap-2 border-b border-[#eceff1] px-2 py-[10px] text-left transition ${
                            unread ? 'bg-white font-semibold' : 'bg-[#f2f6fc] font-normal'
                          } hover:z-10 hover:shadow-[inset_1px_0_0_#dadce0,inset_-1px_0_0_#dadce0,0_1px_2px_0_rgba(60,64,67,.3),0_1px_3px_1px_rgba(60,64,67,.15)]`}
                        >
                          <span
                            role="presentation"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelected((prev) => {
                                const next = new Set(prev);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                              });
                            }}
                            className="flex h-8 w-8 items-center justify-center"
                          >
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-[2px] border ${
                                isChecked ? 'border-[#1a73e8] bg-[#1a73e8]' : 'border-[#5f6368]'
                              }`}
                            >
                              {isChecked ? <span className="h-2 w-1 rotate-45 border-b-2 border-r-2 border-white" /> : null}
                            </span>
                          </span>
                          <span
                            role="presentation"
                            onClick={(event) => toggleStar(event, item)}
                            className="flex h-8 w-8 items-center justify-center text-[#5f6368]"
                          >
                            <Star
                              className={`h-[18px] w-[18px] ${
                                item.starred ? 'fill-[#f4b400] text-[#f4b400]' : ''
                              }`}
                            />
                          </span>
                          <span
                            className={`hidden w-[180px] shrink-0 truncate text-sm sm:block ${
                              unread ? 'text-[#202124]' : 'text-[#202124]'
                            }`}
                          >
                            {who}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm">
                            <span className="sm:hidden font-medium">{who} — </span>
                            <span className={unread ? 'text-[#202124]' : 'text-[#202124]'}>{item.subject || '(no subject)'}</span>
                            <span className="font-normal text-[#5f6368]">
                              {' '}
                              - {snippet(item.text)}
                            </span>
                          </span>
                          <span
                            className={`hidden shrink-0 px-2 text-xs group-hover:hidden sm:inline ${
                              unread ? 'font-bold text-[#202124]' : 'text-[#5f6368]'
                            }`}
                          >
                            {timeLabel(item.createdAt)}
                          </span>
                          <span className="hidden shrink-0 items-center gap-0.5 pr-1 group-hover:flex">
                            <span
                              role="presentation"
                              onClick={(event) => {
                                event.stopPropagation();
                                archive(item.id);
                              }}
                              className="rounded-full p-2 text-[#5f6368] hover:bg-black/5"
                              title="Archive"
                            >
                              <Archive className="h-4 w-4" />
                            </span>
                            <span
                              role="presentation"
                              onClick={(event) => {
                                event.stopPropagation();
                                archive(item.id);
                              }}
                              className="rounded-full p-2 text-[#5f6368] hover:bg-black/5"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </span>
                            <span
                              role="presentation"
                              onClick={(event) => {
                                event.stopPropagation();
                                markUnread(item.id);
                              }}
                              className="rounded-full p-2 text-[#5f6368] hover:bg-black/5"
                              title="Mark as unread"
                            >
                              <Mail className="h-4 w-4" />
                            </span>
                            <span className="rounded-full p-2 text-[#5f6368] hover:bg-black/5" title="Snooze">
                              <Clock3 className="h-4 w-4" />
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </>
          ) : (
            <>
              {/* Thread toolbar */}
              <div className="flex h-12 items-center gap-1 border-b border-[#eceff1] px-2">
                <button
                  type="button"
                  onClick={closeThread}
                  className="rounded-full p-2 text-[#5f6368] hover:bg-black/5"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => archive()}
                  className="rounded-full p-2 text-[#5f6368] hover:bg-black/5"
                  aria-label="Archive"
                >
                  <Archive className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => archive()}
                  className="rounded-full p-2 text-[#5f6368] hover:bg-black/5"
                  aria-label="Delete"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => markUnread()}
                  className="rounded-full p-2 text-[#5f6368] hover:bg-black/5"
                  aria-label="Mark unread"
                >
                  <Mail className="h-5 w-5" />
                </button>
                <button type="button" className="rounded-full p-2 text-[#5f6368] hover:bg-black/5" aria-label="More">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4 sm:px-8">
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h1 className="text-[22px] font-normal leading-tight text-[#1f1f1f]">
                      {latest?.subject || '(no subject)'}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded bg-[#e8eaed] px-2 py-0.5 text-xs text-[#3c4043]">
                      Inbox
                      <X className="h-3 w-3" />
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-[#5f6368]">
                    <button type="button" className="rounded-full p-2 hover:bg-black/5" aria-label="Print">
                      <Printer className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded-full p-2 hover:bg-black/5" aria-label="Open in new">
                      <SquareArrowOutUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {thread.map((item) => (
                  <div key={item.id} className="mb-8">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8eaed] text-sm font-medium text-[#5f6368]">
                        {initials(item.fromName, item.fromEmail)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm">
                              <span className="font-bold text-[#202124]">{item.fromName || item.fromEmail}</span>{' '}
                              <span className="text-xs text-[#5f6368]">&lt;{item.fromEmail}&gt;</span>
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-[#5f6368]">
                              to {item.toEmail === provider.notify ? 'me' : item.toEmail}
                              <ChevronDown className="h-3 w-3" />
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-[#5f6368]">
                            <span>
                              {timeLabel(item.createdAt)} ({relativeLabel(item.createdAt)})
                            </span>
                            <button
                              type="button"
                              onClick={(event) => toggleStar(event, item)}
                              className="rounded-full p-1.5 hover:bg-black/5"
                            >
                              <Star
                                className={`h-4 w-4 ${item.starred ? 'fill-[#f4b400] text-[#f4b400]' : ''}`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => reply(true)}
                              className="rounded-full p-1.5 hover:bg-black/5"
                            >
                              <Reply className="h-4 w-4" />
                            </button>
                            <button type="button" className="rounded-full p-1.5 hover:bg-black/5">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {item.productId ? (
                          <p className="mt-2 text-xs text-[#5f6368]">
                            {item.reason} · {item.productId}
                          </p>
                        ) : null}

                        <div className="mt-4 whitespace-pre-wrap break-words text-[14px] leading-[1.6] text-[#202124]">
                          {item.text}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {!replyOpen ? (
                  <div className="ml-0 flex flex-wrap items-center gap-2 sm:pl-[52px]">
                    <button
                      type="button"
                      onClick={() => reply(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-6 py-2 text-sm font-medium text-[#3c4043] hover:bg-[#f8f9fa]"
                    >
                      <Reply className="h-4 w-4" />
                      Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => reply(false)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-6 py-2 text-sm font-medium text-[#3c4043] hover:bg-[#f8f9fa]"
                    >
                      Forward
                    </button>
                    <button
                      type="button"
                      className="rounded-full p-2 text-[#5f6368] hover:bg-black/5"
                      aria-label="React"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="ml-0 rounded-2xl border border-[#dadce0] bg-white p-3 shadow-sm sm:pl-[52px]">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a73e8] text-xs font-medium text-white">
                        {initials(adminName, '')}
                      </div>
                      <p className="text-sm text-[#202124]">
                        To <span className="font-medium">{draft.to}</span>
                      </p>
                    </div>
                    <textarea
                      autoFocus
                      value={draft.text}
                      onChange={(event) => setDraft((prev) => ({ ...prev, text: event.target.value }))}
                      placeholder="Press / for Help me write"
                      className="min-h-[120px] w-full resize-none border-0 text-sm outline-none"
                    />
                    {sendError ? <p className="mb-2 text-sm text-red-600">{sendError}</p> : null}
                    <div className="mt-2 flex items-center gap-2 border-t border-[#eceff1] pt-3">
                      <div className="flex overflow-hidden rounded-full">
                        <button
                          type="button"
                          disabled={sending || !draft.text.trim()}
                          onClick={() => send()}
                          className="bg-[#0b57d0] px-5 py-2 text-sm font-medium text-white hover:bg-[#0b57d0]/90 disabled:bg-[#a8c7fa]"
                        >
                          {sending ? 'Sending…' : 'Send'}
                        </button>
                        <button
                          type="button"
                          className="border-l border-white/30 bg-[#0b57d0] px-2 text-white hover:bg-[#0b57d0]/90"
                          aria-label="Send options"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyOpen(false)}
                        className="ml-auto rounded-full p-2 text-[#5f6368] hover:bg-black/5"
                        aria-label="Discard"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Floating compose */}
      {compose ? (
        <div
          className={`fixed z-50 flex flex-col overflow-hidden border border-[#dadce0] bg-white shadow-[0_8px_10px_1px_rgba(0,0,0,0.14),0_3px_14px_2px_rgba(0,0,0,0.12),0_5px_5px_-3px_rgba(0,0,0,0.2)] ${
            composeExpanded
              ? 'inset-4 rounded-2xl md:inset-8'
              : 'inset-0 rounded-none md:inset-auto md:bottom-0 md:right-4 md:h-[560px] md:w-[500px] md:rounded-t-xl'
          }`}
        >
          <div className="flex h-10 items-center justify-between bg-[#f2f6fc] px-4">
            <p className="text-sm font-medium text-[#202124]">
              {draft.subject?.startsWith('Re:') ? draft.subject : 'New Message'}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded p-1 text-[#5f6368] hover:bg-black/5"
                onClick={() => setComposeExpanded((value) => !value)}
                aria-label="Expand"
              >
                <SquareArrowOutUpRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="rounded p-1 text-[#5f6368] hover:bg-black/5"
                onClick={() => setCompose(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <form onSubmit={send} className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center border-b border-[#eceff1] px-4">
              <span className="pr-2 text-sm text-[#5f6368]">To</span>
              <input
                value={draft.to}
                onChange={(event) => setDraft((prev) => ({ ...prev, to: event.target.value }))}
                className="h-10 flex-1 bg-transparent text-sm outline-none"
                required
              />
              <span className="text-xs text-[#5f6368]">Cc Bcc</span>
            </div>
            <input
              value={draft.subject}
              onChange={(event) => setDraft((prev) => ({ ...prev, subject: event.target.value }))}
              placeholder="Subject"
              className="h-10 border-b border-[#eceff1] px-4 text-sm outline-none"
              required
            />
            <textarea
              value={draft.text}
              onChange={(event) => setDraft((prev) => ({ ...prev, text: event.target.value }))}
              className="min-h-0 w-full flex-1 resize-none px-4 py-3 text-sm outline-none"
              required
            />
            {sendError ? <p className="px-4 pb-2 text-sm text-red-600">{sendError}</p> : null}
            {!provider.resend ? (
              <p className="px-4 pb-2 text-xs text-[#b06000]">
                Set RESEND_API_KEY and EMAIL_FROM on Vercel before sending.
              </p>
            ) : null}
            <div className="flex items-center gap-2 px-3 pb-3 pt-1">
              <div className="flex overflow-hidden rounded-full">
                <button
                  type="submit"
                  disabled={sending || provider.resend === false}
                  className="bg-[#0b57d0] px-6 py-2 text-sm font-medium text-white hover:bg-[#0b57d0]/90 disabled:bg-[#a8c7fa]"
                >
                  {sending ? 'Sending…' : 'Send'}
                </button>
                <button
                  type="button"
                  className="border-l border-white/30 bg-[#0b57d0] px-2 text-white"
                  aria-label="Send options"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setCompose(false)}
                className="ml-auto rounded-full p-2 text-[#5f6368] hover:bg-black/5"
                aria-label="Discard"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
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
        <div className="flex h-[100dvh] items-center justify-center bg-[#f6f8fc]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#dadce0] border-t-[#1a73e8]" />
        </div>
      }
    >
      <Mailbox />
    </Suspense>
  );
}
