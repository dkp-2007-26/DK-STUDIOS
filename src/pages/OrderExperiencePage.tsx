import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, CreditCard, FileText, Home, MessageCircle, PackageCheck, Store, Tag } from "lucide-react";
import PhotoUploadStudio, { type EditablePhotoAsset } from "../components/order/PhotoUploadStudio";
import { useAuth } from "../context/AuthContext";
import type { NavigateTo } from "../hooks/useRouter";
import { BRAND_NAME, BRAND_STORAGE_SLUG, SUPPORT_WHATSAPP_URL } from "../lib/brand";
import { downloadInvoicePdf } from "../lib/invoice";
import { uploadFileToGoogleDrive } from "../lib/googleDrive";
import { openRazorpayCheckout } from "../lib/razorpay";
import { displayServicePrice, isVistaprintService } from "../lib/serviceCatalog";
import { addGlitchTipBreadcrumb, captureGlitchTipError } from "../lib/glitchtip";
import type { Order, Service, Template } from "../types/database";
import { useAsyncData } from "../hooks/useAsyncData";
import {
  createOrder,
  createRazorpayCheckout,
  loadPublicSnapshot,
  previewPromotion,
  verifyRazorpayPayment,
  type PromoPreview,
} from "../lib/studioApi";

interface OrderExperiencePageProps {
  navigate: NavigateTo;
  onOpenAuth: (mode: "login" | "forgot") => void;
}

type RazorpayCheckoutSession = {
  already_paid: boolean;
  provider_order_id: string;
  key_id: string;
  amount_paise: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  receipt: string;
};

const MANDATORY_ADVANCE_AMOUNT = 49;
const RAZORPAY_DISMISSAL_MESSAGE = "Payment was closed before the order was completed.";

function readOrderSelectionParams() {
  if (typeof window === "undefined") return { serviceId: "", templateId: "" };
  const hashQuery = window.location.hash.includes("?") ? window.location.hash.split("?")[1] : "";
  const params = new URLSearchParams(window.location.search || hashQuery);
  return {
    serviceId: params.get("service") || params.get("serviceId") || "",
    templateId: params.get("template") || params.get("templateId") || "",
  };
}

function isCustomerDismissalError(error: unknown) {
  return error instanceof Error && error.message === RAZORPAY_DISMISSAL_MESSAGE;
}

function isPhotoFrameService(service: Service | null) {
  if (!service) return false;
  const haystack = [service.id, service.name, service.category, service.description ?? ""].join(" ").toLowerCase();
  return haystack.includes("photo frame") || haystack.includes("photoframe") || haystack.includes("frame");
}

function frameTierFromOutputPackage(value: string | null | undefined) {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("standard photo frame")) return "local_standard" as const;
  if (normalized.includes("premium photo frame")) return "vistaprint_premium" as const;
  return null;
}

function packageAwareSubtotal(service: Service | null, productOptions: Record<string, string>, deliveryType: "digital" | "printed") {
  if (!service) return 0;
  const frameTier = frameTierFromOutputPackage(productOptions.output_package);
  if ((service.id === "digital-sketch" || service.id === "custom-sketch") && frameTier === "local_standard") {
    return 199;
  }
  return service.base_price + (deliveryType === "printed" ? service.print_price : 0);
}

function supplierLabel(order: Order) {
  if (order.supplier === "local") return "Local standard";
  if (order.supplier === "vistaprint" && order.frame_fulfillment_tier === "vistaprint_premium") return "Vistaprint premium";
  if (order.supplier === "vistaprint") return "Vistaprint";
  return "Internal";
}

