import { ArrowRight, Cake, CheckCircle2, FileImage, Pencil, Printer, Sparkles, type LucideIcon } from "lucide-react";
import { type Page } from "../hooks/useRouter";
import { type Service } from "../types/database";
import { useAsyncData } from "../hooks/useAsyncData";
import { loadPublicSnapshot } from "../lib/studioApi";

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
  editing: "bg-rose-50 text-rose-700 border-rose-200",
  retouching: "bg-cyan-50 text-cyan-700 border-cyan-200",
  sketch: "bg-amber-50 text-amber-700 border-amber-200",
  design: "bg-emerald-50 text-emerald-700 border-emerald-200",
  print: "bg-violet-50 text-violet-700 border-violet-200",
};

const perks = [
  "Photo upload and order details in one flow",
  "Advance payment through DK BOOK Razorpay",
  "Digital delivery with print pickup option",
  "Order-id tracking after order creation",
];

export default function ServicesPage({ navigate }: ServicesPageProps) {
  const { data } = useAsyncData(loadPublicSnapshot, []);
  const services = ((data?.services ?? []) as Service[]).filter(
    (service) => service.category !== "custom",
  );

  return (
    <main className="min-h-screen bg-[#f7f2e8] pb-16 pt-28 text-stone-950">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-[#8a5b12]">Services</p>
            <h1 className="mt-3 text-5xl font-black leading-tight sm:text-6xl">
              Clear options for photo edits, posters, sketches, and prints.
            </h1>
          </div>
          <div>
            <p className="max-w-2xl text-base leading-8 text-stone-700">
              Choose the work you need, add personal instructions, upload your photos, and pay the advance securely.
            </p>
            <button
              type="button"
              onClick={() => navigate("order")}
              className="mt-6 inline-flex items-center gap-3 rounded-lg bg-stone-950 px-6 py-4 text-sm font-black text-white transition hover:bg-stone-800"
            >
              Place order
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((perk) => (
            <div key={perk} className="flex items-start gap-3 rounded-lg border border-stone-300 bg-white p-4">
              <CheckCircle2 size={18} className="mt-0.5 text-emerald-600" />
              <p className="text-sm font-semibold leading-6 text-stone-700">{perk}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {services.map((service) => {
            const Icon = categoryIcons[service.category] || Sparkles;
            const style = categoryStyles[service.category] || "bg-gold-50 text-gold-700 border-gold-200";
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => navigate("order")}
                className="group rounded-lg border border-stone-200 bg-white p-5 text-left shadow-[0_18px_50px_rgba(52,36,10,0.08)] transition hover:-translate-y-1 hover:border-stone-300"
              >
                <div className="flex gap-5">
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border ${style}`}>
                    <Icon size={25} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xl font-black text-stone-950">{service.name}</span>
                    <span className="mt-2 block text-sm leading-6 text-stone-600">{service.description}</span>
                    <span className="mt-5 flex flex-wrap items-center justify-between gap-4">
                      <span>
                        <span className="block text-2xl font-black text-stone-950">Rs. {service.base_price}</span>
                        {service.print_price > 0 && (
                          <span className="text-sm text-stone-500">Rs. {service.base_price + service.print_price} with print</span>
                        )}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-lg bg-stone-950 px-4 py-3 text-sm font-black text-white transition group-hover:bg-[#d29b21] group-hover:text-stone-950">
                        Order
                        <ArrowRight size={16} />
                      </span>
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
