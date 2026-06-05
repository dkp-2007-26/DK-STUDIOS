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
  pending: { label: "Waiting for booking", color: "border-amber-300/25 bg-amber-300/10 text-amber-200", icon: Clock },
  confirmed: { label: "Booked", color: "border-sky-300/25 bg-sky-300/10 text-sky-200", icon: CheckCircle },
  in_progress: { label: "We're working on it", color: "border-orange-300/25 bg-orange-300/10 text-orange-200", icon: RefreshCw },
  completed: { label: "Ready", color: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "border-red-300/25 bg-red-300/10 text-red-200", icon: XCircle },
};

const paymentStatusConfig = {
  pending: { label: "Booking pending", color: "text-amber-200" },
  paid: { label: "Booking confirmed", color: "text-emerald-200" },
  refunded: { label: "Refunded", color: "text-sky-200" },
  failed: { label: "Payment needs help", color: "text-red-200" },
};

function supplierLabel(order: Order) {
  if (order.supplier === "local") return "Local standard";
  if (order.supplier === "vistaprint" && order.frame_fulfillment_tier === "vistaprint_premium") return "Vistaprint premium";
  if (order.supplier === "vistaprint") return "Vistaprint";
  return "Internal";
}

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
      { label: "We received your idea", active: true },
      { label: "Booking confirmed", active: order.payment_status === "paid" },
      { label: "Great news - we've started your design", active: order.status === "in_progress" || order.status === "completed" },
      { label: order.delivery_type === "printed" ? fulfillmentLabel : "Final file is ready", active: order.status === "completed" },
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
    <div className="min-h-screen bg-[#070a0f] px-4 pb-16 pt-28 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1fr,0.55fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-[#f1c75b]">Order access</p>
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">Track your order</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Enter the order id from your bill or checkout message. No customer account is required.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
            Use the exact order id or bill number. Your files and order details stay private.
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#101820] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={inputOrderId}
                onChange={(event) => setInputOrderId(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="Paste your order id"
                className="w-full rounded-lg border border-white/10 bg-white/[0.06] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="rounded-lg bg-[#f1c75b] px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-[#ffdc73]"
            >
              Track Order
            </button>
          </div>
        </div>

        {!normalizedOrderId && (
          <div className="mt-6 rounded-lg border border-white/10 bg-[#101820] p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <ShoppingBag size={32} className="mx-auto text-[#f1c75b]" />
            <p className="mt-4 text-sm text-slate-300">Place an order first, then use the generated order id here.</p>
            <button type="button" onClick={() => navigate("services")} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-black text-white transition hover:border-[#f1c75b]">
              Choose Product <ArrowRight size={16} />
            </button>
          </div>
        )}

        {loading && (
          <div className="mt-6 flex justify-center rounded-lg border border-white/10 bg-[#101820] py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f1c75b]/30 border-t-[#f1c75b]" />
          </div>
        )}

        {normalizedOrderId && order === null && (
          <div className="mt-6 rounded-lg border border-red-300/25 bg-red-300/10 p-5 text-sm font-semibold text-red-200">
            {lookupError || "No order was found for that id. Please check the id and try again."}
          </div>
        )}

        {order && status && payment && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,0.55fr]">
            <section className="rounded-lg border border-white/10 bg-[#101820] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">Order ID</p>
                  <p className="mt-2 break-all text-sm font-black text-white">{order.id}</p>
                  <p className="mt-3 text-2xl font-black text-white">{order.bill_number ?? "Bill pending"}</p>
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
                <Info label="Supplier" value={supplierLabel(order)} />
                <Info label="Payment" value={payment.label} valueClassName={payment.color} />
                <Info label="Total" value={`Rs. ${order.total_amount}`} />
                <Info label="Advance" value={`Rs. ${order.advance_amount}`} />
                <Info label="Balance" value={`Rs. ${balance}`} />
              </div>

              <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-bold uppercase text-slate-400">Progress</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  {timeline.map((item) => (
                    <div key={item.label} className={`rounded-lg border p-3 ${item.active ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/[0.04] text-slate-500"}`}>
                      <p className="text-xs font-black">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="h-fit rounded-lg border border-[#f1c75b]/20 bg-[#0b1118] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-bold uppercase text-[#f7d880]">Delivery and support</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {order.fulfillment_method === "home_delivery"
                  ? "Keep this order id with you. Your printed order will be prepared for home delivery after the work is complete."
                  : "Keep this order id with you. For printed orders, show the bill number or barcode at pickup."}
              </p>
              {order.fulfillment_method === "home_delivery" && (
                <div className="mt-4 rounded-lg border border-white/10 bg-white/10 p-3 text-sm text-slate-300">
                  Supplier status: <span className="font-black text-[#f7d880]">{order.supplier_status.replace("_", " ")}</span>
                </div>
              )}
              {order.barcode_url && (
                <div className="mt-5 rounded-lg bg-white p-3">
                  <img src={order.barcode_url} alt={`Barcode for ${order.bill_number ?? order.id}`} className="h-auto w-full" />
                </div>
              )}
              <button type="button" onClick={() => navigate("services")} className="mt-5 w-full rounded-lg bg-[#f1c75b] px-5 py-3 text-sm font-black text-stone-950 transition hover:bg-[#ffdc73]">
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
  valueClassName = "text-white",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-[11px] font-bold uppercase text-slate-400">{label}</p>
      <p className={`mt-2 break-words text-sm font-black ${valueClassName}`}>{value}</p>
    </div>
  );
}
