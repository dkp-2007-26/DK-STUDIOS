import { ArrowRight, Cake, Camera, FileImage, Pencil, Printer, Sparkles, type LucideIcon } from "lucide-react";
import { type NavigateTo } from "../../hooks/useRouter";
import { type Service } from "../../types/database";
import { useAsyncData } from "../../hooks/useAsyncData";
import { loadPublicSnapshot } from "../../lib/studioApi";
import { VISTAPRINT_LOGO_URL, displayServicePrice, isVistaprintService } from "../../lib/serviceCatalog";

interface ServicesProps {
  navigate: NavigateTo;
}

const categoryIcons: Record<string, LucideIcon> = {
  editing: Cake,
  retouching: Sparkles,
  sketch: Pencil,
  design: FileImage,
  print: Printer,
};

const categoryStyles: Record<string, string> = {
  editing: "border-rose-200 bg-rose-50 text-rose-700",
  retouching: "border-cyan-200 bg-cyan-50 text-cyan-700",
  sketch: "border-amber-200 bg-amber-50 text-amber-700",
  design: "border-emerald-200 bg-emerald-50 text-emerald-700",
  print: "border-violet-200 bg-violet-50 text-violet-700",
};

export default function Services({ navigate }: ServicesProps) {
  const { data } = useAsyncData(loadPublicSnapshot, []);
  const services = ((data?.services ?? []) as Service[]).filter(
    (service) => service.category !== "custom",
  );

  return (
    <section id="services" className="bg-[#070a0f] py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.82fr,1.18fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-[#f1c75b]">Studio menu</p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              Pick what you need. We'll keep it simple.
            </h2>
          </div>
          <div className="lg:max-w-xl lg:justify-self-end">
            <p className="text-base leading-8 text-slate-300">
              Choose photo retouching, a colour or black and white digital sketch, a custom sketch from your idea, poster work, or a printed product. Upload what you have, book the order, and keep your order id handy.
            </p>
            <button
              type="button"
              onClick={() => navigate("services")}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:border-[#f1c75b]/70 hover:bg-white/15"
            >
              See all services
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.slice(0, 8).map((service) => {
            const Icon = categoryIcons[service.category] || Camera;
            const style = categoryStyles[service.category] || "border-gold-200 bg-gold-50 text-gold-700";
            const isVistaprint = isVistaprintService(service);
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => navigate("order", { search: `service=${encodeURIComponent(service.id)}` })}
                className="group flex min-h-[310px] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#101820] text-left shadow-[0_26px_70px_rgba(0,0,0,0.28)] transition hover:-translate-y-1 hover:border-[#f1c75b]/60"
              >
                {service.image_url && (
                  <span className="block aspect-[4/3] overflow-hidden bg-[#0b1118] p-3">
                    <img src={service.image_url} alt="" className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]" loading="lazy" />
                  </span>
                )}
                <span className="flex flex-1 flex-col p-5">
                  <span className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg border ${style}`}>
                    <Icon size={21} />
                  </span>
                  <span className="text-lg font-black text-white">{service.name}</span>
                  <span className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{service.description}</span>
                  {isVistaprint && (
                    <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg border border-sky-300/20 bg-sky-400/10 px-3 py-2">
                      <span className="text-[10px] font-black uppercase tracking-wide text-slate-300">Powered by</span>
                      <img src={VISTAPRINT_LOGO_URL} alt="VistaPrint" className="h-4 w-auto" loading="lazy" />
                    </span>
                  )}
                  <span className="mt-auto flex items-end justify-between pt-5">
                    <span>
                      <span className="block text-xl font-black text-[#f7d880]">{displayServicePrice(service)}</span>
                      {service.print_price > 0 && (
                        <span className="text-xs font-medium text-slate-400">print add-on available</span>
                      )}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1c75b] text-stone-950 transition group-hover:bg-[#ffdc73]">
                      <ArrowRight size={16} />
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {["Retouching", "Digital sketch", "Custom sketch", "Poster design", "Vistaprint products"].map((item) => (
            <span key={item} className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-slate-300">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
