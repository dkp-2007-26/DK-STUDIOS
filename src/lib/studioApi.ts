import { supabase } from "./supabase";
import type { AnalyticsOverview, Order, OrderPhoto, PrintJob, Promotion, Review, Service, Template } from "../types/database";

export type PublicSnapshot = {
  services: Service[];
  templates: Template[];
  testimonials: Array<{ id: string; name: string; location: string | null; message: string; rating: number }>;
};

export type AdminSnapshot = {
  orders: Order[];
  printJobs: PrintJob[];
  services: Service[];
  promotions: Promotion[];
  reviews: Review[];
  analytics: AnalyticsOverview;
};

export type RazorpayAdminStatus = {
  configured: boolean;
  mode: "test" | "live" | "unknown";
  key_id_masked: string;
  key_id_prefix: string;
  secret_configured: boolean;
};

export type PromoPreview = {
  code: string;
  description: string | null;
  discount_percentage: number;
  discount_amount: number;
  total_amount: number;
  valid_until: string | null;
} | null;

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function studioApi<T>(payload: Record<string, unknown>, requireAuth = false): Promise<T> {
  const token = await getAccessToken();
  if (requireAuth && !token) {
    throw new Error("Supabase login required.");
  }
  const response = await fetch("/.netlify/functions/studio-api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Studio API request failed.");
  }
  return (await response.json()) as T;
}

export const loadPublicSnapshot = () => studioApi<PublicSnapshot>({ action: "public.snapshot" });
export const previewPromotion = (promoCode: string, subtotalAmount: number) =>
  studioApi<PromoPreview>({ action: "promotions.preview", promoCode, subtotalAmount });
export const createOrder = (input: Record<string, unknown>) => studioApi<Order>({ action: "orders.create", ...input });
export const getPublicOrder = (orderId: string) => studioApi<Order | null>({ action: "orders.getPublic", orderId });
export const createRazorpayCheckout = (orderId: string) =>
  studioApi<{
    already_paid: boolean;
    provider_order_id: string;
    key_id: string;
    amount_paise: number;
    currency: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    receipt: string;
  }>({ action: "payments.createRazorpayCheckout", orderId });
export const verifyRazorpayPayment = (input: Record<string, unknown>) =>
  studioApi<{ ok: boolean }>({ action: "payments.verifyRazorpayPayment", ...input });
export const getReviewByToken = (reviewToken: string) => studioApi<Review | null>({ action: "reviews.getByToken", reviewToken });
export const submitReview = (input: Record<string, unknown>) => studioApi<Review>({ action: "reviews.submit", ...input });

export const loadAdminSnapshot = () => studioApi<AdminSnapshot>({ action: "admin.snapshot" }, true);
export const getAdminRazorpayStatus = () => studioApi<RazorpayAdminStatus>({ action: "admin.razorpayStatus" }, true);
export const updateAdminOrder = (input: Record<string, unknown>) =>
  studioApi<Order>({ action: "admin.updateOrder", ...input }, true);
export const upsertAdminService = (input: Record<string, unknown>) =>
  studioApi<{ ok: boolean }>({ action: "admin.upsertService", ...input }, true);
export const upsertAdminPromotion = (input: Record<string, unknown>) =>
  studioApi<{ ok: boolean }>({ action: "admin.upsertPromotion", ...input }, true);
export const removeAdminPromotion = (promotionId: string) =>
  studioApi<{ ok: boolean }>({ action: "admin.removePromotion", promotionId }, true);
export const moderateAdminReview = (input: Record<string, unknown>) =>
  studioApi<Review>({ action: "admin.moderateReview", ...input }, true);
export const listAdminPhotos = (orderId: string) =>
  studioApi<OrderPhoto[]>({ action: "admin.listPhotos", orderId }, true);
export const createAdminPrintJob = (input: Record<string, unknown>) =>
  studioApi<PrintJob>({ action: "admin.createPrintJob", ...input }, true);
export const cancelAdminPrintJob = (printJobId: string) =>
  studioApi<PrintJob>({ action: "admin.cancelPrintJob", printJobId }, true);

export const getDeliveryOrderByBarcode = (barcodeValue: string) =>
  studioApi<Order | null>({ action: "delivery.getByBarcode", barcodeValue }, true);
export const markDeliveryOrderDelivered = (barcodeValue: string) =>
  studioApi<Order>({ action: "delivery.markDelivered", barcodeValue }, true);
