"use node";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { ActionCtx } from "./_generated/server";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";

function readEnv(name: string) {
  return process.env[name] ?? "";
}

function readRequiredEnv(name: string) {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

type CheckoutContext = {
  order_id: string;
  bill_number: string;
  amount: number;
  amount_paise: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  existing_provider_order_id: string | null;
  payment_status: string;
};

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  receipt: string | null;
  status: string;
};

type RazorpayCheckoutResult = {
  already_paid: boolean;
  order_id: string;
  provider: "razorpay";
  provider_order_id: string;
  key_id: string;
  amount: number;
  amount_paise: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  receipt: string;
};

type ApplyPaymentResult = {
  ok: boolean;
  orderId?: string;
};

type VerifyRazorpayPaymentResult = {
  ok: boolean;
  order_id: string;
  provider_order_id: string;
  provider_payment_id: string;
};

type DeliveryBalanceContext = {
  order_id: string;
  bill_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  staff_email: string;
  advance_paid: boolean;
  balance_amount: number;
  balance_amount_paise: number;
  existing_qr_id: string | null;
  existing_qr_image_url: string | null;
};

type RazorpayQrCode = {
  id: string;
  image_url?: string | null;
  image_content?: string | null;
  payment_amount: number;
  status: "active" | "closed";
  payments_amount_received?: number;
  payments_count_received?: number;
};

type RazorpayQrPayment = {
  id: string;
  amount: number;
  status: string;
};

type DeliveryBalanceQrResult = {
  already_paid: boolean;
  order_id: string;
  qr_id: string | null;
  image_url: string | null;
  image_content: string | null;
  amount: number;
  amount_paise: number;
  currency: "INR";
  status: string;
  message: string;
};

type DeliveryBalanceQrStatusResult = {
  paid: boolean;
  order_id: string;
  qr_id: string;
  provider_payment_id: string | null;
  amount_received_paise: number;
  status: string;
  message: string;
};

function createBasicAuthHeader(keyId: string, keySecret: string) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

function createRazorpayPaymentSignature(providerOrderId: string, providerPaymentId: string, keySecret: string) {
  return createHmac("sha256", keySecret)
    .update(`${providerOrderId}|${providerPaymentId}`)
    .digest("hex");
}

function timingSafeEqualHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function serializeCheckoutContext(
  checkoutContext: CheckoutContext,
  providerOrderId: string,
  keyId: string,
  currency = "INR",
): RazorpayCheckoutResult {
  return {
    already_paid: checkoutContext.payment_status === "paid",
    order_id: checkoutContext.order_id,
    provider: "razorpay",
    provider_order_id: providerOrderId,
    key_id: keyId,
    amount: checkoutContext.amount,
    amount_paise: checkoutContext.amount_paise,
    currency,
    customer_name: checkoutContext.customer_name,
    customer_email: checkoutContext.customer_email,
    customer_phone: checkoutContext.customer_phone,
    receipt: checkoutContext.bill_number,
  };
}

