import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

type RazorpayPaymentEntity = {
  id?: string;
  order_id?: string;
  amount?: number;
};

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: RazorpayPaymentEntity;
    };
  };
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

async function createWebhookSignature(rawBody: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  return bytesToHex(signature);
}

async function verifyWebhookSignature(rawBody: string, receivedSignature: string, secret: string) {
  const expectedSignature = await createWebhookSignature(rawBody, secret);
  return timingSafeEqualHex(expectedSignature, receivedSignature);
}

http.route({
  path: "/razorpay-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
    if (!webhookSecret) {
      return jsonResponse({ ok: false, error: "RAZORPAY_WEBHOOK_SECRET is not configured." }, 500);
    }

    const rawBody = await request.text();
    const receivedSignature = request.headers.get("x-razorpay-signature") ?? "";
    if (!receivedSignature || !(await verifyWebhookSignature(rawBody, receivedSignature, webhookSecret))) {
      return jsonResponse({ ok: false, error: "Invalid webhook signature." }, 401);
    }

    const webhook = JSON.parse(rawBody) as RazorpayWebhookPayload;
    const payment = webhook.payload?.payment?.entity;
    if (!payment?.order_id || !payment.id) {
      return jsonResponse({ ok: true, skipped: true });
    }

    if (webhook.event === "payment.captured") {
      await ctx.runMutation(internal.payments.applyWebhookPayment, {
        providerOrderId: payment.order_id,
        providerPaymentId: payment.id,
        providerSignature: null,
        amount: typeof payment.amount === "number" ? payment.amount / 100 : 0,
        status: "paid",
      });
    }

    if (webhook.event === "payment.failed") {
      await ctx.runMutation(internal.payments.applyWebhookPayment, {
        providerOrderId: payment.order_id,
        providerPaymentId: payment.id,
        providerSignature: null,
        amount: typeof payment.amount === "number" ? payment.amount / 100 : 0,
        status: "failed",
      });
    }

    return jsonResponse({ ok: true });
  }),
});

export default http;
