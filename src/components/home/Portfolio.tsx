import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { type Page } from "../../hooks/useRouter";
import { portfolioCategories, portfolioItems } from "../../lib/showcase";

interface PortfolioProps {
  navigate: (page: Page) => void;
}

export default function Portfolio({ navigate }: PortfolioProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered = activeCategory === "All"
    ? portfolioItems.slice(0, 9)
    : portfolioItems.filter((item) => item.category === activeCategory).slice(0, 9);

  const lightboxIndex = lightbox !== null ? filtered.findIndex((item) => item.id === lightbox) : -1;
  const lightboxItem = lightboxIndex >= 0 ? filtered[lightboxIndex] : null;

  return (
    <section id="spotlight" className="bg-[#101820] py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase text-[#89d4d2]">Spotlight</p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              Featured work from portraits, sketches, and print-ready designs.
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

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
          {portfolioCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                activeCategory === category
                  ? "bg-[#f1c75b] text-[#15110a]"
                  : "border border-white/15 text-slate-300 hover:border-white/35 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-8 grid auto-rows-[170px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightbox(item.id)}
              className={`group relative overflow-hidden rounded-lg bg-slate-900 text-left ${
                item.aspect === "tall" ? "sm:row-span-2" : item.aspect === "wide" ? "sm:col-span-2" : ""
              }`}
            >
              <img src={item.img} alt={item.title} className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-[1.03]" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/18 to-transparent opacity-90" />
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-stone-950">
                {item.category}
              </span>
              <span className="absolute bottom-4 left-4 right-4">
                <span className="block text-base font-black text-white">{item.title}</span>
                <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#f7d880]">
                  Preview <ZoomIn size={15} />
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {lightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={() => setLightbox(null)}>
          <button
            type="button"
            aria-label="Close preview"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            <X size={20} />
          </button>
          {lightboxIndex > 0 && (
            <button
              type="button"
              aria-label="Previous preview"
              className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
              onClick={(event) => {
                event.stopPropagation();
                setLightbox(filtered[lightboxIndex - 1].id);
              }}
            >
              <ChevronLeft size={21} />
            </button>
          )}
          {lightboxIndex < filtered.length - 1 && (
            <button
              type="button"
              aria-label="Next preview"
              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
              onClick={(event) => {
                event.stopPropagation();
                setLightbox(filtered[lightboxIndex + 1].id);
              }}
            >
              <ChevronRight size={21} />
            </button>
          )}
          <div className="max-h-[86vh] max-w-5xl overflow-hidden rounded-lg bg-[#101820]" onClick={(event) => event.stopPropagation()}>
            <img src={lightboxItem.img} alt={lightboxItem.title} className="max-h-[74vh] w-full object-contain" />
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="font-bold text-white">{lightboxItem.title}</p>
                <p className="text-sm text-[#f7d880]">{lightboxItem.category}</p>
              </div>
              <span className="text-sm text-slate-400">{lightboxIndex + 1} / {filtered.length}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
