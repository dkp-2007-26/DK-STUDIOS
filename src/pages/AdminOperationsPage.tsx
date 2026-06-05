import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { BarChart3, CheckCircle2, Clock3, CreditCard, LogOut, RefreshCw, Search, ShoppingBag } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { Page } from "../hooks/useRouter";
import {
  getAdminRazorpayStatus,
  loadAdminSnapshot,
  updateAdminOrder,
  upsertAdminPromotion,
  upsertAdminService,
  moderateAdminReview,
  type AdminSnapshot,
} from "../lib/studioApi";
import type { Order, Promotion, Review, Service } from "../types/database";
import type { RazorpayAdminStatus } from "../lib/studioApi";

interface AdminOperationsPageProps {
  navigate: (page: Page) => void;
}

type AdminTab = "orders" | "services" | "promotions" | "reviews" | "payments" | "analytics";

const statusConfig: Record<Order["status"], string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  confirmed: "border-sky-200 bg-sky-50 text-sky-800",
  in_progress: "border-orange-200 bg-orange-50 text-orange-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-red-200 bg-red-50 text-red-800",
};

const paymentConfig: Record<Order["payment_status"], string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
  refunded: "border-blue-200 bg-blue-50 text-blue-800",
  failed: "border-red-200 bg-red-50 text-red-800",
};

const formatCurrency = (value: number) => `Rs. ${value.toLocaleString("en-IN")}`;
const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not set";
const formatFulfillment = (order: Order) =>
  order.delivery_type === "printed"
    ? order.fulfillment_method === "home_delivery" ? "Home delivery" : "In-store pickup"
    : "Digital";
const formatSupplier = (order: Order) => {
  if (order.supplier === "local") return "Local standard";
  if (order.supplier === "vistaprint" && order.frame_fulfillment_tier === "vistaprint_premium") return "Vistaprint premium";
  if (order.supplier === "vistaprint") return "Vistaprint";
  return "Internal";
};

