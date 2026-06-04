const RAZORPAY_CHECKOUT_SCRIPT_ID = "razorpay-checkout-js";
const RAZORPAY_CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error?: {
    description?: string;
    reason?: string;
  };
}

interface RazorpayCheckoutInstance {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

export interface OpenRazorpayCheckoutOptions {
  key: string;
  amountPaise: number;
  currency: string;
  providerOrderId: string;
  brandName: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  billNumber: string;
}

function loadRazorpayScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(RAZORPAY_CHECKOUT_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load Razorpay Checkout.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = RAZORPAY_CHECKOUT_SCRIPT_ID;
    script.src = RAZORPAY_CHECKOUT_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout."));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(options: OpenRazorpayCheckoutOptions) {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error("Razorpay Checkout is not available.");
  }

  const Razorpay = window.Razorpay;
  return new Promise<RazorpaySuccessResponse>((resolve, reject) => {
    const checkout = new Razorpay({
      key: options.key,
      amount: options.amountPaise,
      currency: options.currency,
      name: options.brandName,
      description: options.description,
      order_id: options.providerOrderId,
      handler: resolve,
      prefill: {
        name: options.customerName,
        email: options.customerEmail,
        contact: options.customerPhone ?? undefined,
      },
      notes: {
        bill_number: options.billNumber,
      },
      theme: {
        color: "#D4AF37",
      },
      modal: {
        ondismiss: () => reject(new Error("Payment popup closed before completion.")),
      },
    });

    checkout.on("payment.failed", (response) => {
      reject(new Error(response.error?.description ?? response.error?.reason ?? "Razorpay payment failed."));
    });

    checkout.open();
  });
}
