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

  const easyship = await easyshipLookup(verified.trackingNumber).catch(() => null);

  return {
    ok: true,
    trackingNumber: verified.trackingNumber,
    courierId: verified.courierId,
    courierName: easyship?.courierName || verified.courierName,
    trackingUrl: easyship?.trackingUrl || verified.trackingUrl,
    statusText: easyship?.statusText,
    estimatedDelivery: easyship?.estimatedDelivery,
    origin: easyship?.origin,
    destination: easyship?.destination,
    events: easyship?.events || [],
  };
}
