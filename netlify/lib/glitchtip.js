import * as Sentry from "@sentry/node";

const DEFAULT_GLITCHTIP_DSN = "https://52b91fa574fc4d4a96f76f3ab9f04e1c@app.glitchtip.com/22971";
const FILTERED = "[Filtered]";
const SENSITIVE_KEY_PATTERN =
  /token|password|secret|authorization|cookie|signature|credential|refresh|client_secret|private|api[_-]?key|razorpay|google/i;
const PII_KEY_PATTERN = /email|phone|mobile|address|customer/i;

let initialized = false;

function getTracesSampleRate() {
  const configuredRate = Number(process.env.GLITCHTIP_TRACES_SAMPLE_RATE ?? 0.01);
  return Number.isFinite(configuredRate) && configuredRate >= 0 && configuredRate <= 1
    ? configuredRate
    : 0.01;
}

function sanitizeString(value) {
  return String(value)
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, `Bearer ${FILTERED}`)
    .replace(/ya29\.[A-Za-z0-9._~+/=-]+/g, FILTERED)
    .replace(/1\/\/[A-Za-z0-9._~+/=-]+/g, FILTERED);
}

function shouldScrubKey(key) {
  return SENSITIVE_KEY_PATTERN.test(key) || PII_KEY_PATTERN.test(key);
}

function sanitizeValue(value, depth = 0) {
  if (depth > 5) {
    return "[Truncated]";
  }

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (Buffer.isBuffer(value)) {
    return {
      type: "Buffer",
      bytes: value.length,
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, 25).map((item) => sanitizeValue(item, depth + 1));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      shouldScrubKey(key) ? FILTERED : sanitizeValue(item, depth + 1),
    ]),
  );
}

function sanitizeEvent(event) {
  if (event.request?.cookies) {
    delete event.request.cookies;
  }

  if (event.request?.headers) {
    event.request.headers = sanitizeValue(event.request.headers);
  }

  if (event.request?.data) {
    event.request.data = sanitizeValue(event.request.data);
  }

  if (event.extra) {
    event.extra = sanitizeValue(event.extra);
  }

  if (event.contexts) {
    event.contexts = sanitizeValue(event.contexts);
  }

  if (event.user) {
    event.user = sanitizeValue(event.user);
  }

  return event;
}

function applyTags(scope, tags = {}) {
  Object.entries(tags).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      scope.setTag(key, String(value));
    }
  });
}

function applyExtra(scope, extra = {}) {
  Object.entries(extra).forEach(([key, value]) => {
    scope.setExtra(key, sanitizeValue(value));
  });
}

function applyContexts(scope, contexts = {}) {
  Object.entries(contexts).forEach(([key, value]) => {
    scope.setContext(key, sanitizeValue(value));
  });
}

export function initGlitchTip({ surface }) {
  if (process.env.GLITCHTIP_ENABLED === "false") {
    return;
  }

  if (!initialized) {
    initialized = true;
    Sentry.init({
      dsn: process.env.GLITCHTIP_DSN || DEFAULT_GLITCHTIP_DSN,
      environment: process.env.GLITCHTIP_ENVIRONMENT || process.env.CONTEXT || process.env.NODE_ENV,
      release: process.env.APP_RELEASE || process.env.COMMIT_REF,
      tracesSampleRate: getTracesSampleRate(),
      sendDefaultPii: false,
      beforeSend: sanitizeEvent,
    });
  }

  Sentry.setTag("app", "dk-studios");
  Sentry.setTag("runtime", "netlify-function");
  if (surface) {
    Sentry.setTag("surface", surface);
  }
}

export function shouldReportError(status) {
  return !status || status >= 500;
}

export function captureFunctionError(error, {
  functionName,
  status,
  tags = {},
  extra = {},
  contexts = {},
  fingerprint,
} = {}) {
  if (!shouldReportError(status)) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag("function", functionName || "unknown");
    if (status) {
      scope.setTag("http_status", String(status));
    }
    if (fingerprint) {
      scope.setFingerprint(fingerprint);
    }
    applyTags(scope, tags);
    applyExtra(scope, {
      status,
      ...extra,
    });
    applyContexts(scope, contexts);
    Sentry.captureException(error);
  });
}

export async function flushGlitchTip(timeout = 2000) {
  if (process.env.GLITCHTIP_ENABLED === "false") {
    return;
  }

  await Sentry.flush(timeout).catch(() => undefined);
}

export function safeErrorMessage(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}
