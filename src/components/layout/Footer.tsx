import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { FOOTER_QUICK_LINKS, type Page } from "../../app/router";
import { BRAND_LOGO_SRC, BRAND_NAME, PARENT_BRAND_LABEL, SUPPORT_EMAIL, SUPPORT_WHATSAPP_URL } from "../../lib/brand";

interface FooterProps {
  navigate: (page: Page) => void;
}

const services = [
  "Birthday photo edits",
  "Anniversary artwork",
  "Pencil and color sketch",
  "Poster design",
  "A4 print pickup",
];

export default function Footer({ navigate }: FooterProps) {
  return (
    <footer className="bg-[#070a0f] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr,0.75fr,0.75fr,1fr]">
          <div>
            <button type="button" onClick={() => navigate("home")} className="flex items-center gap-3 text-left">
              <img src={BRAND_LOGO_SRC} alt={BRAND_NAME} className="h-20 w-auto object-contain" />
            </button>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              Photo editing, design, templates, and printed keepsakes with secure checkout and in-store pickup support.
            </p>
            <button
              type="button"
              onClick={() => navigate("order")}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#f1c75b] px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-[#ffdc73]"
            >
              Place order
              <ArrowRight size={16} />
            </button>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase text-white">Explore</h3>
            <ul className="mt-5 grid gap-3">
              {FOOTER_QUICK_LINKS.map((item) => (
                <li key={item.page}>
                  <button
                    type="button"
                    onClick={() => navigate(item.page)}
                    className="text-sm font-semibold text-slate-400 transition hover:text-[#f7d880]"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase text-white">Services</h3>
            <ul className="mt-5 grid gap-3">
              {services.map((service) => (
                <li key={service}>
                  <button
                    type="button"
                    onClick={() => navigate("services")}
                    className="text-left text-sm font-semibold text-slate-400 transition hover:text-[#f7d880]"
                  >
                    {service}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase text-white">Contact</h3>
            <div className="mt-5 grid gap-4 text-sm text-slate-400">
              <span className="flex items-start gap-3">
                <MapPin size={17} className="mt-1 text-[#f7d880]" />
                DK BOOK Store, pickup available in-store
              </span>
              <a href="tel:+918961338986" className="flex items-center gap-3 transition hover:text-[#f7d880]">
                <Phone size={17} className="text-[#f7d880]" />
                +91 89613 38986
              </a>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-3 transition hover:text-[#f7d880]">
                <Mail size={17} className="text-[#f7d880]" />
                {SUPPORT_EMAIL}
              </a>
              <a
                href={SUPPORT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 font-bold text-emerald-100 transition hover:bg-emerald-400/15"
              >
                <MessageCircle size={16} />
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {BRAND_NAME}. {PARENT_BRAND_LABEL}.</p>
          <p>Google Drive uploads. DK STUDIOS Razorpay checkout.</p>
        </div>
      </div>
    </footer>
  );
}
