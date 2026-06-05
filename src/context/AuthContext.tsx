import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isDelivery: boolean;
  role: "customer" | "admin" | "delivery";
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  sessionToken: string | null;
  loading: boolean;
  isAdmin: boolean;
  isDelivery: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; user: AuthUser | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function roleFromMetadata(metadata: Record<string, unknown> | null | undefined): AuthUser["role"] {
  const role = metadata?.role;
  return role === "admin" || role === "delivery" || role === "customer" ? role : "customer";
}

function toAuthUser(session: Session | null): AuthUser | null {
  const authUser = session?.user;
  if (!authUser?.email) return null;
  const role = roleFromMetadata(authUser.user_metadata);
  return {
    id: authUser.id,
    email: authUser.email,
    displayName:
      String(authUser.user_metadata?.display_name || authUser.user_metadata?.full_name || authUser.email.split("@")[0]),
    isAdmin: role === "admin",
    isDelivery: role === "delivery" || role === "admin",
    role,
  };
}

function toProfileAuthUser(session: Session | null, profile: { display_name: string | null; role: AuthUser["role"]; is_admin: boolean } | null): AuthUser | null {
  const baseUser = toAuthUser(session);
  if (!baseUser) return null;
  const role = profile?.role ?? baseUser.role;
  return {
    ...baseUser,
    displayName: profile?.display_name ?? baseUser.displayName,
    role,
    isAdmin: profile?.is_admin || role === "admin",
    isDelivery: role === "delivery" || role === "admin",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<{ display_name: string; role: AuthUser["role"]; is_admin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setLoading(false);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }
    supabase
      .from("app_users")
      .select("display_name, role, is_admin")
      .eq("auth_user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setProfile(data as { display_name: string; role: AuthUser["role"]; is_admin: boolean } | null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const user = useMemo(() => {
    const baseUser = toAuthUser(session);
    if (!baseUser) return null;
    const role = profile?.role ?? baseUser.role;
    return {
      ...baseUser,
      displayName: profile?.display_name ?? baseUser.displayName,
      role,
      isAdmin: profile?.is_admin || role === "admin",
      isDelivery: role === "delivery" || role === "admin",
    };
  }, [profile, session]);
  const sessionToken = session?.access_token ?? null;
  const isAdmin = !!user?.isAdmin;
  const isDelivery = !!user?.isDelivery;

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    let nextProfile: { display_name: string | null; role: AuthUser["role"]; is_admin: boolean } | null = null;
    if (data.session?.user?.id) {
      const { data: profileData } = await supabase
        .from("app_users")
        .select("display_name, role, is_admin")
        .eq("auth_user_id", data.session.user.id)
        .maybeSingle();
      nextProfile = profileData as typeof nextProfile;
      setProfile(nextProfile);
    }
    const nextUser = toProfileAuthUser(data.session ?? null, nextProfile);
    return { error: error ? new Error(error.message) : null, user: nextUser };
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, sessionToken, loading, isAdmin, isDelivery, signIn, sendPasswordReset, updatePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
