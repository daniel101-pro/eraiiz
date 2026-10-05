'use client';

import { useEffect, useMemo, useState } from 'react';
import { useShipping } from '../../context/ShippingContext';
import { showSuccess, showError } from '../../utils/toast';
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  RefreshCw,
  Phone,
  Mail,
  Copy,
  MapPin,
} from 'lucide-react';

function formatNaira(amount) {
  return `₦${Number(amount || 0).toLocaleString()}`;
}

function formatWhen(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function addressLines(shipment) {
  const destination = shipment.destination || {};
  return [
    destination.fullName || shipment.buyerId?.name,
    destination.address,
    [destination.city, destination.state, destination.postalCode].filter(Boolean).join(', '),
    destination.phone || shipment.buyerId?.phone,
  ].filter(Boolean);
}

function copyText(value, label) {
  navigator.clipboard.writeText(value).then(
    () => showSuccess(`${label} copied`),
    () => showError('Could not copy')
  );
}

export default function ShippingDashboard({ sellerId }) {
  const {
    shipments,
    isLoading,
    fetchShipments,
    refreshShipments,
    markOrderStatus,
  } = useShipping();

  const [tab, setTab] = useState('pending');
  const [updatingId, setUpdatingId] = useState('');
  const [shipForm, setShipForm] = useState({ id: '', trackingNumber: '', courierName: '' });

  useEffect(() => {
    fetchShipments(1, { sellerId });
  }, [sellerId]);

  const counts = useMemo(
    () => ({
      pending: shipments.filter((item) => item.status === 'pending' || item.status === 'confirmed').length,
      shipped: shipments.filter((item) => item.status === 'shipped' || item.status === 'in_transit').length,
      delivered: shipments.filter((item) => item.status === 'delivered').length,
    }),
    [shipments]
  );

  const visible = shipments.filter((item) => {
    if (tab === 'shipped') return item.status === 'shipped' || item.status === 'in_transit';
    if (tab === 'delivered') return item.status === 'delivered';
    return item.status === 'pending' || item.status === 'confirmed';
  });

  const updateStatus = async (shipment, status, extra = {}) => {
    try {
      setUpdatingId(shipment._id);
      await markOrderStatus(shipment._id, status, extra);
      setShipForm({ id: '', trackingNumber: '', courierName: '' });
      showSuccess(
        status === 'shipped'
          ? 'Marked as shipped'
          : status === 'delivered'
            ? 'Marked as delivered'
            : 'Order updated'
      );
    } catch (error) {
      showError(error.message || 'Could not update this order');
    } finally {
      setUpdatingId('');
    }
  };

  if (isLoading && shipments.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        <span className="ml-3 text-gray-600">Loading orders to ship...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">To ship</h1>
          <p className="text-sm text-gray-600 mt-1">
            Pack the item, send it, then mark it shipped.
          </p>
        </div>
        <button
          onClick={refreshShipments}
          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-800">To pack</p>
          <p className="text-2xl font-bold text-amber-900">{counts.pending}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs text-blue-800">Shipped</p>
          <p className="text-2xl font-bold text-blue-900">{counts.shipped}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-3">
          <p className="text-xs text-green-800">Delivered</p>
          <p className="text-2xl font-bold text-green-900">{counts.delivered}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'pending', label: 'To pack', count: counts.pending },
          { id: 'shipped', label: 'Shipped', count: counts.shipped },
          { id: 'delivered', label: 'Delivered', count: counts.delivered },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
              tab === item.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-1">
            {tab === 'pending' ? 'Nothing to pack' : 'No orders here'}
          </h3>
          <p className="text-sm text-gray-500">
            {tab === 'pending'
              ? 'New sales will show up here with the customer address.'
              : 'Orders you mark shipped or delivered will appear in this tab.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((shipment) => {
            const phone = shipment.destination?.phone || shipment.buyerId?.phone;
            const email = shipment.buyerId?.email;
            const lines = addressLines(shipment);
            const busy = updatingId === shipment._id;
            const shipping = shipForm.id === shipment._id;

            return (
              <div key={shipment._id} className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">
                      {formatWhen(shipment.createdAt)}
                      {shipment.reference ? ` · ${shipment.reference}` : ''}
                    </p>
                    <h3 className="text-base font-semibold text-gray-900 mt-1">
                      {shipment.productSummary}
                    </h3>
                    {shipment.amountNgn > 0 && (
                      <p className="text-sm text-gray-600 mt-0.5">{formatNaira(shipment.amountNgn)}</p>
                    )}
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                    {shipment.status === 'pending' ? (
                      <>
                        <Clock className="w-3 h-3" /> To pack
                      </>
                    ) : shipment.status === 'shipped' ? (
                      <>
                        <Truck className="w-3 h-3" /> Shipped
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3" /> Delivered
                      </>
                    )}
                  </span>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    Ship to
                  </div>
                  <div className="text-sm text-gray-800 leading-relaxed space-y-0.5">
                    {lines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                    {email && <p className="text-gray-500">{email}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => copyText(lines.join('\n'), 'Address')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy address
                    </button>
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call
                      </a>
                    )}
                    {email && (
                      <a
                        href={`mailto:${email}?subject=${encodeURIComponent('Your Eraiiz order')}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Email
                      </a>
                    )}
                  </div>
                </div>

                {shipment.trackingNumber && (
                  <p className="text-sm text-gray-600 mt-3">
                    Tracking: <span className="font-medium text-gray-900">{shipment.trackingNumber}</span>
                    {shipment.courierName ? ` · ${shipment.courierName}` : ''}
                  </p>
                )}

                {shipment.status === 'pending' && (
                  <div className="mt-4 space-y-3">
                    {shipping ? (
                      <div className="space-y-2">
                        <input
                          value={shipForm.courierName}
                          onChange={(event) =>
                            setShipForm((prev) => ({ ...prev, courierName: event.target.value }))
                          }
                          placeholder="Courier (optional)"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                        />
                        <input
                          value={shipForm.trackingNumber}
                          onChange={(event) =>
                            setShipForm((prev) => ({ ...prev, trackingNumber: event.target.value }))
                          }
                          placeholder="Tracking number (optional)"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              updateStatus(shipment, 'shipped', {
                                trackingNumber: shipForm.trackingNumber,
                                courierName: shipForm.courierName,
                              })
                            }
                            className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-60"
                          >
                            {busy ? 'Saving...' : 'Confirm shipped'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShipForm({ id: '', trackingNumber: '', courierName: '' })}
                            className="px-4 py-2 text-sm border border-gray-200 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          setShipForm({ id: shipment._id, trackingNumber: '', courierName: '' })
                        }
                        className="w-full px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-60"
                      >
                        Mark as shipped
                      </button>
                    )}
                  </div>
                )}

                {shipment.status === 'shipped' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => updateStatus(shipment, 'delivered')}
                    className="mt-4 w-full px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-60"
                  >
                    {busy ? 'Saving...' : 'Mark as delivered'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