export default function AdminOperationsPage({ navigate }: AdminOperationsPageProps) {
  const { user, isAdmin, signOut } = useAuth();
  const [tab, setTab] = useState<AdminTab>("orders");
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [serviceForm, setServiceForm] = useState({ code: "", name: "", description: "", basePrice: 99, printPrice: 0, category: "print", isActive: true, sortOrder: 10 });
  const [promoForm, setPromoForm] = useState({ code: "", description: "", discount: 10, maxUses: 100, validUntil: "", isActive: true });
  const [razorpayStatus, setRazorpayStatus] = useState<RazorpayAdminStatus | null>(null);

  const orders = useMemo(() => snapshot?.orders ?? [], [snapshot?.orders]);
  const services = useMemo(() => snapshot?.services ?? [], [snapshot?.services]);
  const promotions = useMemo(() => snapshot?.promotions ?? [], [snapshot?.promotions]);
  const reviews = useMemo(() => snapshot?.reviews ?? [], [snapshot?.reviews]);
  const analytics = snapshot?.analytics;

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      setSnapshot(await loadAdminSnapshot());
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) void refresh();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      navigate("admin-secure-login");
    }
  }, [isAdmin, navigate]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((order) =>
      order.customer_name.toLowerCase().includes(query) ||
      order.customer_email.toLowerCase().includes(query) ||
      order.id.toLowerCase().includes(query) ||
      (order.bill_number ?? "").toLowerCase().includes(query),
    );
  }, [orders, search]);

  const paidRevenue = orders.filter((order) => order.payment_status === "paid").reduce((sum, order) => sum + order.total_amount, 0);
  const metrics = [
    { label: "Total orders", value: String(orders.length), icon: ShoppingBag },
    { label: "Pending", value: String(orders.filter((order) => order.status === "pending").length), icon: Clock3 },
    { label: "Paid revenue", value: formatCurrency(paidRevenue), icon: CreditCard },
    { label: "Services", value: String(services.length), icon: BarChart3 },
  ];

  if (!isAdmin) {
    return null;
  }

  const handleOrderPatch = async (orderId: string, patch: Record<string, unknown>) => {
    await updateAdminOrder({ orderId, ...patch });
    await refresh();
  };

  const handleServiceSubmit = async () => {
    await upsertAdminService(serviceForm);
    setServiceForm({ code: "", name: "", description: "", basePrice: 99, printPrice: 0, category: "print", isActive: true, sortOrder: 10 });
    await refresh();
  };

  const handlePromoSubmit = async () => {
    await upsertAdminPromotion(promoForm);
    setPromoForm({ code: "", description: "", discount: 10, maxUses: 100, validUntil: "", isActive: true });
    await refresh();
  };

  const loadRazorpayStatus = async () => {
    setError("");
    try {
      setRazorpayStatus(await getAdminRazorpayStatus());
    } catch (statusError) {
      setError((statusError as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f2e8] text-stone-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-[0_18px_50px_rgba(52,36,10,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-[#8a5b12]">Supabase Operations</p>
            <h1 className="mt-1 text-2xl font-black">Admin dashboard</h1>
            <p className="mt-1 text-sm text-stone-600">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate("order")} className="inline-flex items-center gap-2 rounded-lg bg-[#f1c75b] px-4 py-3 text-sm font-black text-stone-950">
              <ShoppingBag size={16} /> Take in-shop order
            </button>
            <button type="button" onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-3 text-sm font-black">
              <RefreshCw size={16} /> Refresh
            </button>
            <button type="button" onClick={() => { void signOut(); navigate("home"); }} className="inline-flex items-center gap-2 rounded-lg bg-stone-950 px-4 py-3 text-sm font-black text-white">
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </header>

        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-stone-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase text-stone-500">{metric.label}</p>
                <metric.icon size={18} className="text-[#8a5b12]" />
              </div>
              <p className="mt-3 text-2xl font-black">{metric.value}</p>
            </div>
          ))}
        </div>

        <nav className="mt-5 flex gap-2 overflow-x-auto rounded-lg border border-stone-200 bg-white p-2">
          {(["orders", "services", "promotions", "reviews", "payments", "analytics"] as AdminTab[]).map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-lg px-4 py-2 text-sm font-black capitalize ${tab === item ? "bg-stone-950 text-white" : "text-stone-600 hover:bg-stone-100"}`}>
              {item}
            </button>
          ))}
        </nav>

        {loading && <div className="mt-6 rounded-lg border border-stone-200 bg-white p-10 text-center text-stone-600">Loading Supabase data...</div>}

        {!loading && tab === "orders" && (
          <section className="mt-6 rounded-lg border border-stone-200 bg-white">
            <div className="border-b border-stone-200 p-4">
              <div className="relative max-w-lg">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search bill, customer, email, or order id" className="w-full rounded-lg border border-stone-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none" />
              </div>
            </div>
            <div className="divide-y divide-stone-200">
              {filteredOrders.map((order) => (
                <OrderRow key={order.id} order={order} onPatch={handleOrderPatch} />
              ))}
            </div>
          </section>
        )}

        {!loading && tab === "services" && (
          <EditorSection title="Services" onSubmit={() => void handleServiceSubmit()}>
            <ServiceForm form={serviceForm} setForm={setServiceForm} />
            <ListServices services={services} />
          </EditorSection>
        )}

        {!loading && tab === "promotions" && (
          <EditorSection title="Promotions" onSubmit={() => void handlePromoSubmit()}>
            <PromoForm form={promoForm} setForm={setPromoForm} />
            <ListPromotions promotions={promotions} />
          </EditorSection>
        )}

        {!loading && tab === "reviews" && (
          <section className="mt-6 grid gap-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} onModerate={async (status) => { await moderateAdminReview({ reviewId: review.id, status }); await refresh(); }} />
            ))}
          </section>
        )}

        {!loading && tab === "payments" && (
          <section className="mt-6 rounded-lg border border-stone-200 bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-[#8a5b12]">Razorpay testing</p>
                <h2 className="mt-1 text-xl font-black">Checkout configuration</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                  This panel verifies server-side Razorpay environment variables without exposing the secret key to the browser.
                </p>
              </div>
              <button type="button" onClick={() => void loadRazorpayStatus()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 py-3 text-sm font-black text-white">
                <RefreshCw size={16} /> Check Razorpay
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Configured" value={razorpayStatus?.configured ? "Yes" : razorpayStatus ? "No" : "Not checked"} />
              <Info label="Mode" value={razorpayStatus?.mode ?? "Not checked"} />
              <Info label="Key ID" value={razorpayStatus?.key_id_masked || "Hidden"} />
              <Info label="Secret" value={razorpayStatus?.secret_configured ? "Configured server-side" : razorpayStatus ? "Missing" : "Not checked"} />
            </div>

            <div className="mt-5 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
              <p className="font-black">Test checkout credentials</p>
              <p className="mt-2">Use Razorpay test mode cards/UPI in the checkout popup. The current advance amount is Rs. 49.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <Info label="Test card" value="4111 1111 1111 1111" />
                <Info label="Expiry / CVV" value="Any future date / any CVV" />
                <Info label="Test UPI" value="success@razorpay" />
              </div>
            </div>
          </section>
        )}

        {!loading && tab === "analytics" && analytics && (
          <section className="mt-6 rounded-lg border border-stone-200 bg-white p-6">
            <h2 className="text-xl font-black">Analytics overview</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Total orders" value={String(analytics.kpis.total_orders)} />
              <Info label="Paid orders" value={String(analytics.kpis.paid_orders)} />
              <Info label="Pending orders" value={String(analytics.kpis.pending_orders)} />
              <Info label="Paid revenue" value={formatCurrency(analytics.kpis.paid_revenue)} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function OrderRow({ order, onPatch }: { order: Order; onPatch: (orderId: string, patch: Record<string, unknown>) => Promise<void> }) {
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[1fr,auto] lg:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-black">{order.bill_number ?? order.id}</p>
          <span className={`rounded-full border px-2 py-1 text-xs font-black ${statusConfig[order.status]}`}>{order.status.replace("_", " ")}</span>
          <span className={`rounded-full border px-2 py-1 text-xs font-black ${paymentConfig[order.payment_status]}`}>{order.payment_status}</span>
        </div>
        <p className="mt-2 text-sm text-stone-600">{order.customer_name} · {order.customer_email} · {formatDate(order.created_at)}</p>
        <p className="mt-1 break-all text-xs text-stone-500">Order ID: {order.id}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-stone-600">
          <span className="rounded-full border border-stone-200 bg-slate-50 px-2 py-1">{formatFulfillment(order)}</span>
          {order.delivery_type === "printed" && <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-1 text-orange-800">Supplier: {formatSupplier(order)}</span>}
          {order.delivery_type === "printed" && <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-sky-800">Route: {order.supplier_status.replace("_", " ")}</span>}
          {order.fulfillment_method === "home_delivery" && <span className="rounded-full border border-stone-200 bg-slate-50 px-2 py-1">{[order.shipping_city, order.shipping_state, order.shipping_pincode].filter(Boolean).join(", ")}</span>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <select value={order.status} onChange={(event) => void onPatch(order.id, { status: event.target.value })} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm">
          {["pending", "confirmed", "in_progress", "completed", "cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select value={order.payment_status} onChange={(event) => void onPatch(order.id, { paymentStatus: event.target.value })} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm">
          {["pending", "paid", "refunded", "failed"].map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>
    </div>
  );
}

function EditorSection({ title, children, onSubmit }: { title: string; children: ReactNode; onSubmit: () => void }) {
  return (
    <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">{title}</h2>
        <button type="button" onClick={onSubmit} className="inline-flex items-center gap-2 rounded-lg bg-[#f1c75b] px-4 py-3 text-sm font-black text-stone-950">
          <CheckCircle2 size={16} /> Save
        </button>
      </div>
      {children}
    </section>
  );
}

type ServiceFormState = {
  code: string;
  name: string;
  description: string;
  basePrice: number;
  printPrice: number;
  category: string;
  isActive: boolean;
  sortOrder: number;
};

type PromoFormState = {
  code: string;
  description: string;
  discount: number;
  maxUses: number;
  validUntil: string;
  isActive: boolean;
};

function ServiceForm({ form, setForm }: { form: ServiceFormState; setForm: Dispatch<SetStateAction<ServiceFormState>> }) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Input value={form.code} onChange={(value) => setForm((current) => ({ ...current, code: value }))} placeholder="code" />
      <Input value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="name" />
      <Input value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} placeholder="description" />
      <Input value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} placeholder="category" />
      <Input value={String(form.basePrice)} onChange={(value) => setForm((current) => ({ ...current, basePrice: Number(value) }))} placeholder="base price" />
      <Input value={String(form.printPrice)} onChange={(value) => setForm((current) => ({ ...current, printPrice: Number(value) }))} placeholder="print price" />
    </div>
  );
}

function PromoForm({ form, setForm }: { form: PromoFormState; setForm: Dispatch<SetStateAction<PromoFormState>> }) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Input value={form.code} onChange={(value) => setForm((current) => ({ ...current, code: value.toUpperCase() }))} placeholder="code" />
      <Input value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} placeholder="description" />
      <Input value={String(form.discount)} onChange={(value) => setForm((current) => ({ ...current, discount: Number(value) }))} placeholder="discount %" />
      <Input value={form.validUntil} onChange={(value) => setForm((current) => ({ ...current, validUntil: value }))} placeholder="valid until ISO" />
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="rounded-lg border border-stone-200 bg-slate-50 px-4 py-3 text-sm outline-none" />;
}

function ListServices({ services }: { services: Service[] }) {
  return <div className="mt-5 grid gap-2">{services.map((service) => <Info key={service.id} label={`${service.name} (${service.category})`} value={`Rs. ${service.base_price}`} />)}</div>;
}

function ListPromotions({ promotions }: { promotions: Promotion[] }) {
  return <div className="mt-5 grid gap-2">{promotions.map((promo) => <Info key={promo.id} label={promo.code} value={`${promo.discount_percentage}% · ${promo.is_active ? "Active" : "Inactive"}`} />)}</div>;
}

function ReviewCard({ review, onModerate }: { review: Review; onModerate: (status: Review["status"]) => Promise<void> }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5">
      <p className="font-black">{review.customer_name} · {review.rating}/5</p>
      <p className="mt-2 text-sm text-stone-600">{review.message || "No message yet"}</p>
      <div className="mt-4 flex gap-2">
        <button onClick={() => void onModerate("approved")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white">Approve</button>
        <button onClick={() => void onModerate("rejected")} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-black text-white">Reject</button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase text-stone-500">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}
