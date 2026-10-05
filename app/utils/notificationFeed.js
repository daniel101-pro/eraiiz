const LOCAL_KEY = 'eraiiz_inbox';

export function readLocalInbox() {
  if (typeof window === 'undefined') return [];
  try {
    const items = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    return Array.isArray(items) ? items.filter((item) => item && item._id && item.message) : [];
  } catch {
    return [];
  }
}

export function addLocalInboxItem(item) {
  if (typeof window === 'undefined' || !item?._id || !item.message) return item;
  const existing = readLocalInbox();
  if (existing.some((n) => n._id === item._id)) return item;
  const next = [item, ...existing].slice(0, 50);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('eraiiz-inbox-updated'));
  return item;
}

export function markLocalInboxRead(id) {
  if (typeof window === 'undefined' || !id) return;
  const next = readLocalInbox().map((item) => (item._id === id ? { ...item, read: true } : item));
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
}

export function clearLocalInbox() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_KEY);
}

export function buyerOrderNotice({ reference, items }) {
  const names = (items || []).map((item) => item?.name).filter(Boolean);
  const summary =
    names.length === 1 ? names[0] : names.length > 1 ? `${names.length} items` : 'your order';

  return {
    _id: `inbox_buyer_${reference}`,
    type: 'order',
    title: 'Order confirmed',
    message: `Your order for ${summary} is confirmed. You can track it from Orders.`,
    read: false,
    createdAt: new Date().toISOString(),
    link: '/account?section=Orders',
    data: { paymentReference: reference, itemCount: (items || []).length },
  };
}

export function mergeNotifications(...lists) {
  const merged = new Map();
  for (const list of lists) {
    for (const item of Array.isArray(list) ? list : []) {
      if (!item?._id || !item.message) continue;
      if (!merged.has(item._id)) merged.set(item._id, item);
    }
  }
  return [...merged.values()].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

export async function fetchNotificationFeed() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) return readLocalInbox();

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const [backendRes, inboxRes] = await Promise.allSettled([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, { headers }),
    fetch('/api/inbox', { headers }),
  ]);

  const backend =
    backendRes.status === 'fulfilled' && backendRes.value.ok
      ? await backendRes.value.json().catch(() => [])
      : [];
  const inboxPayload =
    inboxRes.status === 'fulfilled' && inboxRes.value.ok
      ? await inboxRes.value.json().catch(() => [])
      : [];
  const inbox = Array.isArray(inboxPayload) ? inboxPayload : inboxPayload.notifications || [];

  return mergeNotifications(inbox, backend, readLocalInbox());
}

export async function persistInboxItem(item) {
  addLocalInboxItem(item);
  const token = localStorage.getItem('accessToken');
  if (!token || !item?._id) return;
  try {
    await fetch('/api/inbox', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
  } catch {
    // local inbox still shows the purchase
  }
}

export async function markNotificationRead(notification) {
  const id = notification?._id;
  if (!id) return;
  markLocalInboxRead(id);

  const token = localStorage.getItem('accessToken');
  if (!token) return;

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const inboxId = String(id).startsWith('inbox_') || String(id).startsWith('order_') || String(id).startsWith('sale_');
  if (inboxId) {
    await fetch('/api/inbox', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ _id: id, read: true }),
    }).catch(() => {});
    return;
  }

  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ read: true }),
  }).catch(() => {});
}
