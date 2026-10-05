const LAST_ORDER_KEY = 'eraiiz_last_order';

function readFrom(storage) {
  try {
    return JSON.parse(storage.getItem(LAST_ORDER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function readLastOrder() {
  if (typeof window === 'undefined') return null;
  const session = readFrom(sessionStorage);
  const local = readFrom(localStorage);
  const stored = session?.reference || session?.items?.length ? session : local;

  let billing = stored?.billing;
  if (!billing?.email && !billing?.fullName) {
    try {
      const checkout = JSON.parse(sessionStorage.getItem('eraiiz_checkout') || 'null');
      billing = checkout?.billing || billing;
    } catch {
      // ignore
    }
  }

  let items = stored?.items;
  if (!items?.length) {
    try {
      items = JSON.parse(sessionStorage.getItem('eraiiz_last_checkout_items') || '[]');
    } catch {
      items = [];
    }
  }

  if (!stored && !billing && !items?.length) return null;
  return {
    ...(stored || {}),
    billing: billing || stored?.billing,
    items: items?.length ? items : stored?.items || [],
  };
}

export function saveLastOrder(order) {
  if (typeof window === 'undefined' || !order) return;
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  } catch {
    // ignore
  }
}
