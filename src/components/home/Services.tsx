import { ArrowRight, Cake, Camera, FileImage, Pencil, Printer, Sparkles, type LucideIcon } from "lucide-react";
import { type Page } from "../../hooks/useRouter";
import { type Service } from "../../types/database";
import { useAsyncData } from "../../hooks/useAsyncData";
import { loadPublicSnapshot } from "../../lib/studioApi";
import { VISTAPRINT_LOGO_URL, displayServicePrice, isVistaprintService } from "../../lib/serviceCatalog";

interface ServicesProps {
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
    <section id="services" className="bg-[#f7f2e8] py-20 text-[#151515] sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.82fr,1.18fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-[#8a5b12]">Studio menu</p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              Design work people can order without confusion.
            </h2>
          </div>
          <div className="lg:max-w-xl lg:justify-self-end">
            <p className="text-base leading-8 text-stone-700">
              Pick a service, upload photos, pay the advance through DK STUDIOS Razorpay, and track the order with your order id.
            </p>
            <button
              type="button"
              onClick={() => navigate("services")}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-stone-900 transition hover:border-stone-500"
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
                onClick={() => navigate("order")}
                className="group flex min-h-[254px] flex-col overflow-hidden rounded-lg border border-stone-200 bg-white text-left shadow-[0_18px_50px_rgba(52,36,10,0.08)] transition hover:-translate-y-1 hover:border-stone-300"
              >
                {service.image_url && (
                  <span className="block aspect-[4/3] overflow-hidden bg-stone-100">
                    <img src={service.image_url} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
                  </span>
                )}
                <span className="flex flex-1 flex-col p-5">
                  <span className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg border ${style}`}>
                    <Icon size={21} />
                  </span>
                  <span className="text-lg font-black text-stone-950">{service.name}</span>
                  <span className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{service.description}</span>
                  {isVistaprint && (
                    <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                      <span className="text-[10px] font-black uppercase tracking-wide text-stone-500">Powered by</span>
                      <img src={VISTAPRINT_LOGO_URL} alt="VistaPrint" className="h-4 w-auto" loading="lazy" />
                    </span>
                  )}
                  <span className="mt-auto flex items-end justify-between pt-5">
                    <span>
                      <span className="block text-xl font-black text-stone-950">{displayServicePrice(service)}</span>
                      {service.print_price > 0 && (
                        <span className="text-xs font-medium text-stone-500">print add-on available</span>
                      )}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-950 text-white transition group-hover:bg-[#d29b21] group-hover:text-stone-950">
                      <ArrowRight size={16} />
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {["Birthday edits", "Sketches", "Poster design", "A4 printing", "Retouching"].map((item) => (
            <span key={item} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
