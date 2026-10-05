export const COURIERS = [
  { id: 'dhl', label: 'DHL' },
  { id: 'fedex', label: 'FedEx' },
  { id: 'ups', label: 'UPS' },
  { id: 'gigl', label: 'GIG Logistics' },
  { id: 'nipost', label: 'NIPOST' },
  { id: 'aramex', label: 'Aramex' },
  { id: 'speedaf', label: 'Speedaf' },
  { id: 'other', label: 'Other' },
] as const;

export type CourierId = (typeof COURIERS)[number]['id'];

export type TrackingStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';

export type TrackingEvent = {
  status: 'ordered' | 'shipped' | 'delivered';
  at: string;
  title: string;
  detail: string;
};

const FAKE_TRACKING = /^(n\/?a|none|nil|null|test|asdf|xxx+|0+|123456|123456789|tracking)$/i;

const COURIER_PATTERNS: Record<string, RegExp> = {
  dhl: /^(\d{10,11}|[A-Z]{2,3}\d{8,})$/i,
  fedex: /^\d{12,22}$/,
  ups: /^1Z[A-Z0-9]{16}$/i,
  gigl: /^[A-Z0-9-]{8,24}$/i,
  nipost: /^[A-Z0-9-]{8,24}$/i,
  aramex: /^\d{10,14}$/,
  speedaf: /^[A-Z0-9-]{8,24}$/i,
  other: /^[A-Z0-9-]{6,32}$/i,
};

export function courierLabel(idOrName?: string) {
  if (!idOrName) return '';
  const match = COURIERS.find(
    (courier) => courier.id === idOrName.toLowerCase() || courier.label.toLowerCase() === idOrName.toLowerCase()
  );
  return match?.label || idOrName;
}

export function verifyTrackingNumber(trackingNumber: string, courier?: string) {
  const value = String(trackingNumber || '').replace(/\s+/g, '').toUpperCase();
  if (!value) {
    return { ok: false as const, message: 'Enter the tracking number from your courier' };
  }
  if (value.length < 6) {
    return { ok: false as const, message: 'That tracking number is too short' };
  }
  if (FAKE_TRACKING.test(value)) {
    return { ok: false as const, message: 'Enter the real tracking number from your courier' };
  }
  if (!/^[A-Z0-9-]+$/.test(value)) {
    return { ok: false as const, message: 'Tracking numbers can only contain letters, numbers, and hyphens' };
  }

  const courierId = String(courier || 'other').toLowerCase();
  const pattern = COURIER_PATTERNS[courierId] || COURIER_PATTERNS.other;
  const label = courierLabel(courierId);
  if (!pattern.test(value)) {
    return {
      ok: false as const,
      message: `That does not look like a ${label} tracking number`,
    };
  }

  return {
    ok: true as const,
    trackingNumber: value,
    courierId,
    courierName: label,
  };
}

export function initialTimeline(createdAt?: string): TrackingEvent[] {
  const at = createdAt || new Date().toISOString();
  return [
    {
      status: 'ordered',
      at,
      title: 'Order confirmed',
      detail: 'Seller has not shipped yet',
    },
  ];
}

export function shippedEvent(input: { trackingNumber: string; courierName: string; at?: string }): TrackingEvent {
  return {
    status: 'shipped',
    at: input.at || new Date().toISOString(),
    title: 'Seller shipped',
    detail: `${input.courierName} · ${input.trackingNumber}`,
  };
}

export function deliveredEvent(at?: string): TrackingEvent {
  return {
    status: 'delivered',
    at: at || new Date().toISOString(),
    title: 'Delivered',
    detail: 'The seller marked this order as delivered',
  };
}

export function appendTimeline(existing: TrackingEvent[] | undefined, event: TrackingEvent) {
  const list = Array.isArray(existing) ? [...existing] : initialTimeline(event.at);
  if (list.some((item) => item.status === event.status)) {
    return list.map((item) => (item.status === event.status ? event : item));
  }
  return [...list, event];
}

export function trackingHeadline(status?: string, trackingNumber?: string) {
  if (status === 'delivered') return 'Delivered';
  if (status === 'shipped') {
    return trackingNumber ? `Seller shipped · ${trackingNumber}` : 'Seller shipped';
  }
  if (status === 'cancelled') return 'Cancelled';
  return 'Seller has not shipped yet';
}
