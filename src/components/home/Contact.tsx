import { type FormEvent, useState } from "react";
import { CheckCircle, ExternalLink, Mail, MapPin, MessageCircle, Navigation, Phone, Send } from "lucide-react";
import { BRAND_NAME, SUPPORT_EMAIL, SUPPORT_WHATSAPP_URL } from "../../lib/brand";

const MAPS_SHARE_URL = "https://maps.app.goo.gl/XAKPGVv8osrGY2bB8";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 800));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <section id="contact" className="bg-[#101820] py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr,1.15fr]">
          <div>
            <p className="text-sm font-bold uppercase text-[#89d4d2]">Contact</p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              Tell us what you're trying to make.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              Send a note, open WhatsApp, or call us. If you're ready to order, checkout will collect your files and payment details properly.
            </p>

            <div className="mt-8 grid gap-3">
              <a href="tel:+918961338986" className="flex items-center gap-4 rounded-lg border border-white/12 bg-white/8 p-5 transition hover:border-white/30">
                <Phone size={20} className="text-[#f7d880]" />
                <span>
                  <span className="block text-sm text-slate-400">Phone</span>
                  <span className="font-bold text-white">+91 89613 38986</span>
                </span>
              </a>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-4 rounded-lg border border-white/12 bg-white/8 p-5 transition hover:border-white/30">
                <Mail size={20} className="text-[#f7d880]" />
                <span>
                  <span className="block text-sm text-slate-400">Email</span>
                  <span className="font-bold text-white">{SUPPORT_EMAIL}</span>
                </span>
              </a>
              <a
                href={SUPPORT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-5 transition hover:bg-emerald-400/15"
              >
                <MessageCircle size={20} className="text-emerald-300" />
                <span>
                  <span className="block text-sm text-emerald-100/70">WhatsApp</span>
                  <span className="font-bold text-emerald-100">Chat with DK STUDIOS</span>
                </span>
              </a>
              <div className="rounded-lg border border-white/12 bg-white/8 p-5">
                <div className="flex items-start gap-4">
                  <MapPin size={20} className="mt-1 text-[#f7d880]" />
                  <div>
                    <p className="font-bold text-white">DK STUDIOS Pickup Point</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">Pickup available in-store for printed orders.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a href={MAPS_SHARE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-950">
                        <ExternalLink size={14} />
                        Maps
                      </a>
                      <a href="https://www.google.com/maps/dir/?api=1&destination=22.9219652,88.385896" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white">
                        <Navigation size={14} />
                        Directions
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex rounded-lg border border-white/12 bg-[#070a0f] p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-7">
            {submitted ? (
              <div className="flex min-h-[420px] flex-1 flex-col items-center justify-center text-center">
                <CheckCircle size={46} className="text-emerald-500" />
                <h3 className="mt-5 text-2xl font-black">Message received</h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
                  Thanks for contacting {BRAND_NAME}. We'll reply with the next step.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-6 rounded-lg bg-[#f1c75b] px-5 py-3 text-sm font-bold text-slate-950"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
                <div className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-black uppercase text-[#f7d880]">Message form</p>
                  <h3 className="mt-2 text-2xl font-black text-white">Tell us what you need.</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Share your idea, print requirement, or order question. We'll reply with the next step.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-slate-200">
                    Name :
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-200">
                    Phone :
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) => setForm({ ...form, phone: event.target.value })}
                      className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]"
                      placeholder="+91"
                    />
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-bold text-slate-200">
                  Email :
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]"
                    placeholder="you@example.com"
                  />
                </label>
                <label className="flex min-h-[180px] flex-1 flex-col gap-2 text-sm font-bold text-slate-200">
                  Message :
                  <textarea
                    required
                    rows={8}
                    value={form.message}
                    onChange={(event) => setForm({ ...form, message: event.target.value })}
                    className="min-h-[180px] flex-1 resize-none rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f1c75b]"
                    placeholder="Tell us what you need"
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-auto inline-flex shrink-0 items-center justify-center gap-3 rounded-lg bg-[#f1c75b] px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-[#ffdc73] disabled:opacity-70"
                >
                  {loading ? "Sending..." : "Send message"}
                  {!loading && <Send size={17} />}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
