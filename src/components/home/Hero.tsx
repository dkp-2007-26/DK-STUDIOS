import { ArrowRight, CreditCard, ImagePlus, PackageCheck, ShieldCheck } from "lucide-react";
import { type Page } from "../../hooks/useRouter";
import { BRAND_LOGO_SRC, BRAND_NAME, PARENT_BRAND_LABEL, PAYMENT_PROVIDER_NAME } from "../../lib/brand";
import { heroShowcaseImage } from "../../lib/showcase";

interface HeroProps {
  navigate: (page: Page) => void;
}

const proofPoints = [
  { icon: ImagePlus, label: "Upload design", value: "Final files accepted" },
  { icon: CreditCard, label: "Advance payment", value: PAYMENT_PROVIDER_NAME },
  { icon: PackageCheck, label: "Print delivery", value: "Vistaprint powered" },
];

export default function Hero({ navigate }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#0b0f14] text-white">
      <div className="absolute inset-0">
        <img
          src={heroShowcaseImage}
          alt=""
          className="h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,12,18,0.96)_0%,rgba(8,12,18,0.82)_42%,rgba(8,12,18,0.34)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,18,0.4)_0%,rgba(8,12,18,0.88)_100%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-28 sm:px-6 lg:px-8 lg:pt-32">
        <div className="max-w-3xl py-10 sm:py-14 lg:py-20">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase text-[#f7d880] backdrop-blur">
            <ShieldCheck size={15} />
            Studio orders powered by {PARENT_BRAND_LABEL}
          </div>

          <img src={BRAND_LOGO_SRC} alt={BRAND_NAME} className="mb-6 h-24 w-auto max-w-full object-contain sm:h-28" />

          <p className="text-sm font-semibold uppercase text-[#f7d880]">
            {PARENT_BRAND_LABEL}
          </p>
          <h1 className="mt-3 max-w-3xl text-5xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">
            {BRAND_NAME}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            Retouching, digital sketches, poster design, and Vistaprint-powered printed products in one clean order flow with secure uploads and DK STUDIOS checkout support.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("order")}
              className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#f1c75b] px-6 py-4 text-sm font-bold text-[#17120a] shadow-[0_16px_40px_rgba(0,0,0,0.28)] transition hover:bg-[#ffdc73] active:scale-[0.98]"
            >
              Start an Order
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => navigate("spotlight")}
              className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white/10 px-6 py-4 text-sm font-bold text-white backdrop-blur transition hover:border-white/45 hover:bg-white/15 active:scale-[0.98]"
            >
              View Spotlight
            </button>
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-3">
          {proofPoints.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-lg border border-white/12 bg-white/10 p-4 backdrop-blur">
              <Icon size={20} className="text-[#f7d880]" />
              <p className="mt-4 text-sm font-semibold text-white">{label}</p>
              <p className="mt-1 text-sm text-slate-300">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
