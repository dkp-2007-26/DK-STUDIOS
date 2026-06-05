import { ArrowRight, Cake, CheckCircle2, FileImage, Pencil, Printer, Sparkles, type LucideIcon } from "lucide-react";
import { type Page } from "../hooks/useRouter";
import { type Service } from "../types/database";
import { useAsyncData } from "../hooks/useAsyncData";
import { loadPublicSnapshot } from "../lib/studioApi";
import { VISTAPRINT_LOGO_URL, displayServicePrice, isVistaprintService } from "../lib/serviceCatalog";

interface ServicesPageProps {
  navigate: (page: Page) => void;
}

const categoryIcons: Record<string, LucideIcon> = {
  editing: Cake,
  retouching: Sparkles,
  sketch: Pencil,
  design: FileImage,
  print: Printer,
};

const categoryStyles: Record<string, string> = {
  editing: "border-rose-300/20 bg-rose-300/10 text-rose-100",
  retouching: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  sketch: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  design: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  print: "border-violet-300/20 bg-violet-300/10 text-violet-100",
};

const perks = [
  "Final design upload and order details in one flow",
  "Advance payment through DK STUDIOS Razorpay",
  "Digital services plus Vistaprint-powered print delivery",
  "Order-id tracking after order creation",
];

export default function ServicesPage({ navigate }: ServicesPageProps) {
  const { data } = useAsyncData(loadPublicSnapshot, []);
  const services = ((data?.services ?? []) as Service[]).filter(
    (service) => service.category !== "custom",
  );

  return (
    <main className="min-h-screen bg-[#070a0f] pb-16 pt-28 text-white">
      <section className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-[#f1c75b]">Services</p>
            <h1 className="mt-3 text-5xl font-black leading-tight sm:text-6xl">
              Premium creative services, finished with a sharper eye.
            </h1>
          </div>
          <div>
            <p className="max-w-2xl text-base leading-8 text-slate-300">
              Choose retouching, digital sketches, custom sketch work, photo frames, or Vistaprint-powered products with clear options and secure advance payment.
            </p>
            <button
              type="button"
              onClick={() => navigate("order")}
              className="mt-6 inline-flex items-center gap-3 rounded-lg bg-[#f1c75b] px-6 py-4 text-sm font-black text-[#090b10] transition hover:bg-white"
            >
              Place order
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((perk) => (
            <div key={perk} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <CheckCircle2 size={18} className="mt-0.5 text-[#f1c75b]" />
              <p className="text-sm font-semibold leading-6 text-slate-300">{perk}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 max-h-[82vh] overflow-y-auto pr-1 [scrollbar-color:#f1c75b_#101820] [scrollbar-width:thin]">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => {
            const Icon = categoryIcons[service.category] || Sparkles;
            const style = categoryStyles[service.category] || "border-[#f1c75b]/25 bg-[#f1c75b]/10 text-[#f1c75b]";
            const isVistaprint = isVistaprintService(service);
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => navigate("order")}
                className="group flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-[#101820] text-left shadow-[0_24px_80px_rgba(0,0,0,0.34)] transition duration-300 hover:-translate-y-1.5 hover:border-[#f1c75b]/60 hover:bg-[#131f2a] hover:shadow-[0_28px_90px_rgba(241,199,91,0.12)]"
              >
                {service.image_url && (
                  <span className="block aspect-square overflow-hidden bg-[#0b1118] p-4">
                    <img src={service.image_url} alt="" className="h-full w-full object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.28)] transition duration-500 group-hover:scale-[1.05]" loading="lazy" />
                  </span>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${style}`}>
                      <Icon size={21} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-lg font-black leading-snug text-white">{service.name}</span>
                      <span className="mt-1 block text-2xl font-black text-[#f1c75b]">{displayServicePrice(service)}</span>
                    </span>
                  </div>
                  <span className="mt-4 block flex-1 text-sm leading-6 text-slate-300">{service.description}</span>
                    {service.product_details.length > 0 && (
                      <span className="mt-4 flex flex-wrap gap-2">
                        {service.product_details.slice(0, 3).map((detail) => (
                          <span key={detail} className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-slate-300">{detail}</span>
                        ))}
                      </span>
                    )}
                    {isVistaprint && (
                      <span className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white px-3 py-2">
                        <span className="text-[10px] font-black uppercase tracking-wide text-stone-600">Powered by</span>
                        <img src={VISTAPRINT_LOGO_URL} alt="VistaPrint" className="h-4 w-auto" loading="lazy" />
                      </span>
                    )}
                    <span className="mt-5 flex items-center justify-between gap-3">
                      {service.print_price > 0 ? (
                        <span className="text-xs font-bold text-slate-400">Rs. {service.base_price + service.print_price} with print</span>
                      ) : (
                        <span className="text-xs font-bold uppercase text-slate-500">Details inside</span>
                      )}
                      <span className="inline-flex items-center gap-2 rounded-lg bg-[#f1c75b] px-4 py-3 text-sm font-black text-[#090b10] transition group-hover:bg-white group-hover:shadow-[0_12px_28px_rgba(255,255,255,0.14)]">
                        Order
                        <ArrowRight size={16} />
                      </span>
                    </span>
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </section>
    </main>
  );
}
