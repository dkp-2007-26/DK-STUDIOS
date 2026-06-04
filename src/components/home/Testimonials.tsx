import { useEffect, useState } from "react";
import { Quote, Star } from "lucide-react";
import { useAsyncData } from "../../hooks/useAsyncData";
import { loadPublicSnapshot } from "../../lib/studioApi";

type Testimonial = {
  id: string;
  name: string;
  location: string | null;
  message: string;
  rating: number;
};

const avatarStyles = [
  "bg-rose-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-emerald-500",
];

export default function Testimonials() {
  const { data } = useAsyncData(loadPublicSnapshot, []);
  const testimonials = (data?.testimonials ?? []) as Testimonial[];
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (testimonials.length === 0) return;
    const interval = window.setInterval(() => {
      setActive((current) => (current + 1) % testimonials.length);
    }, 5500);
    return () => window.clearInterval(interval);
  }, [testimonials.length]);

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#0b0f14] py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr,1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase text-[#f7d880]">Customer notes</p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              Orders built for real people and real occasions.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              The studio flow keeps customers informed from upload to payment to delivery.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {testimonials.map((testimonial, index) => (
              <button
                key={testimonial.id}
                type="button"
                onClick={() => setActive(index)}
                className={`rounded-lg border p-5 text-left transition ${
                  active === index
                    ? "border-[#f1c75b] bg-white text-slate-950"
                    : "border-white/12 bg-white/6 text-white hover:border-white/30"
                }`}
              >
                <span className="flex items-start justify-between gap-4">
                  <span className="flex items-center gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-lg text-base font-black text-white ${avatarStyles[index % avatarStyles.length]}`}>
                      {testimonial.name.charAt(0)}
                    </span>
                    <span>
                      <span className="block font-black">{testimonial.name}</span>
                      <span className={`text-sm ${active === index ? "text-slate-500" : "text-slate-400"}`}>
                        {testimonial.location || "Verified customer"}
                      </span>
                    </span>
                  </span>
                  <Quote size={22} className={active === index ? "text-[#d29b21]" : "text-[#f7d880]"} />
                </span>
                <span className="mt-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, starIndex) => (
                    <Star key={starIndex} size={14} className="fill-[#f1c75b] text-[#f1c75b]" />
                  ))}
                </span>
                <span className={`mt-4 block text-sm leading-6 ${active === index ? "text-slate-700" : "text-slate-300"}`}>
                  "{testimonial.message}"
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
