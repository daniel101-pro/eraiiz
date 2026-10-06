export type TrackingStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';

export type TrackingEvent = {
  status: 'ordered' | 'shipped' | 'delivered' | string;
  at: string;
  title: string;
  detail: string;
};

export type DetectedCourier = {
  id: string;
  label: string;
  trackingUrl: string;
};

const FAKE_TRACKING = /^(n\/?a|none|nil|null|test|asdf|xxx+|0+|123456|123456789|tracking)$/i;

type CourierRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
  url: (value: string) => string;
};

const COURIER_RULES: CourierRule[] = [
  {
    id: 'ups',
    label: 'UPS',
    test: (value) => /^1Z[A-Z0-9]{16}$/.test(value),
    url: (value) => `https://www.ups.com/track?tracknum=${value}`,
  },
  {
    id: 'usps',
    label: 'USPS',
    test: (value) => /^(94|93|92|91)\d{18,22}$/.test(value) || /^[A-Z]{2}\d{9}US$/.test(value),
    url: (value) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${value}`,
  },
  {
    id: 'dhl',
    label: 'DHL',
    test: (value) => /^(GM|JVGL|JJD|JD)/.test(value),
    url: (value) => `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${value}`,
  },
  {
    id: 'gigl',
    label: 'GIG Logistics',
    test: (value) => /^(GIG|GLS)/.test(value),
    url: (value) => `https://giglogistics.com/tracking?consignment=${value}`,
  },
  {
    id: 'speedaf',
    label: 'Speedaf',
    test: (value) => /^(SF|SP)\d+/.test(value),
    url: (value) => `https://www.speedaf.com/track?nu=${value}`,
  },
  {
    id: 'fedex',
    label: 'FedEx',
    test: (value) => /^(\d{12}|\d{15}|\d{20}|\d{22})$/.test(value),
    url: (value) => `https://www.fedex.com/fedextrack/?trknbr=${value}`,
  },
  {
    id: 'dhl',
    label: 'DHL',
    test: (value) => /^\d{10,11}$/.test(value),
    url: (value) => `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${value}`,
  },
  {
    id: 'aramex',
    label: 'Aramex',
    test: (value) => /^\d{10,12}$/.test(value),
    url: (value) => `https://www.aramex.com/track/results?ShipmentNumber=${value}`,
  },
];

export function normalizeTrackingNumber(raw: string) {
  return String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function detectCourier(trackingNumber: string): DetectedCourier {
  const value = normalizeTrackingNumber(trackingNumber);
  const match = COURIER_RULES.find((rule) => rule.test(value));
  if (match) {
    return { id: match.id, label: match.label, trackingUrl: match.url(value) };
  }
  return {
    id: 'courier',
    label: 'Courier',
    trackingUrl: `https://www.aftership.com/track/${encodeURIComponent(value)}`,
  };
}

export function verifyTrackingNumber(trackingNumber: string) {
  const value = normalizeTrackingNumber(trackingNumber);
  if (!value) {
    return { ok: false as const, message: 'Paste the tracking number from your courier' };
  }
  if (value.length < 6) {
    return { ok: false as const, message: 'That tracking number is too short' };
  }
  if (FAKE_TRACKING.test(value)) {
    return { ok: false as const, message: 'Enter the real tracking number from your courier' };
  }

  const courier = detectCourier(value);
  return {
    ok: true as const,
    trackingNumber: value,
    courierId: courier.id,
    courierName: courier.label,
    trackingUrl: courier.trackingUrl,
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

export function shippedEvent(input: {
  trackingNumber: string;
  courierName: string;
  at?: string;
  extra?: string;
}): TrackingEvent {
  return {
    status: 'shipped',
    at: input.at || new Date().toISOString(),
    title: 'Seller shipped',
    detail: [input.courierName, input.trackingNumber, input.extra].filter(Boolean).join(' · '),
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

export function trackingHeadline(status?: string, trackingNumber?: string, courierName?: string) {
  if (status === 'delivered') return 'Delivered';
  if (status === 'shipped') {
    const courier = courierName && courierName !== 'Courier' ? courierName : '';
    if (trackingNumber && courier) return `${courier} · ${trackingNumber}`;
    if (trackingNumber) return `Seller shipped · ${trackingNumber}`;
    return 'Seller shipped';
  }
  if (status === 'cancelled') return 'Cancelled';
  return 'Seller has not shipped yet';
}
