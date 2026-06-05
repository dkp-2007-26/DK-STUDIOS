import { useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import type { Page } from "../hooks/useRouter";
import { useAuth } from "../context/AuthContext";
import { BRAND_LOGO_SRC, BRAND_NAME } from "../lib/brand";

interface ResetPasswordPageProps {
  navigate: (page: Page) => void;
}

export default function ResetPasswordPage({ navigate }: ResetPasswordPageProps) {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const { error: updateError } = await updatePassword(password);
    if (updateError) {
      setError(updateError.message || "Could not update password. Open the reset link again.");
    } else {
      setSuccess("Password updated. You can sign in with the new password now.");
      window.setTimeout(() => navigate("home"), 1600);
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070a0f] px-4 py-16 text-white">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#101820] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-8">
        <img src={BRAND_LOGO_SRC} alt={BRAND_NAME} className="mx-auto h-16 w-auto object-contain" />
        <div className="mt-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[#f1c75b]/10 text-[#f7d880]">
            <KeyRound size={26} />
          </div>
          <h1 className="mt-4 text-3xl font-black">Set new password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Enter a new password for your Supabase auth account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-slate-200">
            New password
            <span className="relative">
              <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPass ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="New password"
                className="w-full rounded-lg border border-white/10 bg-white/[0.06] py-3 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]"
              />
              <button
                type="button"
                aria-label={showPass ? "Hide password" : "Show password"}
                onClick={() => setShowPass((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>

          {error && <div className="rounded-lg border border-red-700/30 bg-red-900/20 px-4 py-3 text-sm text-red-300">{error}</div>}
          {success && <div className="rounded-lg border border-emerald-700/30 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-300">{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f1c75b] px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-[#ffdc73] disabled:opacity-70"
          >
            {loading ? "Updating..." : "Update password"}
            {!loading && <KeyRound size={17} />}
          </button>
        </form>
      </div>
    </main>
  );
}
