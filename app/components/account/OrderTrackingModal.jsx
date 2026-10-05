'use client';

import { CheckCircle, Clock, Copy, Truck, X } from 'lucide-react';
import { trackingHeadline } from '@/lib/tracking';
import { showError, showSuccess } from '../../utils/toast';

function formatWhen(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STEPS = [
  { status: 'ordered', title: 'Order confirmed' },
  { status: 'shipped', title: 'Seller shipped' },
  { status: 'delivered', title: 'Delivered' },
];

export default function OrderTrackingModal({ order, onClose }) {
  if (!order) return null;

  const status = String(order.status || 'pending').toLowerCase();
  const events = Array.isArray(order.timeline) ? order.timeline : [];
  const eventByStatus = Object.fromEntries(events.map((event) => [event.status, event]));

  const copyTracking = () => {
    if (!order.trackingNumber) return;
    navigator.clipboard.writeText(order.trackingNumber).then(
      () => showSuccess('Tracking number copied'),
      () => showError('Could not copy')
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close tracking" />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs text-gray-500">Tracking</p>
            <h2 className="text-lg font-semibold text-gray-900 mt-1">{order.product}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {order.trackingLabel || trackingHeadline(status, order.trackingNumber)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, index) => {
            const event = eventByStatus[step.status];
            const reached =
              event ||
              (step.status === 'ordered') ||
              (step.status === 'shipped' && (status === 'shipped' || status === 'delivered')) ||
              (step.status === 'delivered' && status === 'delivered');
            const current =
              (step.status === 'ordered' && status === 'pending') ||
              (step.status === 'shipped' && status === 'shipped') ||
              (step.status === 'delivered' && status === 'delivered');
            const Icon = step.status === 'delivered' ? CheckCircle : step.status === 'shipped' ? Truck : Clock;
            return (
              <div key={step.status} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      reached ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-px flex-1 mt-1 ${reached ? 'bg-green-200' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="pb-4">
                  <p className={`text-sm font-medium ${reached ? 'text-gray-900' : 'text-gray-400'}`}>
                    {event?.title || (step.status === 'shipped' && !reached ? 'Seller has not shipped yet' : step.title)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {event?.detail ||
                      (step.status === 'ordered'
                        ? 'We received your order'
                        : step.status === 'shipped' && !reached
                          ? 'Waiting on the seller to add tracking'
                          : current
                            ? 'Latest update'
                            : 'Not yet')}
                  </p>
                  {event?.at && <p className="text-xs text-gray-400 mt-1">{formatWhen(event.at)}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {order.trackingNumber && (
          <div className="mt-2 rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Tracking number</p>
            <div className="flex items-center justify-between gap-2 mt-1">
              <p className="text-sm font-medium text-gray-900 break-all">
                {order.courierName ? `${order.courierName} · ` : ''}
                {order.trackingNumber}
              </p>
              <button
                type="button"
                onClick={copyTracking}
                className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
