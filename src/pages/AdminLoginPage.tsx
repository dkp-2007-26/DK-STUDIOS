import { useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { type Page } from "../hooks/useRouter";
import { markAdminAccessVerified } from "../lib/adminAccess";
import { BRAND_LOGO_SRC, BRAND_NAME, PARENT_BRAND_LABEL } from "../lib/brand";

interface AdminLoginProps {
  navigate: (page: Page) => void;
}

export default function AdminLoginPage({ navigate }: AdminLoginProps) {
  const { signIn, signOut } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInErr, user } = await signIn(form.email, form.password);
    if (signInErr) {
      setError(signInErr.message || "Unable to sign in right now.");
      setLoading(false);
      return;
    }

    if (!user?.isAdmin) {
      await signOut();
      setError("Access denied. Admin only.");
      setLoading(false);
      return;
    }

    markAdminAccessVerified(user.id);
    navigate("admin-dashboard");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#eef2f6] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr,1.1fr]">
        <section className="hidden bg-[#101820] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <button
            type="button"
            onClick={() => navigate("home")}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
          >
            <ArrowLeft size={16} />
            Website
          </button>

          <div>
            <img src={BRAND_LOGO_SRC} alt={BRAND_NAME} className="h-28 w-auto max-w-full object-contain" />
            <p className="mt-8 text-sm font-bold uppercase text-[#f7d880]">{PARENT_BRAND_LABEL}</p>
            <h1 className="mt-3 max-w-xl text-5xl font-black leading-tight">
              {BRAND_NAME} admin control room.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-slate-300">
              Manage orders, payment states, promotions, customer reviews, and revenue signals from one protected workspace.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            {["Orders", "Payments", "Reviews"].map((item) => (
              <div key={item} className="rounded-lg border border-white/12 bg-white/8 p-4">
                <p className="font-black text-white">{item}</p>
                <p className="mt-1 text-xs text-slate-400">Protected</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <button
              type="button"
              onClick={() => navigate("home")}
              className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-500 lg:hidden"
            >
              <ArrowLeft size={16} />
              Website
            </button>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-8">
              <div className="mb-7">
                <div className="flex h-13 w-13 items-center justify-center rounded-lg bg-slate-950 text-[#f7d880]">
                  <ShieldCheck size={30} />
                </div>
                <p className="mt-5 text-sm font-bold uppercase text-[#8a5b12]">Secure admin</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">Sign in to continue</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use an authorized admin account for {BRAND_NAME}.
                </p>
              </div>

              <form onSubmit={handleLogin} className="grid gap-4">
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Email
                  <span className="relative">
                    <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      placeholder="admin@example.com"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                    />
                  </span>
                </label>

                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Password
                  <span className="relative">
                    <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      placeholder="Admin password"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-12 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                    />
                    <button
                      type="button"
                      aria-label={showPass ? "Hide password" : "Show password"}
                      onClick={() => setShowPass((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900"
                    >
                      {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </span>
                </label>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex items-center justify-center gap-3 rounded-lg bg-[#f1c75b] px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-[#ffdc73] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Checking access..." : "Open admin panel"}
                  {!loading && <ShieldCheck size={18} />}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
