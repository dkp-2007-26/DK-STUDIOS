import { useMemo, useState } from 'react';
import { ScanLine, CheckCircle2, PackageCheck, LogOut, Search, Download, Send, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types/database';
import { Page } from '../hooks/useRouter';
import { downloadInvoicePdf, getCustomerEmailLink, getCustomerWhatsAppLink } from '../lib/invoice';
import { getDeliveryOrderByBarcode, markDeliveryOrderDelivered } from '../lib/studioApi';

interface DeliveryScanPageProps {
  navigate: (page: Page) => void;
}

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not set';

export default function DeliveryScanPage({ navigate }: DeliveryScanPageProps) {
  const { isDelivery, signOut } = useAuth();
  const [barcodeValue, setBarcodeValue] = useState('');
  const [searchBarcode, setSearchBarcode] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null | undefined>(null);

  const canSubmit = barcodeValue.trim().length > 0;
  const statusTone = useMemo(() => {
    if (!order) return 'text-gray-400';
    return order.delivered_at ? 'text-emerald-400' : 'text-gold-400';
  }, [order]);
  const customerWhatsAppLink = order ? getCustomerWhatsAppLink(order, 'delivery') : null;
  const customerEmailLink = order ? getCustomerEmailLink(order, 'delivery') : null;

  if (!isDelivery) {
    navigate('delivery-secure-login');
    return null;
  }

  const handleLookup = () => {
    if (!canSubmit) return;
    setFeedback('');
    const nextBarcode = barcodeValue.trim();
    setSearchBarcode(nextBarcode);
    setOrder(undefined);
    getDeliveryOrderByBarcode(nextBarcode)
      .then(setOrder)
      .catch((error) => {
        setOrder(null);
        setFeedback((error as Error).message || 'Could not fetch order.');
      });
  };

  const handleDelivery = async () => {
    if (!searchBarcode) return;
    setSubmitting(true);
    try {
      const updated = await markDeliveryOrderDelivered(searchBarcode);
      setFeedback(`Delivery confirmed for ${updated.customer_name}.`);
      setSearchBarcode(updated.barcode_value);
      setBarcodeValue(updated.barcode_value ?? '');
    } catch (error) {
      setFeedback((error as Error).message || 'Could not confirm delivery.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-500 px-4 py-6">
      <div className="max-w-md mx-auto">
        <div className="rounded-3xl border border-white/5 bg-dark-300 p-5 mb-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-gold-400 text-xs tracking-widest uppercase">Delivery Scanner</p>
              <h1 className="text-white font-bold text-xl mt-1">Scan or enter barcode</h1>
            </div>
            <button
              onClick={() => { signOut(); navigate('home'); }}
              className="px-3 py-2 rounded-xl border border-white/10 text-gray-400 text-sm"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="mt-5 flex gap-3">
            <div className="relative flex-1">
              <ScanLine size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={barcodeValue}
                onChange={(e) => setBarcodeValue(e.target.value.toUpperCase())}
                placeholder="Scan barcode value"
                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-dark-200 border border-white/5 text-white placeholder-gray-600 focus:outline-none focus:border-gold-600/40 text-sm"
                autoFocus
                inputMode="text"
              />
            </div>
            <button
              onClick={handleLookup}
              disabled={!canSubmit}
              className="px-4 rounded-2xl bg-gradient-to-r from-gold-600 to-gold-400 text-black font-semibold disabled:opacity-60"
            >
              <Search size={18} />
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Use a mobile barcode scanner keyboard or paste the generated code to fetch the order instantly.
          </p>
        </div>

        {feedback && (
          <div className="mb-5 rounded-2xl border border-gold-800/20 bg-gold-900/10 px-4 py-3 text-sm text-gold-300">
            {feedback}
          </div>
        )}

        {order === undefined && searchBarcode && (
          <div className="rounded-3xl border border-white/5 bg-dark-300 px-5 py-10 text-center text-gray-400">
            Looking up order...
          </div>
        )}

        {order && (
          <div className="rounded-3xl border border-white/5 bg-dark-300 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <p className={`text-sm font-semibold ${statusTone}`}>
                {order.delivered_at ? 'Already delivered' : 'Ready to confirm delivery'}
              </p>
              <h2 className="text-white font-bold text-lg mt-1">{order.customer_name}</h2>
              <p className="text-gray-500 text-xs">Order #{order.id.slice(0, 8).toUpperCase()}</p>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/5 bg-dark-200 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-gray-600">Service</p>
                  <p className="mt-1 text-sm text-white">{order.service_id ?? 'Custom Order'}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-dark-200 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-gray-600">Bill No</p>
                  <p className="mt-1 text-sm text-white">{order.bill_number ?? 'Pending'}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-dark-200 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-gray-600">Customer</p>
                  <p className="mt-1 text-sm text-white">{order.customer_phone ?? order.customer_email}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-dark-200 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-gray-600">Delivered At</p>
                  <p className="mt-1 text-sm text-white">{formatDate(order.delivered_at)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-dark-200 p-4">
                <p className="text-[11px] uppercase tracking-wider text-gray-600">Barcode</p>
                <p className="mt-1 text-sm text-gold-300">{order.barcode_value}</p>
              </div>

              {!order.delivered_at && (
                <button
                  onClick={handleDelivery}
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-400 text-black font-bold flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {submitting ? 'Confirming...' : <><PackageCheck size={18} /> Mark Delivered</>}
                </button>
              )}

              {order.delivered_at && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-emerald-700/30 bg-emerald-900/10 px-4 py-3 text-emerald-300 text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    Delivered by {order.delivery_verified_by ?? 'delivery desk'} on {formatDate(order.delivered_at)}
                  </div>
                  <button
                    onClick={() => downloadInvoicePdf(order)}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-gold-600 to-gold-400 text-black font-semibold flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Download Delivered Bill
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={customerWhatsAppLink ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`py-3 rounded-2xl border text-sm flex items-center justify-center gap-2 ${customerWhatsAppLink ? 'border-green-600/30 bg-green-900/10 text-green-400' : 'border-white/5 text-gray-600 pointer-events-none'}`}
                    >
                      <Send size={15} /> WhatsApp
                    </a>
                    <a
                      href={customerEmailLink ?? '#'}
                      className={`py-3 rounded-2xl border text-sm flex items-center justify-center gap-2 ${customerEmailLink ? 'border-blue-600/30 bg-blue-900/10 text-blue-400' : 'border-white/5 text-gray-600 pointer-events-none'}`}
                    >
                      <Mail size={15} /> Email
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
