import { ArrowRight, Sparkles } from "lucide-react";
import { type Page } from "../../hooks/useRouter";

interface PortfolioProps {
  navigate: (page: Page) => void;
}

export default function Portfolio({ navigate }: PortfolioProps) {
  return (
    <section id="spotlight" className="bg-[#101820] py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase text-[#89d4d2]">Spotlight</p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              Customer features are being prepared with a sharper standard.
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("spotlight")}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10"
          >
            Open spotlight
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="mt-10 overflow-hidden rounded-lg border border-white/10 bg-[#070a0f] shadow-[0_28px_90px_rgba(0,0,0,0.32)]">
          <div className="relative min-h-[360px] px-6 py-12 sm:px-10 lg:px-14">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(241,199,91,0.14),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_38%)]" />
            <div className="relative grid min-h-[260px] items-center gap-8 lg:grid-cols-[0.85fr,1.15fr]">
              <div>
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-[#f1c75b]/25 bg-[#f1c75b]/10 text-[#f1c75b]">
                  <Sparkles size={25} />
                </span>
                <p className="mt-6 text-sm font-black uppercase text-[#f1c75b]">Yet to come</p>
                <h3 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
                  The Spotlight wall opens soon.
                </h3>
              </div>
              <p className="max-w-2xl text-base leading-8 text-slate-300">
                We are keeping this space reserved for selected customer-approved work only. Once the first designs are reviewed and approved, they will appear here with a clean premium presentation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
