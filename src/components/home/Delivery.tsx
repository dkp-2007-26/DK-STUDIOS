import { Clock, MapPin, Navigation, PackageCheck, Truck } from "lucide-react";

const MAPS_SHARE_URL = "https://maps.app.goo.gl/XAKPGVv8osrGY2bB8";
const MAPS_EMBED_URL = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.0!2d88.3833211!3d22.9219652!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f893c4ff20a6b3%3A0xfc01db22ece31179!2sDK%20BOOK!5e0!3m2!1sen!2sin!4v1713000000000!5m2!1sen!2sin";

const deliveryNotes = [
  { icon: PackageCheck, title: "Digital files", body: "Final files are shared after approval and payment verification." },
  { icon: MapPin, title: "Printed orders", body: "Printed copies are collected at DK BOOK Store." },
  { icon: Truck, title: "Home delivery", body: "Planned for a later release after pickup flow is stable." },
];

export default function Delivery() {
  return (
    <section id="delivery" className="bg-[#efe6d4] py-20 text-stone-950 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr,1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase text-[#8a5b12]">Pickup and delivery</p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              Digital delivery first, print pickup through DK BOOK.
            </h2>
            <p className="mt-5 text-base leading-8 text-stone-700">
              The current delivery model keeps the handoff simple: online proofing and file delivery, with in-store pickup for printed work.
            </p>

            <div className="mt-8 grid gap-3">
              <div className="rounded-lg border border-stone-300 bg-white p-5">
                <div className="flex items-start gap-4">
                  <Clock size={21} className="mt-1 text-[#8a5b12]" />
                  <div>
                    <p className="font-black">Store hours</p>
                    <p className="mt-2 text-sm leading-6 text-stone-600">Monday - Saturday: 9:00 AM - 8:00 PM</p>
                    <p className="text-sm leading-6 text-stone-600">Sunday: 10:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>
              {deliveryNotes.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-lg border border-stone-300 bg-white p-5">
                  <div className="flex items-start gap-4">
                    <Icon size={21} className="mt-1 text-[#8a5b12]" />
                    <div>
                      <p className="font-black">{title}</p>
                      <p className="mt-2 text-sm leading-6 text-stone-600">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <a
              href={MAPS_SHARE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-3 rounded-lg bg-stone-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-stone-800"
            >
              <Navigation size={18} />
              Get directions
            </a>
          </div>

          <div className="overflow-hidden rounded-lg border border-stone-300 bg-white shadow-[0_24px_70px_rgba(68,48,18,0.15)]">
            <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-4">
              <div>
                <p className="text-sm font-black">DK BOOK Store</p>
                <p className="text-sm text-stone-600">Pickup counter for printed orders</p>
              </div>
              <MapPin size={20} className="text-[#8a5b12]" />
            </div>
            <div className="relative min-h-[360px]">
              <iframe
                src={MAPS_EMBED_URL}
                className="absolute inset-0 h-full w-full"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="DK BOOK Store pickup location"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
