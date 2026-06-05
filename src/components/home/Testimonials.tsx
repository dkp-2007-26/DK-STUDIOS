import { Sparkles } from "lucide-react";

export default function Testimonials() {
  return (
    <section className="bg-[#0b0f14] py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] px-6 py-14 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-[#f1c75b]/30 bg-[#f1c75b]/10 text-[#f7d880]">
            <Sparkles size={28} />
          </div>
          <p className="mt-6 text-sm font-black uppercase text-[#f7d880]">Spotlight from customers</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            Waiting for your appreciations.....
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">
            The first featured messages will appear here after customers share their finished DK STUDIOS experience.
          </p>
        </div>
      </div>
    </section>
  );
}
