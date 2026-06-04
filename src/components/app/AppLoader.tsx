import { BRAND_NAME } from "../../lib/brand";

const spinnerTicks = Array.from({ length: 12 }, (_, index) => index);

export default function AppLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <div className="relative mx-auto mb-8 h-36 w-36">
          <div
            className="absolute inset-0 rounded-full border-4 border-gold-900/20 border-r-cyan-300/70 border-t-gold-300"
            style={{ animation: "spin 1.15s linear infinite" }}
          />
          <div
            className="absolute inset-4 rounded-full border border-gold-500/20 border-b-gold-200/70 border-l-cyan-300/60"
            style={{ animation: "spin 1.8s linear infinite reverse" }}
          />
          <div className="absolute inset-7 rounded-full border border-white/5 bg-black shadow-[inset_0_0_32px_rgba(212,175,55,0.16)]" />

          {spinnerTicks.map((tick) => (
            <span
              key={tick}
              className="absolute left-1/2 top-1/2 h-3 w-1 rounded-full bg-gold-300"
              style={{
                opacity: 0.22 + tick * 0.055,
                transform: `translate(-50%, -50%) rotate(${tick * 30}deg) translateY(-54px)`,
              }}
            />
          ))}

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-12 w-12">
              <div
                className="absolute inset-0 rounded-lg border border-gold-400/30"
                style={{ animation: "spin 2.4s linear infinite" }}
              />
              <div
                className="absolute inset-3 rounded-full bg-gold-300 shadow-[0_0_22px_rgba(241,199,91,0.65)]"
                style={{ animation: "pulse 1.4s ease-in-out infinite" }}
              />
            </div>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-center gap-3">
          <div className="h-px w-10" style={{ background: "linear-gradient(to right, transparent, rgba(212,175,55,0.5))" }} />
          <div className="flex gap-1.5">
            {[0, 1, 2].map(index => (
              <div
                key={index}
                className="h-1.5 w-1.5 rounded-full bg-gold-500"
                style={{
                  animation: "bounce 1.2s ease-in-out infinite",
                  animationDelay: `${index * 0.2}s`,
                }}
              />
            ))}
          </div>
          <div className="h-px w-10" style={{ background: "linear-gradient(to left, transparent, rgba(212,175,55,0.5))" }} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.38em] text-gray-600">{BRAND_NAME}</p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.32em] text-gold-500/70">Loading</p>
      </div>
    </div>
  );
}
