import { verifyTrackingNumber, type TrackingEvent } from '@/lib/tracking';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

export type ShipmentLookup = {
  ok: true;
  trackingNumber: string;
  courierId: string;
  courierName: string;
  trackingUrl: string;
  statusText?: string;
  estimatedDelivery?: string;
  origin?: string;
  destination?: string;
  events: TrackingEvent[];
};

async function aftershipLookup(trackingNumber: string) {
  const key = process.env.AFTERSHIP_API_KEY;
  if (!key) return null;

  const headers = {
    'as-api-key': key,
    'Content-Type': 'application/json',
  };

  const detected = await fetch('https://api.aftership.com/tracking/2024-04/couriers/detect', {
    method: 'POST',
    headers,
    body: JSON.stringify({ tracking_number: trackingNumber }),
    cache: 'no-store',
  });
  if (!detected.ok) return null;
  const detectedPayload = await detected.json();
  const courier = detectedPayload?.data?.couriers?.[0];
  const slug = String(courier?.slug || '');
  const name = String(courier?.name || '');
  if (!slug) return null;

  await fetch('https://api.aftership.com/tracking/2024-04/trackings', {
    method: 'POST',
    headers,
    body: JSON.stringify({ tracking_number: trackingNumber, slug }),
    cache: 'no-store',
  }).catch(() => null);

  const tracked = await fetch(
    `https://api.aftership.com/tracking/2024-04/trackings/${encodeURIComponent(slug)}/${encodeURIComponent(trackingNumber)}`,
    { headers, cache: 'no-store' }
  );
  const trackedPayload = tracked.ok ? await tracked.json() : null;
  const tracking = trackedPayload?.data?.tracking || {};
  const checkpoints = Array.isArray(tracking.checkpoints) ? tracking.checkpoints : [];

  return {
    courierName: name || slug,
    courierId: slug,
    trackingUrl: `https://www.aftership.com/track/${slug}/${trackingNumber}`,
    statusText: tracking.tag || tracking.subtag_message || tracking.shipment_status,
    estimatedDelivery: tracking.expected_delivery || tracking.scheduled_delivery_date,
    events: checkpoints.slice(-6).map((item: Record<string, string>) => ({
      status: item.tag || 'update',
      at: item.checkpoint_time || new Date().toISOString(),
      title: item.message || item.tag || 'Update',
      detail: [item.location, item.city, item.country_name].filter(Boolean).join(', '),
    })),
  };
}

async function easyshipLookup(trackingNumber: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(
      `${API_URL}/api/shipping/track/${encodeURIComponent(trackingNumber)}`,
      { cache: 'no-store', signal: controller.signal }
    );
    if (!response.ok) return null;
    const payload = await response.json();
    const data = payload?.data || payload?.tracking || payload;
    if (!data || typeof data !== 'object') return null;
    const events = Array.isArray(data.trackingEvents || data.events)
      ? (data.trackingEvents || data.events).map((item: Record<string, string>) => ({
          status: item.status || 'update',
          at: item.timestamp || item.time || item.createdAt || new Date().toISOString(),
          title: item.status || item.message || 'Update',
          detail: item.location || item.description || '',
        }))
      : [];
    return {
      courierName: data.courierName || data.courier || '',
      trackingUrl: data.tracking_url || data.easyshipTracking?.tracking_url || '',
      statusText: data.status || data.statusText,
      estimatedDelivery: data.estimatedDeliveryDate || data.eta,
      origin: data.originAddress?.city,
      destination: data.destinationAddress?.city,
      events,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function lookupShipment(trackingNumber: string): Promise<ShipmentLookup | { ok: false; message: string }> {
  const verified = verifyTrackingNumber(trackingNumber);
  if (!verified.ok) return verified;

  const [aftership, easyship] = await Promise.all([
    aftershipLookup(verified.trackingNumber).catch(() => null),
    easyshipLookup(verified.trackingNumber).catch(() => null),
  ]);

  const courierName = aftership?.courierName || easyship?.courierName || verified.courierName;
  const trackingUrl =
    aftership?.trackingUrl ||
    easyship?.trackingUrl ||
    verified.trackingUrl;

  return {
    ok: true,
    trackingNumber: verified.trackingNumber,
    courierId: aftership?.courierId || verified.courierId,
    courierName,
    trackingUrl,
    statusText: aftership?.statusText || easyship?.statusText,
    estimatedDelivery: aftership?.estimatedDelivery || easyship?.estimatedDelivery,
    origin: easyship?.origin,
    destination: easyship?.destination,
    events: [...(aftership?.events || []), ...(easyship?.events || [])],
  };
}
