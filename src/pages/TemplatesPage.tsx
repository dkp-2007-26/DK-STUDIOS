import { useMemo, useState } from "react";
import { ArrowRight, Cake, FileImage, Heart, type LucideIcon } from "lucide-react";
import { type Page } from "../hooks/useRouter";
import { type Template } from "../types/database";
import { useAsyncData } from "../hooks/useAsyncData";
import { loadPublicSnapshot } from "../lib/studioApi";
import { VISTAPRINT_LOGO_URL } from "../lib/serviceCatalog";

interface TemplatesPageProps {
  navigate: (page: Page) => void;
}

const categoryIcons: Record<string, LucideIcon> = {
  Birthday: Cake,
  Anniversary: Heart,
  Wedding: Heart,
  Poster: FileImage,
};

const tagStyles: Record<string, string> = {
  "Most Popular": "bg-[#f1c75b] text-stone-950",
  New: "bg-emerald-500 text-white",
  Premium: "bg-indigo-500 text-white",
  Bestseller: "bg-rose-500 text-white",
  Vistaprint: "bg-white text-slate-950",
};

const EMPTY_TEMPLATES: Template[] = [];

export default function TemplatesPage({ navigate }: TemplatesPageProps) {
  const [active, setActive] = useState("All");
  const { data } = useAsyncData(loadPublicSnapshot, []);
  const templates = data?.templates ?? EMPTY_TEMPLATES;
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(templates.map((template) => template.category)))],
    [templates],
  );
  const filtered = active === "All" ? templates : templates.filter((template) => template.category === active);

  return (
    <main className="min-h-screen bg-[#070a0f] pb-16 pt-28 text-white">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-[#f1c75b]">Templates</p>
            <h1 className="mt-3 text-5xl font-black leading-tight sm:text-6xl">
              Ready-made design bases for faster custom orders.
            </h1>
          </div>
          <div>
            <p className="max-w-2xl text-base leading-8 text-slate-300">
              Select a Vistaprint-sourced template, add names, dates, messages, and photos during checkout. For made-from-idea artwork, choose Custom Sketch in services.
            </p>
            <button
              type="button"
              onClick={() => navigate("order")}
              className="mt-6 inline-flex items-center gap-3 rounded-lg bg-[#f1c75b] px-6 py-4 text-sm font-black text-[#090b10] transition hover:bg-white"
            >
              Start order
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="mt-9 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                active === category
                  ? "bg-[#f1c75b] text-[#090b10]"
                  : "border border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/25"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => {
            const Icon = categoryIcons[template.category] || FileImage;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => navigate("order")}
                className="group overflow-hidden rounded-lg border border-white/10 bg-[#101820] text-left shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition hover:-translate-y-1 hover:border-[#f1c75b]/45"
              >
                <span className="relative block aspect-[4/3] overflow-hidden bg-[#0b1118] p-3">
                  <img src={template.image_url} alt={template.name} className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]" />
                  {template.tag && (
                    <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-black ${tagStyles[template.tag] ?? "bg-white text-slate-900"}`}>
                      {template.tag}
                    </span>
                  )}
                </span>
                <span className="block p-5">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-[#f1c75b]">
                    <Icon size={16} />
                    {template.category}
                  </span>
                  <span className="mt-3 block text-lg font-black text-white">{template.name}</span>
                  <span className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                    {template.description || "Use this design as a base for your order."}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wide text-stone-500">Powered by</span>
                    <img src={VISTAPRINT_LOGO_URL} alt="VistaPrint" className="h-4 w-auto" loading="lazy" />
                  </span>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#f1c75b]">
                    Use template
                    <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