export default function OrderExperiencePage({ navigate, onOpenAuth }: OrderExperiencePageProps) {
  const { user, sessionToken } = useAuth();
  const { data: publicData, loading: publicLoading } = useAsyncData(loadPublicSnapshot, []);
  const services = (publicData?.services ?? []) as Service[];
  const templates = (publicData?.templates ?? []) as Template[];
  const initialSelection = readOrderSelectionParams();

  const [serviceId] = useState(initialSelection.serviceId);
  const [templateId, setTemplateId] = useState(initialSelection.templateId);
  const [deliveryType, setDeliveryType] = useState<"digital" | "printed">("digital");
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"pickup" | "home_delivery">("pickup");
  const [frameFulfillmentTier, setFrameFulfillmentTier] = useState<"local_standard" | "vistaprint_premium">("local_standard");
  const [assets, setAssets] = useState<EditablePhotoAsset[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [productOptions, setProductOptions] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", email: "", phone: "", instructions: "", personalizationText: "" });
  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [promoPreview, setPromoPreview] = useState<PromoPreview>(null);
  void onOpenAuth;

  useEffect(() => {
    if (user) {
      setForm((current) => ({
        ...current,
        name: current.name || user.displayName,
        email: current.email || user.email,
      }));
    }
  }, [user]);

  const selectedService = services.find((service) => service.id === serviceId) ?? null;
  const selectedServiceBaseIsPhotoFrame = isPhotoFrameService(selectedService);
  const selectedServiceIsVistaprint = isVistaprintService(selectedService);
  const optionFrameTier = frameTierFromOutputPackage(productOptions.output_package);
  const effectiveDeliveryType = optionFrameTier ? "printed" : deliveryType;
  const selectedServiceIsPhotoFrame = selectedServiceBaseIsPhotoFrame || Boolean(optionFrameTier);
  const selectedFrameFulfillmentTier = optionFrameTier ?? frameFulfillmentTier;
  const routedSupplier = effectiveDeliveryType === "printed"
    ? selectedServiceIsPhotoFrame && selectedFrameFulfillmentTier === "local_standard" ? "Local standard" : "Vistaprint"
    : "Digital";
  const fulfillmentRequiresAddress = effectiveDeliveryType === "printed" && fulfillmentMethod === "home_delivery";
  const subtotal = packageAwareSubtotal(selectedService, productOptions, effectiveDeliveryType);
  const total = promoPreview?.total_amount ?? subtotal;
  const advance = MANDATORY_ADVANCE_AMOUNT;
  const balance = Math.max(total - advance, 0);

  useEffect(() => {
    if (!publicLoading && (!serviceId || !selectedService)) {
      navigate("services");
    }
  }, [navigate, publicLoading, selectedService, serviceId]);

  useEffect(() => {
    if (!selectedService?.product_options.length) {
      setProductOptions({});
      return;
    }
    setProductOptions(Object.fromEntries(
      selectedService.product_options.map((option) => [option.key, option.values[0] ?? ""]),
    ));
  }, [selectedService]);

  useEffect(() => {
    if (!selectedServiceIsVistaprint) return;
    setDeliveryType("printed");
    setFulfillmentMethod("home_delivery");
  }, [selectedServiceIsVistaprint, serviceId]);

  useEffect(() => {
    if (!optionFrameTier) return;
    setDeliveryType("printed");
    setFrameFulfillmentTier(optionFrameTier);
    if (optionFrameTier === "vistaprint_premium") {
      setFulfillmentMethod("home_delivery");
    }
  }, [optionFrameTier]);

  useEffect(() => {
    let cancelled = false;
    if (!appliedPromoCode) {
      setPromoPreview(null);
      return;
    }
    previewPromotion(appliedPromoCode, subtotal)
      .then((preview) => {
        if (!cancelled) setPromoPreview(preview);
      })
      .catch(() => {
        if (!cancelled) setPromoPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [appliedPromoCode, subtotal]);

  const handleSubmit = async () => {
    if (!selectedService) return;
    if (fulfillmentRequiresAddress) {
      const requiredAddress = [shipping.name || form.name, shipping.phone || form.phone, shipping.addressLine1, shipping.city, shipping.state, shipping.pincode];
      if (requiredAddress.some((value) => !value.trim())) {
        setError("Home delivery needs name, phone, address, city, state, and pincode.");
        return;
      }
    }

    setSubmitting(true);
    setError("");
    try {
      addGlitchTipBreadcrumb("Customer started order submission", {
        serviceId: selectedService.id,
        deliveryType: effectiveDeliveryType,
        fulfillmentMethod,
        frameFulfillmentTier: selectedServiceIsPhotoFrame ? selectedFrameFulfillmentTier : null,
        supplier: routedSupplier,
        assetCount: assets.length,
        total,
      });

      const folderOwner = user ? `${user.id}-${Date.now()}` : `guest-${Date.now()}`;
      const folder = `${BRAND_STORAGE_SLUG}/orders/${folderOwner}`;
      const uploadedPhotos = await Promise.all(
        assets.map(async (asset, index) => {
          const upload = await uploadFileToGoogleDrive({
            file: asset.file,
            folder,
            sessionToken,
          });
          return {
            ...upload,
            sortOrder: index,
            cropX: asset.crop?.x ?? null,
            cropY: asset.crop?.y ?? null,
            cropWidth: asset.crop?.width ?? null,
            cropHeight: asset.crop?.height ?? null,
          };
        }),
      );

      const order = (await createOrder({
        sessionToken: sessionToken ?? null,
        serviceCode: selectedService.id,
        templateCode: templateId || null,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone || null,
        instructions: form.instructions || null,
        frameOption: productOptions.output_package || "No Frame",
        frameSize: productOptions.frame_size || productOptions.size || "A4",
        collagePreference: "make_for_me",
        personalizationText: form.personalizationText || null,
        productOptions,
        photoCount: assets.length,
        photoNames: assets.map((asset) => asset.file.name),
        photoAssets: uploadedPhotos,
        deliveryType: effectiveDeliveryType,
        fulfillmentMethod: effectiveDeliveryType === "printed" ? fulfillmentMethod : "pickup",
        frameFulfillmentTier: selectedServiceIsPhotoFrame ? selectedFrameFulfillmentTier : null,
        shippingAddress: fulfillmentRequiresAddress ? {
          name: shipping.name || form.name,
          phone: shipping.phone || form.phone,
          addressLine1: shipping.addressLine1,
          addressLine2: shipping.addressLine2 || null,
          city: shipping.city,
          state: shipping.state,
          pincode: shipping.pincode,
          country: shipping.country || "India",
        } : null,
        subtotalAmount: subtotal,
        promoCode: appliedPromoCode || null,
        totalAmount: total,
        advanceAmount: advance,
      })) as Order;

      setCreatedOrder(order);
      localStorage.setItem("d.k-studios.lastOrderId", order.id);
      setPaymentError("");
      setPaymentSuccess(order.payment_status === "paid");
    } catch (submitError) {
      captureGlitchTipError(submitError, {
        tags: {
          surface: "checkout",
          operation: "order_submit",
        },
        extra: {
          serviceId: selectedService.id,
          hasTemplate: Boolean(templateId),
          deliveryType: effectiveDeliveryType,
          fulfillmentMethod,
          frameFulfillmentTier: selectedServiceIsPhotoFrame ? selectedFrameFulfillmentTier : null,
          supplier: routedSupplier,
          productOptions,
          assetCount: assets.length,
          hasPromo: Boolean(appliedPromoCode),
          total,
          advance,
        },
        fingerprint: ["checkout", "order_submit"],
      });
      setError((submitError as Error).message || "We couldn't book this order yet. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayAdvance = async () => {
    if (!createdOrder) return;

    setPaymentProcessing(true);
    setPaymentError("");
    try {
      addGlitchTipBreadcrumb("Customer started advance payment", {
        orderId: createdOrder.id,
        billNumber: createdOrder.bill_number,
        amount: createdOrder.advance_amount,
      });

      const checkout = (await createRazorpayCheckout(createdOrder.id)) as RazorpayCheckoutSession;

      if (checkout.already_paid) {
        setPaymentSuccess(true);
        setCreatedOrder((current) => current ? { ...current, payment_status: "paid" } : current);
        return;
      }

      if (!checkout.key_id) {
        throw new Error("Secure payment is not ready yet. Please message us and we'll help.");
      }

      const paymentResponse = await openRazorpayCheckout({
        key: checkout.key_id,
        amountPaise: checkout.amount_paise,
        currency: checkout.currency,
        providerOrderId: checkout.provider_order_id,
        brandName: BRAND_NAME,
        description: `Booking for ${checkout.receipt}`,
        customerName: checkout.customer_name,
        customerEmail: checkout.customer_email,
        customerPhone: checkout.customer_phone,
        billNumber: checkout.receipt,
      });

      const verified = (await verifyRazorpayPayment({
        sessionToken: sessionToken ?? null,
        orderId: createdOrder.id,
        providerOrderId: paymentResponse.razorpay_order_id,
        providerPaymentId: paymentResponse.razorpay_payment_id,
        providerSignature: paymentResponse.razorpay_signature,
      })) as { ok: boolean };

      if (!verified.ok) {
        throw new Error("We could not confirm the payment yet. Please try again or message us.");
      }

      setPaymentSuccess(true);
      setCreatedOrder((current) => current
        ? {
            ...current,
            payment_status: "paid",
            payment_provider: "razorpay",
            payment_order_id: paymentResponse.razorpay_order_id,
            payment_id: paymentResponse.razorpay_payment_id,
            payment_completed_at: new Date().toISOString(),
          }
        : current);
    } catch (paymentSubmitError) {
      if (!isCustomerDismissalError(paymentSubmitError)) {
        captureGlitchTipError(paymentSubmitError, {
          tags: {
            surface: "checkout",
            operation: "advance_payment",
            provider: "razorpay",
          },
          extra: {
            orderId: createdOrder.id,
            billNumber: createdOrder.bill_number,
            amount: createdOrder.advance_amount,
            paymentStatus: createdOrder.payment_status,
          },
          fingerprint: ["checkout", "advance_payment", "razorpay"],
        });
      }
      setPaymentError((paymentSubmitError as Error).message || "We couldn't open secure payment right now. Please try again.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleDownloadBill = async (order: Order) => {
    try {
      addGlitchTipBreadcrumb("Customer downloaded bill", {
        orderId: order.id,
        billNumber: order.bill_number,
      });
      await downloadInvoicePdf(order);
    } catch (billError) {
      captureGlitchTipError(billError, {
        tags: {
          surface: "checkout",
          operation: "bill_download",
        },
        extra: {
          orderId: order.id,
          billNumber: order.bill_number,
          paymentStatus: order.payment_status,
        },
        fingerprint: ["checkout", "bill_download"],
      });
      setPaymentError("We couldn't create the bill just now. Please try again.");
    }
  };

  if (createdOrder) {
    const paymentIsPaid = createdOrder.payment_status === "paid" || paymentSuccess;

    return (
      <div className="min-h-screen bg-[#070a0f] px-4 pb-16 pt-28 text-white">
        <div className="mx-auto max-w-4xl rounded-lg border border-white/10 bg-[#101820] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-300">
            <CheckCircle size={36} />
          </div>
          <h1 className="text-3xl font-black text-white">{paymentIsPaid ? "Your order is booked" : "Complete your order"}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            {paymentIsPaid
              ? `Your Rs. ${MANDATORY_ADVANCE_AMOUNT} booking amount is confirmed. You can pay the remaining balance after we finish the work, by cash or shop QR.`
              : `Your files are ready with us. Pay the Rs. ${MANDATORY_ADVANCE_AMOUNT} booking amount so we can start your design.`}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-6">
            <Info label="Order ID" value={createdOrder.id} dark />
            <Info label="Bill" value={createdOrder.bill_number ?? "Pending"} dark />
            <Info label="Booking" value={`Rs. ${createdOrder.advance_amount}`} dark />
            <Info label="Balance" value={`Rs. ${Math.max(createdOrder.total_amount - createdOrder.advance_amount, 0)}`} dark />
            <Info label="Booking" value={paymentIsPaid ? "Confirmed" : "Waiting"} dark />
            <Info label="Supplier" value={supplierLabel(createdOrder)} dark />
          </div>
          <BillPreview order={createdOrder} paid={paymentIsPaid} />
          <div className={`mt-6 rounded-lg border p-4 text-left ${paymentIsPaid ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            <p className={`text-sm font-black ${paymentIsPaid ? "text-emerald-700" : "text-amber-800"}`}>
              {paymentIsPaid ? "Booking confirmed" : `Complete your order securely`}
            </p>
            <p className={`mt-2 text-sm leading-6 ${paymentIsPaid ? "text-emerald-700" : "text-amber-800"}`}>
            {paymentIsPaid
              ? createdOrder.fulfillment_method === "home_delivery"
                ? `Great news. Your design is now in our work queue. ${supplierLabel(createdOrder)} fulfillment starts after the artwork is complete.`
                : `Great news. Your design is now in our work queue. Supplier route: ${supplierLabel(createdOrder)}.`
              : "Pay the Rs. 49 booking amount securely through Razorpay. We start the order after payment confirmation."}
            </p>
            {paymentError && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {paymentError}
              </p>
            )}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => void handleDownloadBill(createdOrder)} className="flex-1 rounded-lg border border-white/15 px-6 py-3 text-sm font-black text-white transition hover:border-[#f1c75b]">
              Download Bill
            </button>
            <button
              type="button"
              onClick={() => void handlePayAdvance()}
              disabled={paymentProcessing || paymentIsPaid}
              className="flex-1 rounded-lg bg-[#f1c75b] px-6 py-3 text-sm font-black text-stone-950 transition hover:bg-[#ffdc73] disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                <CreditCard size={16} />
                {paymentIsPaid ? "Booked" : paymentProcessing ? "Opening secure payment..." : `Complete order for Rs. ${createdOrder.advance_amount}`}
              </span>
            </button>
          </div>
          <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center justify-center gap-2 text-sm font-bold text-emerald-700 underline">
            <MessageCircle size={15} /> Need help finishing the order?
          </a>
          <button type="button" onClick={() => navigate("dashboard")} className="mt-5 block w-full text-sm font-bold text-slate-300 underline">
            Track this order
          </button>
        </div>
      </div>
    );
  }

  if (publicLoading && !selectedService) {
    return (
      <div className="min-h-screen bg-[#070a0f] px-4 pb-16 pt-28 text-white">
        <div className="mx-auto max-w-3xl rounded-lg border border-white/10 bg-[#101820] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#f1c75b]/30 border-t-[#f1c75b]" />
          <p className="mt-5 text-sm font-bold text-slate-300">Loading selected product...</p>
        </div>
      </div>
    );
  }

  if (!serviceId || !selectedService) {
    return (
      <div className="min-h-screen bg-[#070a0f] px-4 pb-16 pt-28 text-white">
        <div className="mx-auto max-w-3xl rounded-lg border border-white/10 bg-[#101820] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
          <PackageCheck size={36} className="mx-auto text-[#f1c75b]" />
          <h1 className="mt-5 text-3xl font-black text-white">Choose a product first</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            The checkout opens only after you select a service or product.
          </p>
          <button
            type="button"
            onClick={() => navigate("services")}
            className="mt-6 rounded-lg bg-[#f1c75b] px-6 py-3 text-sm font-black text-stone-950 transition hover:bg-[#ffdc73]"
          >
            Go to products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a0f] px-4 pb-16 pt-28 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1fr,0.65fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-[#f1c75b]">{BRAND_NAME} order</p>
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Place your order</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">Show us what you have in mind. Add your files, notes, and options here, then preview, crop, and arrange your photos before ordering.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
            Your files are safely stored for this order. Rs. {MANDATORY_ADVANCE_AMOUNT} booking amount is required; the balance is paid after we finish the work by cash or shop QR.
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr,0.65fr]">
        <div className="rounded-lg border border-white/10 bg-[#101820] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-8">
          <h2 className="text-2xl font-black text-white">Confirm your product</h2>

          <div className="mt-6 overflow-hidden rounded-lg border border-[#f1c75b]/25 bg-[#0b1118] shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
              <div className="grid gap-0 md:grid-cols-[0.42fr,0.58fr]">
                {selectedService.image_url && (
                  <div className="bg-black/25 p-4">
                    <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[#06080c] p-3">
                      <img src={selectedService.image_url} alt="" className="h-full w-full object-contain" loading="lazy" />
                    </div>
                  </div>
                )}
                <div className="p-5 text-left sm:p-6">
                  <p className="text-xs font-black uppercase text-[#f7d880]">Selected service</p>
                  <h3 className="mt-2 text-2xl font-black text-white">{selectedService.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{selectedService.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-lg border border-[#f1c75b]/25 bg-[#f1c75b]/10 px-3 py-2 text-sm font-black text-[#f7d880]">{displayServicePrice(selectedService)}</span>
                    {selectedService.product_details.map((detail) => (
                      <span key={detail} className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-bold text-slate-300">{detail}</span>
                    ))}
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Continue below to add your details, references, options, and booking.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("services")}
                    className="mt-5 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-black text-white transition hover:border-[#f1c75b]"
                  >
                    Change product
                  </button>
                </div>
              </div>
            </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]" />
            <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone number" className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]" />
            <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email address" className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b] sm:col-span-2" />
            <select value={effectiveDeliveryType} onChange={(event) => setDeliveryType(event.target.value as "digital" | "printed")} disabled={selectedServiceIsVistaprint || Boolean(optionFrameTier)} className="rounded-lg border border-white/10 bg-[#141c26] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f1c75b] disabled:opacity-70">
              <option value="digital">Digital Delivery</option>
              <option value="printed">Printed Copy</option>
            </select>
            <select value={templateId} onChange={(event) => setTemplateId(event.target.value)} className="rounded-lg border border-white/10 bg-[#141c26] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f1c75b]">
              <option value="">{BRAND_NAME} template</option>
              {templates.slice(0, 8).map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
            <input value={form.personalizationText} onChange={(event) => setForm((current) => ({ ...current, personalizationText: event.target.value }))} placeholder="Personalization text" className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b] sm:col-span-2" />
            <textarea value={form.instructions} onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))} placeholder="Special instructions" rows={4} className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b] sm:col-span-2" />
          </div>

          {selectedService?.product_options.length ? (
            <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Artwork options</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {selectedService.product_options.map((option) => (
                  <label key={option.key} className="block">
                    <span className="text-xs font-black uppercase text-slate-400">{option.label}</span>
                    <select
                      value={productOptions[option.key] ?? option.values[0] ?? ""}
                      onChange={(event) => setProductOptions((current) => ({ ...current, [option.key]: event.target.value }))}
                      className="mt-2 w-full rounded-lg border border-white/10 bg-[#141c26] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f1c75b]"
                    >
                      {option.values.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {effectiveDeliveryType === "printed" && (
            <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Supplier and fulfillment</p>
              {selectedServiceIsPhotoFrame ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={Boolean(optionFrameTier)}
                    onClick={() => setFrameFulfillmentTier("local_standard")}
                    className={`rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${selectedFrameFulfillmentTier === "local_standard" ? "border-[#f1c75b] bg-[#f1c75b]/10" : "border-white/10 bg-white/[0.04] hover:border-white/25"}`}
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-black text-white"><Store size={17} /> Standard photo frame</span>
                    <p className="mt-2 text-sm leading-6 text-slate-300">We route standard photo frame orders to the local supplier.</p>
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(optionFrameTier)}
                    onClick={() => setFrameFulfillmentTier("vistaprint_premium")}
                    className={`rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${selectedFrameFulfillmentTier === "vistaprint_premium" ? "border-[#f1c75b] bg-[#f1c75b]/10" : "border-white/10 bg-white/[0.04] hover:border-white/25"}`}
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-black text-white"><PackageCheck size={17} /> Premium photo frame</span>
                    <p className="mt-2 text-sm leading-6 text-slate-300">We route this frame option to Vistaprint.</p>
                  </button>
                </div>
              ) : (
                <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
                  <span className="inline-flex items-center gap-2 font-black text-white"><PackageCheck size={17} /> Vistaprint only</span>
                  <p className="mt-2">This product goes to Vistaprint. No backup supplier is used.</p>
                </div>
              )}
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setFulfillmentMethod("pickup")}
                  className={`rounded-lg border p-4 text-left transition ${fulfillmentMethod === "pickup" ? "border-[#f1c75b] bg-[#f1c75b]/10" : "border-white/10 bg-white/[0.04] hover:border-white/25"}`}
                >
                  <span className="inline-flex items-center gap-2 text-sm font-black text-white"><Store size={17} /> In-store pickup</span>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Collect from DK STUDIOS and pay the balance at pickup.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentMethod("home_delivery")}
                  className={`rounded-lg border p-4 text-left transition ${fulfillmentMethod === "home_delivery" ? "border-[#f1c75b] bg-[#f1c75b]/10" : "border-white/10 bg-white/[0.04] hover:border-white/25"}`}
                >
                  <span className="inline-flex items-center gap-2 text-sm font-black text-white"><Home size={17} /> Home delivery</span>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Send this printed order for supplier-handled delivery after the booking is confirmed.</p>
                </button>
              </div>
              {selectedServiceIsVistaprint && (
                <p className="mt-3 rounded-lg border border-[#f1c75b]/20 bg-[#f1c75b]/10 px-4 py-3 text-sm font-semibold leading-6 text-[#f7d880]">
                  Vistaprint product price stays the same for home delivery and in-store pickup.
                </p>
              )}

              {fulfillmentRequiresAddress && (
                <div className="mt-4 rounded-lg border border-white/10 bg-[#0b1118] p-4">
                  <p className="text-xs font-bold uppercase text-[#f7d880]">Delivery address</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Fill these details for home delivery. Name and phone can be different from the customer details above.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input value={shipping.name} onChange={(event) => setShipping((current) => ({ ...current, name: event.target.value }))} placeholder="Recipient name" className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]" />
                    <input value={shipping.phone} onChange={(event) => setShipping((current) => ({ ...current, phone: event.target.value }))} placeholder="Delivery phone" className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]" />
                    <input value={shipping.addressLine1} onChange={(event) => setShipping((current) => ({ ...current, addressLine1: event.target.value }))} placeholder="House / building / street" className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b] sm:col-span-2" />
                    <input value={shipping.addressLine2} onChange={(event) => setShipping((current) => ({ ...current, addressLine2: event.target.value }))} placeholder="Area / landmark (optional)" className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b] sm:col-span-2" />
                    <input value={shipping.city} onChange={(event) => setShipping((current) => ({ ...current, city: event.target.value }))} placeholder="City" className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]" />
                    <input value={shipping.state} onChange={(event) => setShipping((current) => ({ ...current, state: event.target.value }))} placeholder="State" className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]" />
                    <input value={shipping.pincode} onChange={(event) => setShipping((current) => ({ ...current, pincode: event.target.value }))} placeholder="Pincode" className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]" />
                    <input value={shipping.country} onChange={(event) => setShipping((current) => ({ ...current, country: event.target.value }))} placeholder="Country" className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <PhotoUploadStudio assets={assets} onChange={setAssets} />
          </div>

          <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={promoCode} onChange={(event) => setPromoCode(event.target.value.toUpperCase())} placeholder="Promo code" className="w-full rounded-lg border border-white/10 bg-white/[0.06] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]" />
              </div>
              <button type="button" onClick={() => setAppliedPromoCode(promoCode.trim() || null)} className="rounded-lg border border-white/10 bg-white/[0.08] px-5 py-3 text-sm font-black text-white transition hover:border-[#f1c75b]">Apply</button>
            </div>
            {appliedPromoCode && !promoPreview && <p className="mt-3 text-sm font-semibold text-red-600">Promo code is invalid or expired.</p>}
            {promoPreview && <p className="mt-3 text-sm font-semibold text-emerald-600">{promoPreview.code} applied: save Rs. {promoPreview.discount_amount}</p>}
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <span className="inline-flex items-center gap-2"><AlertCircle size={16} /> {error}</span>
            </div>
          )}

          <button type="button" disabled={submitting || !selectedService || !form.name || !form.email} onClick={() => void handleSubmit()} className="mt-6 w-full rounded-lg bg-[#f1c75b] py-4 text-sm font-black text-stone-950 transition hover:bg-[#ffdc73] disabled:opacity-60">
            {submitting ? "Saving your files..." : "Book your design"}
          </button>
        </div>

        {selectedService && (
        <aside className="h-fit rounded-lg border border-white/10 bg-[#101820] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] lg:sticky lg:top-24">
          <p className="text-xs font-bold uppercase text-[#f7d880]">Order summary</p>
          <h2 className="mt-2 text-2xl font-black text-white">{selectedService?.name ?? "Choose a service"}</h2>
          <div className="mt-6 space-y-3">
            <Info label="Subtotal" value={`Rs. ${subtotal}`} dark />
            <Info label="Discount" value={`Rs. ${promoPreview?.discount_amount ?? 0}`} dark />
            <Info label="Total" value={`Rs. ${total}`} highlight dark />
            <Info label="Booking" value={`Rs. ${advance}`} dark />
            <Info label="Balance after work" value={`Rs. ${balance}`} dark />
            <Info label="Fulfillment" value={effectiveDeliveryType === "printed" ? (fulfillmentMethod === "home_delivery" ? "Home delivery" : "In-store pickup") : "Digital"} dark />
            <Info label="Supplier" value={routedSupplier} dark />
            <Info label="References" value={`${assets.length}`} dark />
          </div>
          {selectedService?.product_options.length ? (
            <div className="mt-5 rounded-lg border border-white/10 bg-white/8 p-4 text-sm leading-6 text-slate-300">
              <span className="font-black text-[#f7d880]">Selected options</span>
              <div className="mt-3 space-y-2">
                {selectedService.product_options.map((option) => (
                  <Info key={option.key} label={option.label} value={productOptions[option.key] ?? "-"} dark />
                ))}
              </div>
            </div>
          ) : null}
          {optionFrameTier === "vistaprint_premium" && (
            <div className="mt-5 rounded-lg border border-[#f1c75b]/30 bg-[#f1c75b]/10 p-4 text-sm leading-6 text-[#f7d880]">
              Vistaprint frame pricing depends on the final size and option. Rs. 49 is the booking amount shown now.
            </div>
          )}
          {effectiveDeliveryType === "printed" && (
            <div className="mt-5 rounded-lg border border-white/10 bg-white/8 p-4 text-sm leading-6 text-slate-300">
              <span className="inline-flex items-center gap-2 font-black text-[#f7d880]"><PackageCheck size={16} /> Supplier route</span>
              <p className="mt-2">{selectedServiceIsPhotoFrame ? "Standard frames use the local supplier. Vistaprint frame options go to Vistaprint." : "This product goes to Vistaprint only."}</p>
            </div>
          )}
        </aside>
        )}
        </div>
      </div>
    </div>
  );
}

function BillPreview({ order, paid }: { order: Order; paid: boolean }) {
  const balance = Math.max(order.total_amount - order.advance_amount, 0);
  return (
    <div className="mt-6 rounded-lg border border-white/10 bg-[#070a0f] p-5 text-left">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase text-[#f7d880]"><FileText size={15} /> Bill preview</p>
          <h2 className="mt-2 text-xl font-black text-white">{order.bill_number ?? "Bill pending"}</h2>
        </div>
        <span className={`rounded-lg px-3 py-2 text-xs font-black uppercase ${paid ? "bg-emerald-300/15 text-emerald-200" : "bg-amber-300/15 text-amber-200"}`}>
          {paid ? "Booking confirmed" : "Booking pending"}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Subtotal" value={`Rs. ${order.subtotal_amount}`} dark />
        <Info label="Total" value={`Rs. ${order.total_amount}`} highlight dark />
        <Info label="Booking" value={`Rs. ${order.advance_amount}`} dark />
        <Info label="Balance" value={`Rs. ${balance}`} dark />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Info label="Fulfillment" value={order.delivery_type === "printed" ? (order.fulfillment_method === "home_delivery" ? "Home delivery" : "In-store pickup") : "Digital"} dark />
        <Info label="Supplier" value={supplierLabel(order)} dark />
        <Info label="Files" value={`${order.photo_count} ready for the design`} dark />
      </div>
      <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-300">
        Your reference files stay available while we work on the order, then they are scheduled for automatic deletion 1 hour after delivery or in-store pickup completion.
      </p>
    </div>
  );
}

function Info({ label, value, highlight = false, dark = false }: { label: string; value: string; highlight?: boolean; dark?: boolean }) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${dark ? "border-white/10 bg-white/8" : "border-stone-200 bg-slate-50"}`}>
      <p className={`text-[11px] font-bold uppercase ${dark ? "text-slate-400" : "text-stone-500"}`}>{label}</p>
      <p className={`mt-2 text-sm font-black ${dark ? (highlight ? "text-[#f7d880]" : "text-white") : (highlight ? "text-[#8a5b12]" : "text-stone-950")}`}>{value}</p>
    </div>
  );
}
