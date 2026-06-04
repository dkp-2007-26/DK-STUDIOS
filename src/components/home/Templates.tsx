import { useMemo, useState } from "react";
import { ArrowRight, Cake, FileImage, Heart, type LucideIcon } from "lucide-react";
import { type Page } from "../../hooks/useRouter";
import { type Template } from "../../types/database";
import { useAsyncData } from "../../hooks/useAsyncData";
import { loadPublicSnapshot } from "../../lib/studioApi";

interface TemplatesProps {
  navigate: (page: Page) => void;
}

const categoryIcons: Record<string, LucideIcon> = {
  Birthday: Cake,
  Anniversary: Heart,
  Poster: FileImage,
};

const tagStyles: Record<string, string> = {
  "Most Popular": "bg-[#f1c75b] text-stone-950",
  New: "bg-emerald-500 text-white",
  Premium: "bg-indigo-500 text-white",
  Bestseller: "bg-rose-500 text-white",
};

const EMPTY_TEMPLATES: Template[] = [];

export default function Templates({ navigate }: TemplatesProps) {
  const [active, setActive] = useState("All");
  const { data } = useAsyncData(loadPublicSnapshot, []);
  const templates = data?.templates ?? EMPTY_TEMPLATES;
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(templates.map((template) => template.category)))],
    [templates],
  );
  const filtered = active === "All"
    ? templates.slice(0, 6)
    : templates.filter((template) => template.category === active).slice(0, 6);

  return (
    <section id="templates" className="bg-[#f8fafc] py-20 text-slate-950 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-indigo-700">Template studio</p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              Pick a layout, then make it personal.
            </h2>
          </div>
          <div>
            <p className="max-w-2xl text-base leading-8 text-slate-600">
              Templates are starting points for faster delivery. You can still add custom names, dates, wishes, and print instructions during checkout.
            </p>
            <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActive(category)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                    active === category
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => {
            const Icon = categoryIcons[template.category] || FileImage;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => navigate("order")}
                className="group overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-slate-300"
              >
                <span className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
                  <img src={template.image_url} alt={template.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  {template.tag && (
                    <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-black ${tagStyles[template.tag] ?? "bg-white text-slate-900"}`}>
                      {template.tag}
                    </span>
                  )}
                </span>
                <span className="block p-5">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700">
                    <Icon size={16} />
                    {template.category}
                  </span>
                  <span className="mt-3 block text-lg font-black text-slate-950">{template.name}</span>
                  <span className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                    {template.description || "Use this design as a base for your order."}
                  </span>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-slate-950">
                    Use template
                    <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-9">
          <button
            type="button"
            onClick={() => navigate("templates")}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Browse all templates
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
