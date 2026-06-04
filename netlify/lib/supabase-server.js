import { createClient } from "@supabase/supabase-js";

class SupabaseServerError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

function readEnv(name) {
  return process.env[name] ?? "";
}

function requireEnv(name) {
  const value = readEnv(name);
  if (!value) {
    throw new SupabaseServerError(`${name} is not configured.`, 500);
  }
  return value;
}

export function getSupabaseUrl() {
  return readEnv("SUPABASE_URL") || readEnv("VITE_SUPABASE_URL");
}

export function getSupabaseServiceClient() {
  const url = getSupabaseUrl();
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY") || readEnv("SUPABASE_SERVICE_KEY");
  if (!url || !serviceKey) {
    throw new SupabaseServerError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.", 500);
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabaseAnonClient(accessToken = "") {
  const url = getSupabaseUrl();
  const anonKey = readEnv("SUPABASE_ANON_KEY") || readEnv("VITE_SUPABASE_ANON_KEY");
  if (!url || !anonKey) {
    throw new SupabaseServerError("SUPABASE_URL and SUPABASE_ANON_KEY are required.", 500);
  }
  return createClient(url, anonKey, {
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getAuthContext(accessToken) {
  if (!accessToken) {
    return { authUser: null, appUser: null };
  }
  const anon = getSupabaseAnonClient(accessToken);
  const { data, error } = await anon.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new SupabaseServerError("Invalid or expired Supabase session.", 401);
  }
  const supabase = getSupabaseServiceClient();
  const { data: appUser, error: appUserError } = await supabase
    .from("app_users")
    .select("*")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();
  if (appUserError) {
    throw new SupabaseServerError(appUserError.message, 500);
  }
  return { authUser: data.user, appUser };
}

export async function requireRole(accessToken, roles) {
  const { authUser, appUser } = await getAuthContext(accessToken);
  if (!authUser || !appUser || !roles.includes(appUser.role)) {
    throw new SupabaseServerError("Access denied.", 403);
  }
  return { authUser, appUser };
}

export function requireRazorpayEnv() {
  return {
    keyId: requireEnv("RAZORPAY_KEY_ID"),
    keySecret: requireEnv("RAZORPAY_KEY_SECRET"),
  };
}

export { SupabaseServerError };
