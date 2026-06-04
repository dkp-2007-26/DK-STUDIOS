import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { type Page } from "../hooks/useRouter";
import { portfolioCategories, portfolioItems } from "../lib/showcase";

interface PortfolioPageProps {
  navigate: (page: Page) => void;
}

export default function PortfolioPage({ navigate }: PortfolioPageProps) {
  const [active, setActive] = useState("All");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered = active === "All" ? portfolioItems : portfolioItems.filter((item) => item.category === active);
  const lightboxIndex = lightbox !== null ? filtered.findIndex((item) => item.id === lightbox) : -1;
  const lightboxItem = lightboxIndex >= 0 ? filtered[lightboxIndex] : null;

  return (
    <main className="min-h-screen bg-[#101820] pb-16 pt-28 text-white">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-[#89d4d2]">Portfolio</p>
            <h1 className="mt-3 text-5xl font-black leading-tight sm:text-6xl">
              Work samples across events, portraits, posters, and sketches.
            </h1>
          </div>
          <div>
            <p className="max-w-2xl text-base leading-8 text-slate-300">
              Browse the current gallery, preview full images, and start an order when you find the direction you like.
            </p>
            <button
              type="button"
              onClick={() => navigate("order")}
              className="mt-6 inline-flex items-center gap-3 rounded-lg bg-[#f1c75b] px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-[#ffdc73]"
            >
              Create yours
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="mt-9 flex gap-2 overflow-x-auto pb-2">
          {portfolioCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                active === category
                  ? "bg-white text-slate-950"
                  : "border border-white/15 text-slate-300 hover:border-white/35 hover:text-white"
              }`}
            >
              {category} {category === "All" ? `(${portfolioItems.length})` : `(${portfolioItems.filter((item) => item.category === category).length})`}
            </button>
          ))}
        </div>

        <div className="mt-8 grid auto-rows-[190px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightbox(item.id)}
              className={`group relative overflow-hidden rounded-lg bg-slate-900 text-left ${
                item.aspect === "tall" ? "sm:row-span-2" : item.aspect === "wide" ? "sm:col-span-2" : ""
              }`}
            >
              <img src={item.img} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/84 via-black/18 to-transparent opacity-90" />
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-950">
                {item.category}
              </span>
              <span className="absolute bottom-4 left-4 right-4">
                <span className="block text-lg font-black text-white">{item.title}</span>
                <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#f7d880]">
                  Preview <ZoomIn size={15} />
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {lightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={() => setLightbox(null)}>
          <button type="button" aria-label="Close preview" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-white" onClick={() => setLightbox(null)}>
            <X size={20} />
          </button>
          {lightboxIndex > 0 && (
            <button
              type="button"
              aria-label="Previous preview"
              className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg bg-white/10 text-white"
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
              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg bg-white/10 text-white"
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
    </main>
  );
}