async function razorpayRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const keyId = readRequiredEnv("RAZORPAY_KEY_ID");
  const keySecret = readRequiredEnv("RAZORPAY_KEY_SECRET");
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: createBasicAuthHeader(keyId, keySecret),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Razorpay request failed (${response.status}): ${body.slice(0, 300)}`);
  }

  return (await response.json()) as T;
}

function serializeDeliveryQr(
  context: DeliveryBalanceContext,
  qr: RazorpayQrCode,
): DeliveryBalanceQrResult {
  return {
    already_paid: (qr.payments_amount_received ?? 0) >= context.balance_amount_paise,
    order_id: context.order_id,
    qr_id: qr.id,
    image_url: qr.image_url ?? null,
    image_content: qr.image_content ?? null,
    amount: context.balance_amount,
    amount_paise: context.balance_amount_paise,
    currency: "INR",
    status: qr.status,
    message: "Show this QR to collect the remaining balance.",
  };
}

async function createRazorpayCheckoutHandler(
  ctx: ActionCtx,
  args: { sessionToken?: string | null; orderId: string },
): Promise<RazorpayCheckoutResult> {
  const checkoutContext = (await ctx.runQuery(api.payments.getCheckoutContext, {
    sessionToken: args.sessionToken,
    orderId: args.orderId,
  })) as CheckoutContext;

  const keyId = readRequiredEnv("RAZORPAY_KEY_ID");
  const keySecret = readRequiredEnv("RAZORPAY_KEY_SECRET");

  if (checkoutContext.payment_status === "paid") {
    return serializeCheckoutContext(
      checkoutContext,
      checkoutContext.existing_provider_order_id ?? "",
      keyId,
    );
  }

  if (checkoutContext.amount_paise < 100) {
    throw new Error("Razorpay requires an advance amount of at least Rs. 1.");
  }

  if (checkoutContext.existing_provider_order_id?.startsWith("order_")) {
    return serializeCheckoutContext(checkoutContext, checkoutContext.existing_provider_order_id, keyId);
  }

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: createBasicAuthHeader(keyId, keySecret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: checkoutContext.amount_paise,
      currency: "INR",
      receipt: checkoutContext.bill_number.slice(0, 40),
      notes: {
        dk_studios_order_id: checkoutContext.order_id,
        bill_number: checkoutContext.bill_number,
        account: "DK BOOK",
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Razorpay order creation failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const razorpayOrder = (await response.json()) as RazorpayOrderResponse;

  await ctx.runMutation(api.payments.recordCheckoutOrder, {
    sessionToken: args.sessionToken,
    orderId: args.orderId,
    provider: "razorpay",
    providerOrderId: razorpayOrder.id,
    amount: checkoutContext.amount,
    currency: razorpayOrder.currency,
    checkoutUrl: null,
  });

  return serializeCheckoutContext(checkoutContext, razorpayOrder.id, keyId, razorpayOrder.currency);
}

export const createRazorpayCheckout = action({
  args: {
    sessionToken: v.optional(v.union(v.string(), v.null())),
    orderId: v.string(),
  },
  handler: createRazorpayCheckoutHandler,
});

export const verifyRazorpayPayment = action({
  args: {
    sessionToken: v.optional(v.union(v.string(), v.null())),
    orderId: v.string(),
    providerOrderId: v.string(),
    providerPaymentId: v.string(),
    providerSignature: v.string(),
  },
  handler: async (ctx, args): Promise<VerifyRazorpayPaymentResult> => {
    const checkoutContext = (await ctx.runQuery(api.payments.getCheckoutContext, {
      sessionToken: args.sessionToken,
      orderId: args.orderId,
    })) as CheckoutContext;

    if (checkoutContext.existing_provider_order_id !== args.providerOrderId) {
      throw new Error("Razorpay order id does not match this order.");
    }

    const keySecret = readRequiredEnv("RAZORPAY_KEY_SECRET");
    const expectedSignature = createRazorpayPaymentSignature(
      args.providerOrderId,
      args.providerPaymentId,
      keySecret,
    );

    if (!timingSafeEqualHex(expectedSignature, args.providerSignature)) {
      throw new Error("Razorpay payment signature verification failed.");
    }

    const result: ApplyPaymentResult = await ctx.runMutation(internal.payments.applyWebhookPayment, {
      providerOrderId: args.providerOrderId,
      providerPaymentId: args.providerPaymentId,
      providerSignature: args.providerSignature,
      amount: checkoutContext.amount,
      status: "paid",
    });

    return {
      ok: result.ok,
      order_id: checkoutContext.order_id,
      provider_order_id: args.providerOrderId,
      provider_payment_id: args.providerPaymentId,
    };
  },
});

export const createDeliveryBalanceQr = action({
  args: {
    sessionToken: v.string(),
    orderId: v.string(),
  },
  handler: async (ctx, args): Promise<DeliveryBalanceQrResult> => {
    const context = (await ctx.runQuery(api.payments.getDeliveryBalanceContext, {
      sessionToken: args.sessionToken,
      orderId: args.orderId,
    })) as DeliveryBalanceContext;

    if (!context.advance_paid) {
      throw new Error("The mandatory Rs. 49 advance must be paid before delivery.");
    }

    if (context.balance_amount_paise <= 0) {
      return {
        already_paid: true,
        order_id: context.order_id,
        qr_id: null,
        image_url: null,
        image_content: null,
        amount: 0,
        amount_paise: 0,
        currency: "INR",
        status: "paid",
        message: "No balance remains on this order.",
      };
    }

    if (context.existing_qr_id) {
      const existingQr = await razorpayRequest<RazorpayQrCode>(
        `/payments/qr_codes/${encodeURIComponent(context.existing_qr_id)}`,
      ).catch(() => null);
      if (
        existingQr &&
        existingQr.status === "active" &&
        existingQr.payment_amount === context.balance_amount_paise
      ) {
        return serializeDeliveryQr(context, existingQr);
      }
    }

    const qr = await razorpayRequest<RazorpayQrCode>("/payments/qr_codes", {
      method: "POST",
      body: JSON.stringify({
        type: "upi_qr",
        name: `DK STUDIOS ${context.bill_number}`.slice(0, 64),
        usage: "single_use",
        fixed_amount: true,
        payment_amount: context.balance_amount_paise,
        description: `Delivery balance for ${context.bill_number}`,
        close_by: Math.floor(Date.now() / 1000) + 30 * 60,
        notes: {
          dk_studios_order_id: context.order_id,
          bill_number: context.bill_number,
          account: "DK BOOK",
          payment_kind: "delivery_balance",
        },
      }),
    });

    await ctx.runMutation(api.payments.recordDeliveryBalanceQr, {
      sessionToken: args.sessionToken,
      orderId: args.orderId,
      qrId: qr.id,
      imageUrl: qr.image_url ?? null,
      amount: context.balance_amount,
      currency: "INR",
    });

    return serializeDeliveryQr(context, qr);
  },
});

export const checkDeliveryBalanceQrStatus = action({
  args: {
    sessionToken: v.string(),
    orderId: v.string(),
    qrId: v.string(),
  },
  handler: async (ctx, args): Promise<DeliveryBalanceQrStatusResult> => {
    const context = (await ctx.runQuery(api.payments.getDeliveryBalanceContext, {
      sessionToken: args.sessionToken,
      orderId: args.orderId,
    })) as DeliveryBalanceContext;
    const qr = await razorpayRequest<RazorpayQrCode>(
      `/payments/qr_codes/${encodeURIComponent(args.qrId)}`,
    );
    const payments = await razorpayRequest<{ items?: RazorpayQrPayment[] }>(
      `/payments/qr_codes/${encodeURIComponent(args.qrId)}/payments?count=10`,
    );
    const capturedPayment = payments.items?.find(
      (payment) => payment.status === "captured" && payment.amount >= context.balance_amount_paise,
    );
    const amountReceived = qr.payments_amount_received ?? capturedPayment?.amount ?? 0;
    const paid = Boolean(capturedPayment) || amountReceived >= context.balance_amount_paise;

    if (paid) {
      await ctx.runMutation(internal.payments.applyDeliveryBalancePayment, {
        providerOrderId: args.qrId,
        providerPaymentId: capturedPayment?.id ?? null,
        deliveryVerifiedBy: context.staff_email,
        amount: amountReceived / 100,
      });
    }

    return {
      paid,
      order_id: context.order_id,
      qr_id: args.qrId,
      provider_payment_id: capturedPayment?.id ?? null,
      amount_received_paise: amountReceived,
      status: paid ? "paid" : qr.status,
      message: paid ? "UPI payment confirmed. Pickup is marked complete." : "Waiting for Razorpay confirmation.",
    };
  },
});
