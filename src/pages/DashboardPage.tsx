import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle, Clock, RefreshCw, Search, ShoppingBag, XCircle } from "lucide-react";
import type { Order } from "../types/database";
import type { Page } from "../hooks/useRouter";
import { getPublicOrder } from "../lib/studioApi";

interface DashboardProps {
  navigate: (page: Page) => void;
}

const LAST_ORDER_ID_KEY = "d.k-studios.lastOrderId";

const statusConfig = {
  pending: { label: "Pending", color: "text-yellow-700 bg-yellow-50 border-yellow-200", icon: Clock },
  confirmed: { label: "Confirmed", color: "text-blue-700 bg-blue-50 border-blue-200", icon: CheckCircle },
  in_progress: { label: "In Progress", color: "text-orange-700 bg-orange-50 border-orange-200", icon: RefreshCw },
  completed: { label: "Completed", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
};

const paymentStatusConfig = {
  pending: { label: "Payment Pending", color: "text-yellow-700" },
  paid: { label: "Paid", color: "text-emerald-700" },
  refunded: { label: "Refunded", color: "text-blue-700" },
  failed: { label: "Failed", color: "text-red-700" },
};

export default function DashboardPage({ navigate }: DashboardProps) {
  const [inputOrderId, setInputOrderId] = useState(() => localStorage.getItem(LAST_ORDER_ID_KEY) ?? "");
  const [submittedOrderId, setSubmittedOrderId] = useState(() => localStorage.getItem(LAST_ORDER_ID_KEY) ?? "");
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [lookupError, setLookupError] = useState("");
  const normalizedOrderId = submittedOrderId.trim();
  const loading = Boolean(normalizedOrderId && order === undefined);
  const status = order ? statusConfig[order.status] : null;
  const payment = order ? paymentStatusConfig[order.payment_status] : null;
  const StatusIcon = status?.icon ?? Clock;
  const balance = order ? Math.max(order.total_amount - order.advance_amount, 0) : 0;
  const timeline = useMemo(() => {
    if (!order) return [];
    const fulfillmentLabel = order.fulfillment_method === "home_delivery" ? "Home delivery" : "Ready for pickup";
    return [
      { label: "Order received", active: true },
      { label: "Payment confirmed", active: order.payment_status === "paid" },
      { label: "Studio started", active: order.status === "in_progress" || order.status === "completed" },
      { label: order.delivery_type === "printed" ? fulfillmentLabel : "Completed", active: order.status === "completed" },
    ];
  }, [order]);

  const handleSearch = () => {
    const nextOrderId = inputOrderId.trim();
    setSubmittedOrderId(nextOrderId);
    setLookupError("");
    if (nextOrderId) {
      localStorage.setItem(LAST_ORDER_ID_KEY, nextOrderId);
      setOrder(undefined);
      getPublicOrder(nextOrderId)
        .then(setOrder)
        .catch((error) => {
          setOrder(null);
          setLookupError((error as Error).message);
        });
    }
  };

  useEffect(() => {
    if (normalizedOrderId) {
      getPublicOrder(normalizedOrderId).then(setOrder).catch(() => setOrder(null));
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f2e8] px-4 pb-16 pt-28 text-stone-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase text-[#8a5b12]">Order access</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Track your order</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
            Enter the order id from your bill or checkout confirmation. No customer account is required.
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-[0_24px_70px_rgba(52,36,10,0.1)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                value={inputOrderId}
                onChange={(event) => setInputOrderId(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="Paste your order id"
                className="w-full rounded-lg border border-stone-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-stone-950 outline-none transition focus:border-stone-500"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="rounded-lg bg-[#f1c75b] px-6 py-3 text-sm font-black text-stone-950 transition hover:bg-[#ffdc73]"
            >
              Track Order
            </button>
          </div>
        </div>

        {!normalizedOrderId && (
          <div className="mt-6 rounded-lg border border-stone-200 bg-white p-8 text-center">
            <ShoppingBag size={32} className="mx-auto text-[#8a5b12]" />
            <p className="mt-4 text-sm text-stone-600">Place an order first, then use the generated order id here.</p>
            <button type="button" onClick={() => navigate("order")} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-stone-300 px-5 py-3 text-sm font-black text-stone-950">
              Place Order <ArrowRight size={16} />
            </button>
          </div>
        )}

        {loading && (
          <div className="mt-6 flex justify-center rounded-lg border border-stone-200 bg-white py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f1c75b]/40 border-t-[#8a5b12]" />
          </div>
        )}

        {normalizedOrderId && order === null && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
            {lookupError || "No order was found for that id. Please check the id and try again."}
          </div>
        )}

        {order && status && payment && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,0.55fr]">
            <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-[0_24px_70px_rgba(52,36,10,0.1)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-stone-500">Order ID</p>
                  <p className="mt-2 break-all text-sm font-black text-stone-950">{order.id}</p>
                  <p className="mt-3 text-2xl font-black text-stone-950">{order.bill_number ?? "Bill pending"}</p>
                </div>
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${status.color}`}>
                  <StatusIcon size={13} />
                  {status.label}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Info label="Customer" value={order.customer_name} />
                <Info label="Delivery" value={order.delivery_type === "printed" ? "Printed copy" : "Digital"} />
                <Info label="Fulfillment" value={order.delivery_type === "printed" ? (order.fulfillment_method === "home_delivery" ? "Home delivery" : "In-store pickup") : "Digital"} />
                <Info label="Payment" value={payment.label} valueClassName={payment.color} />
                <Info label="Total" value={`Rs. ${order.total_amount}`} />
                <Info label="Advance" value={`Rs. ${order.advance_amount}`} />
                <Info label="Balance" value={`Rs. ${balance}`} />
              </div>

              <div className="mt-6 rounded-lg border border-stone-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-stone-500">Progress</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  {timeline.map((item) => (
                    <div key={item.label} className={`rounded-lg border p-3 ${item.active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-stone-200 bg-white text-stone-500"}`}>
                      <p className="text-xs font-black">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="h-fit rounded-lg border border-white/10 bg-[#101820] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-bold uppercase text-[#f7d880]">Delivery and support</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {order.fulfillment_method === "home_delivery"
                  ? "Keep this order id with you. Your printed order will be prepared for home delivery after the work is complete."
                  : "Keep this order id with you. For printed orders, show the bill number or barcode at pickup."}
              </p>
              {order.fulfillment_method === "home_delivery" && (
                <div className="mt-4 rounded-lg border border-white/10 bg-white/10 p-3 text-sm text-slate-300">
                  Qikink status: <span className="font-black text-[#f7d880]">{order.qikink_status.replace("_", " ")}</span>
                </div>
              )}
              {order.barcode_url && (
                <div className="mt-5 rounded-lg bg-white p-3">
                  <img src={order.barcode_url} alt={`Barcode for ${order.bill_number ?? order.id}`} className="h-auto w-full" />
                </div>
              )}
              <button type="button" onClick={() => navigate("order")} className="mt-5 w-full rounded-lg bg-[#f1c75b] px-5 py-3 text-sm font-black text-stone-950 transition hover:bg-[#ffdc73]">
                Place another order
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  valueClassName = "text-stone-950",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-bold uppercase text-stone-500">{label}</p>
      <p className={`mt-2 break-words text-sm font-black ${valueClassName}`}>{value}</p>
    </div>
  );
}
