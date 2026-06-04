import * as Sentry from '@sentry/react';

const GLITCHTIP_DSN =
  import.meta.env.VITE_GLITCHTIP_DSN ||
  'https://52b91fa574fc4d4a96f76f3ab9f04e1c@app.glitchtip.com/22971';
const FILTERED = '[Filtered]';
const SENSITIVE_KEY_PATTERN =
  /token|password|secret|authorization|cookie|signature|credential|refresh|client_secret|private|api[_-]?key|razorpay|google/i;
const PII_KEY_PATTERN = /email|phone|mobile|address|customer/i;

type CaptureLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

interface CaptureOptions {
  tags?: Record<string, string | number | boolean | null | undefined>;
  extra?: Record<string, unknown>;
  contexts?: Record<string, Record<string, unknown>>;
  level?: CaptureLevel;
  fingerprint?: string[];
}

interface AppUserContext {
  id: string;
  role: string;
  isAdmin?: boolean;
  isDelivery?: boolean;
}

let cspListenerRegistered = false;

function getTracesSampleRate() {
  const configuredRate = Number(import.meta.env.VITE_GLITCHTIP_TRACES_SAMPLE_RATE ?? 0.01);

  if (!Number.isFinite(configuredRate) || configuredRate < 0 || configuredRate > 1) {
    return 0.01;
  }

  return configuredRate;
}

function sanitizeString(value: string) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, `Bearer ${FILTERED}`)
    .replace(/ya29\.[A-Za-z0-9._~+/=-]+/g, FILTERED)
    .replace(/1\/\/[A-Za-z0-9._~+/=-]+/g, FILTERED);
}

function shouldScrubKey(key: string) {
  return SENSITIVE_KEY_PATTERN.test(key) || PII_KEY_PATTERN.test(key);
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 5) {
    return '[Truncated]';
  }

  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (value instanceof File) {
    return {
      name: value.name,
      size: value.size,
      type: value.type,
    };
  }

  if (value instanceof Blob) {
    return {
      size: value.size,
      type: value.type,
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, 25).map((item) => sanitizeValue(item, depth + 1));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      shouldScrubKey(key) ? FILTERED : sanitizeValue(item, depth + 1),
    ]),
  );
}

function applyTags(scope: Sentry.Scope, tags?: CaptureOptions['tags']) {
  Object.entries(tags ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      scope.setTag(key, String(value));
    }
  });
}

function applyExtra(scope: Sentry.Scope, extra?: CaptureOptions['extra']) {
  Object.entries(extra ?? {}).forEach(([key, value]) => {
    scope.setExtra(key, sanitizeValue(value));
  });
}

function applyContexts(scope: Sentry.Scope, contexts?: CaptureOptions['contexts']) {
  Object.entries(contexts ?? {}).forEach(([key, value]) => {
    scope.setContext(key, sanitizeValue(value) as Record<string, unknown>);
  });
}

function sanitizeEvent(event: Sentry.ErrorEvent) {
  if (event.request?.cookies) {
    delete event.request.cookies;
  }

  if (event.request?.headers) {
    event.request.headers = sanitizeValue(event.request.headers) as Record<string, string>;
  }

  if (event.request?.data) {
    event.request.data = sanitizeValue(event.request.data);
  }

  if (event.extra) {
    event.extra = sanitizeValue(event.extra) as Record<string, unknown>;
  }

  if (event.contexts) {
    event.contexts = sanitizeValue(event.contexts) as Sentry.ErrorEvent['contexts'];
  }

  if (event.user) {
    event.user = sanitizeValue(event.user) as Sentry.ErrorEvent['user'];
  }

  return event;
}

function registerCspListener() {
  if (cspListenerRegistered || typeof window === 'undefined') {
    return;
  }

  cspListenerRegistered = true;
  window.addEventListener('securitypolicyviolation', (event) => {
    captureGlitchTipMessage('Content security policy violation', {
      level: event.disposition === 'enforce' ? 'error' : 'warning',
      tags: {
        surface: 'browser',
        category: 'csp',
        disposition: event.disposition,
      },
      extra: {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        effectiveDirective: event.effectiveDirective,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
      },
      fingerprint: ['csp', event.effectiveDirective || event.violatedDirective || 'unknown'],
    });
  });
}

export function initGlitchTip() {
  if (import.meta.env.VITE_GLITCHTIP_ENABLED === 'false') {
    return;
  }

  Sentry.init({
    dsn: GLITCHTIP_DSN,
    environment: import.meta.env.VITE_GLITCHTIP_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_APP_RELEASE || undefined,
    tracesSampleRate: getTracesSampleRate(),
    sendDefaultPii: false,
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.data) {
        breadcrumb.data = sanitizeValue(breadcrumb.data) as Record<string, unknown>;
      }
      return breadcrumb;
    },
    beforeSend: sanitizeEvent,
  });

  Sentry.setTag('app', 'dk-studios');
  Sentry.setTag('runtime', 'browser');
  registerCspListener();
}

export function setGlitchTipUser(user: AppUserContext | null) {
  if (!user) {
    Sentry.setUser(null);
    Sentry.setTag('user_role', 'guest');
    return;
  }

  Sentry.setUser({
    id: user.id,
    role: user.role,
  });
  Sentry.setTag('user_role', user.role);
  Sentry.setTag('is_admin', String(!!user.isAdmin));
  Sentry.setTag('is_delivery', String(!!user.isDelivery));
}

export function setGlitchTipRoute(route: string) {
  Sentry.setTag('app_route', route);
}

export function captureGlitchTipError(error: unknown, options: CaptureOptions = {}) {
  Sentry.withScope((scope) => {
    if (options.level) {
      scope.setLevel(options.level);
    }
    if (options.fingerprint) {
      scope.setFingerprint(options.fingerprint);
    }
    applyTags(scope, options.tags);
    applyExtra(scope, options.extra);
    applyContexts(scope, options.contexts);
    Sentry.captureException(error);
  });
}

export function captureGlitchTipMessage(message: string, options: CaptureOptions = {}) {
  Sentry.withScope((scope) => {
    if (options.level) {
      scope.setLevel(options.level);
    }
    if (options.fingerprint) {
      scope.setFingerprint(options.fingerprint);
    }
    applyTags(scope, options.tags);
    applyExtra(scope, options.extra);
    applyContexts(scope, options.contexts);
    Sentry.captureMessage(message);
  });
}

export function addGlitchTipBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
  level: CaptureLevel = 'info',
) {
  Sentry.addBreadcrumb({
    category: 'dk-studios',
    message,
    level,
    data: sanitizeValue(data ?? {}) as Record<string, unknown>,
  });
}
