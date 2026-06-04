"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

function env(name: string) {
  return process.env[name] ?? "";
}

function getBaseSiteUrl() {
  return env("VITE_SITE_URL") || env("URL") || "http://localhost:5173";
}

function normalizeWhatsAppRecipient(to: string | null) {
  if (!to) {
    return null;
  }
  const digits = to.replace(/\D/g, "");
  if (!digits) {
    return null;
  }
  return digits.startsWith("91") ? digits : `91${digits}`;
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = env("RESEND_API_KEY");
  const from = env("RESEND_FROM_EMAIL");
  if (!apiKey || !from) {
    return { status: "skipped" as const, provider: "resend", externalId: null };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = (await response.json()) as { id?: string };
  return {
    status: "sent" as const,
    provider: "resend",
    externalId: payload.id ?? null,
  };
}

async function sendWhatsApp({
  to,
  body,
}: {
  to: string | null;
  body: string;
}) {
  const recipient = normalizeWhatsAppRecipient(to);
  const accessToken = env("WHATSAPP_ACCESS_TOKEN") || env("META_WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId =
    env("WHATSAPP_PHONE_NUMBER_ID") || env("META_WHATSAPP_PHONE_NUMBER_ID");
  const apiVersion = env("WHATSAPP_API_VERSION") || "v22.0";

  if (!recipient || !accessToken || !phoneNumberId) {
    return { status: "skipped" as const, provider: "whatsapp_cloud", externalId: null };
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "text",
        text: {
          body,
          preview_url: false,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = (await response.json()) as { messages?: Array<{ id?: string }> };
  return {
    status: "sent" as const,
    provider: "whatsapp_cloud",
    externalId: payload.messages?.[0]?.id ?? null,
  };
}

async function sendSms({
  to,
  body,
}: {
  to: string | null;
  body: string;
}) {
  const accountSid = env("TWILIO_ACCOUNT_SID");
  const authToken = env("TWILIO_AUTH_TOKEN");
  const from = env("TWILIO_FROM_NUMBER");
  if (!to || !accountSid || !authToken || !from) {
    return { status: "skipped" as const, provider: "twilio", externalId: null };
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: from,
        Body: body,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = (await response.json()) as { sid?: string };
  return {
    status: "sent" as const,
    provider: "twilio",
    externalId: payload.sid ?? null,
  };
}

export const sendOrderLifecycleNotifications = internalAction({
  args: {
    orderId: v.id("orders"),
    event: v.string(),
  },
  handler: async (ctx, args) => {
    const rawOrder = await ctx.runQuery(internal.notificationActionsInternal.getOrderForNotification, {
      orderId: args.orderId,
    });
    if (!rawOrder) {
      return null;
    }

    const trackingUrl = rawOrder.tracking_url ?? rawOrder.barcode_url ?? "";
    const reviewLink = `${getBaseSiteUrl()}/?reviewToken=${rawOrder.review_token}#review`;
    const subjectByEvent: Record<string, string> = {
      order_created: `Order received: ${rawOrder.bill_number ?? rawOrder.id}`,
      order_in_progress: `Your DK STUDIOS order is now in progress`,
      order_completed: `Your DK STUDIOS order is ready`,
      pickup_ready: `Your DK STUDIOS order is ready for pickup`,
      review_request: `How was your DK STUDIOS order?`,
      payment_received: `Payment confirmed for ${rawOrder.bill_number ?? rawOrder.id}`,
    };
    const smsBodyByEvent: Record<string, string> = {
      order_created: `DK STUDIOS: Order ${rawOrder.bill_number ?? rawOrder.id} received. Track with ${trackingUrl}`,
      order_in_progress: `DK STUDIOS: Order ${rawOrder.bill_number ?? rawOrder.id} is now in progress.`,
      order_completed: `DK STUDIOS: Order ${rawOrder.bill_number ?? rawOrder.id} is completed. Track pickup with ${trackingUrl}`,
      pickup_ready: `DK STUDIOS: Order ${rawOrder.bill_number ?? rawOrder.id} is ready for pickup. Please bring/show this barcode: ${trackingUrl}`,
      review_request: `DK STUDIOS: Share your review for order ${rawOrder.bill_number ?? rawOrder.id}: ${reviewLink}`,
      payment_received: `DK STUDIOS: Payment confirmed for ${rawOrder.bill_number ?? rawOrder.id}.`,
    };
    const whatsappBodyByEvent: Record<string, string> = {
      pickup_ready: `Hi ${rawOrder.customer_name}, your DK STUDIOS order ${rawOrder.bill_number ?? rawOrder.id} is ready for pickup. Please show this barcode at pickup: ${trackingUrl}`,
    };
    const htmlByEvent: Record<string, string> = {
      order_created: `<p>Hi ${rawOrder.customer_name},</p><p>Your order <strong>${rawOrder.bill_number ?? rawOrder.id}</strong> has been created.</p><p>Tracking barcode: ${rawOrder.barcode_value ?? "Pending"}</p><p><a href="${trackingUrl}">Open tracking barcode</a></p>`,
      order_in_progress: `<p>Your order <strong>${rawOrder.bill_number ?? rawOrder.id}</strong> is now in progress.</p><p><a href="${trackingUrl}">Track order</a></p>`,
      order_completed: `<p>Your order <strong>${rawOrder.bill_number ?? rawOrder.id}</strong> has been marked as completed.</p><p><a href="${trackingUrl}">Open barcode & pickup details</a></p>`,
      pickup_ready: `<p>Hi ${rawOrder.customer_name},</p><p>Your order <strong>${rawOrder.bill_number ?? rawOrder.id}</strong> is ready for pickup.</p><p><a href="${trackingUrl}">Open pickup barcode</a></p>`,
      review_request: `<p>We would love your feedback for order <strong>${rawOrder.bill_number ?? rawOrder.id}</strong>.</p><p><a href="${reviewLink}">Submit your review</a></p>`,
      payment_received: `<p>Payment has been confirmed for order <strong>${rawOrder.bill_number ?? rawOrder.id}</strong>.</p>`,
    };

    const emailResult = await sendEmail({
      to: rawOrder.customer_email,
      subject: subjectByEvent[args.event] ?? "DK STUDIOS update",
      html: htmlByEvent[args.event] ?? "<p>Your order has been updated.</p>",
    }).catch(async (error: Error) => ({
      status: "failed" as const,
      provider: "resend",
      externalId: null,
      errorMessage: error.message,
    }));

    await ctx.runMutation(internal.notifications.createNotificationLog, {
      orderId: args.orderId,
      userId: rawOrder.user_id,
      event: args.event,
      channel: "email",
      provider: emailResult.provider,
      recipient: rawOrder.customer_email,
      status: emailResult.status,
      externalId: emailResult.externalId ?? null,
      errorMessage: "errorMessage" in emailResult ? emailResult.errorMessage ?? null : null,
    });

    const smsResult = await sendSms({
      to: rawOrder.customer_phone,
      body: smsBodyByEvent[args.event] ?? "Your order has been updated.",
    }).catch(async (error: Error) => ({
      status: "failed" as const,
      provider: "twilio",
      externalId: null,
      errorMessage: error.message,
    }));

    if (rawOrder.customer_phone) {
      await ctx.runMutation(internal.notifications.createNotificationLog, {
        orderId: args.orderId,
        userId: rawOrder.user_id,
        event: args.event,
        channel: "sms",
        provider: smsResult.provider,
        recipient: rawOrder.customer_phone,
        status: smsResult.status,
        externalId: smsResult.externalId ?? null,
        errorMessage: "errorMessage" in smsResult ? smsResult.errorMessage ?? null : null,
      });
    }

    if (args.event === "pickup_ready" && rawOrder.customer_phone) {
      const whatsappResult = await sendWhatsApp({
        to: rawOrder.customer_phone,
        body: whatsappBodyByEvent[args.event],
      }).catch(async (error: Error) => ({
        status: "failed" as const,
        provider: "whatsapp_cloud",
        externalId: null,
        errorMessage: error.message,
      }));

      await ctx.runMutation(internal.notifications.createNotificationLog, {
        orderId: args.orderId,
        userId: rawOrder.user_id,
        event: args.event,
        channel: "whatsapp",
        provider: whatsappResult.provider,
        recipient: rawOrder.customer_phone,
        status: whatsappResult.status,
        externalId: whatsappResult.externalId ?? null,
        errorMessage: "errorMessage" in whatsappResult ? whatsappResult.errorMessage ?? null : null,
      });

      await ctx.runMutation(internal.notificationActionsInternal.markPickupReadyNotified, {
        orderId: args.orderId,
      });
    }

    if (args.event === "review_request") {
      await ctx.runMutation(internal.notificationActionsInternal.markReviewRequested, {
        orderId: args.orderId,
      });
    }

    return null;
  },
});
