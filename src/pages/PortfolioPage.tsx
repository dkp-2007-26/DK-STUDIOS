import { useState } from "react";
import { ArrowRight, CheckCircle2, Send, Sparkles } from "lucide-react";
import { type NavigateTo } from "../hooks/useRouter";

interface PortfolioPageProps {
  navigate: NavigateTo;
}

export default function PortfolioPage({ navigate }: PortfolioPageProps) {
  const [featuredForm, setFeaturedForm] = useState({ name: "", email: "", designTitle: "", orderId: "", note: "" });
  const [featuredSubmitted, setFeaturedSubmitted] = useState(false);

  return (
    <main className="min-h-screen bg-[#101820] pb-16 pt-28 text-white">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-[#89d4d2]">Spotlight</p>
            <h1 className="mt-3 text-5xl font-black leading-tight sm:text-6xl">
              The real-work wall is coming.
            </h1>
          </div>
          <div>
            <p className="max-w-2xl text-base leading-8 text-slate-300">
              We're saving this page for customer-approved designs only. Better a quiet page than a fake one.
            </p>
            <button
              type="button"
              onClick={() => navigate("services")}
              className="mt-6 inline-flex items-center gap-3 rounded-lg bg-[#f1c75b] px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-[#ffdc73]"
            >
              Create yours
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-lg border border-white/10 bg-[#070a0f] shadow-[0_28px_90px_rgba(0,0,0,0.32)]">
          <div className="relative min-h-[420px] px-6 py-14 sm:px-10 lg:px-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(241,199,91,0.16),transparent_31%),radial-gradient(circle_at_78%_70%,rgba(137,212,210,0.1),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%)]" />
            <div className="relative flex min-h-[300px] flex-col justify-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-lg border border-[#f1c75b]/25 bg-[#f1c75b]/10 text-[#f1c75b]">
                <Sparkles size={29} />
              </span>
              <p className="mt-7 text-sm font-black uppercase text-[#f1c75b]">Yet to come</p>
              <h2 className="mt-3 max-w-4xl text-5xl font-black leading-tight text-white sm:text-6xl">
                The DK STUDIOS Spotlight opens after the first approved pieces.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
                No placeholder gallery here. This space stays for real customer work, shown only with permission.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:grid-cols-[0.8fr,1.2fr] lg:p-7">
          <div>
            <p className="text-sm font-bold uppercase text-[#f1c75b]">Get featured</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-white">
              Loved your final design?
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Share your details and, if it fits the page, we'll ask before putting your design on the DK STUDIOS website.
            </p>
          </div>

          {featuredSubmitted ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-6 text-center">
              <CheckCircle2 size={42} className="text-emerald-300" />
              <h3 className="mt-4 text-2xl font-black text-white">Submission received</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-emerald-100/80">
                We'll review the design and contact you before anything goes public.
              </p>
              <button
                type="button"
                onClick={() => setFeaturedSubmitted(false)}
                className="mt-5 rounded-lg border border-white/15 px-5 py-3 text-sm font-black text-white transition hover:border-[#f1c75b]"
              >
                Submit another
              </button>
            </div>
          ) : (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                setFeaturedSubmitted(true);
              }}
            >
              <input
                required
                value={featuredForm.name}
                onChange={(event) => setFeaturedForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Your name"
                className="rounded-lg border border-white/10 bg-[#141c26] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]"
              />
              <input
                required
                type="email"
                value={featuredForm.email}
                onChange={(event) => setFeaturedForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email address"
                className="rounded-lg border border-white/10 bg-[#141c26] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]"
              />
              <input
                required
                value={featuredForm.designTitle}
                onChange={(event) => setFeaturedForm((current) => ({ ...current, designTitle: event.target.value }))}
                placeholder="Design title"
                className="rounded-lg border border-white/10 bg-[#141c26] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]"
              />
              <input
                value={featuredForm.orderId}
                onChange={(event) => setFeaturedForm((current) => ({ ...current, orderId: event.target.value }))}
                placeholder="Order ID (optional)"
                className="rounded-lg border border-white/10 bg-[#141c26] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]"
              />
              <textarea
                required
                rows={5}
                value={featuredForm.note}
                onChange={(event) => setFeaturedForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Tell us what you liked about the design"
                className="resize-none rounded-lg border border-white/10 bg-[#141c26] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b] sm:col-span-2"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#f1c75b] px-6 py-4 text-sm font-black text-[#090b10] transition hover:bg-white sm:col-span-2"
              >
                Submit for spotlight
                <Send size={17} />
              </button>
            </form>
          )}
        </div>
      </section>

    </main>
  );
}
