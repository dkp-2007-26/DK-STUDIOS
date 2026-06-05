import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Menu, ShoppingBag, User, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { PRIMARY_NAV_LINKS, type NavigateTo, type Page } from "../../app/router";
import { BRAND_LOGO_SRC, BRAND_NAME } from "../../lib/brand";

interface NavbarProps {
  currentPage: Page;
  navigate: NavigateTo;
  onOpenAuth: (mode: "login" | "forgot") => void;
}

export default function Navbar({ currentPage, navigate, onOpenAuth }: NavbarProps) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  void onOpenAuth;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (page: Page) => {
    navigate(page);
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <nav className={`fixed left-0 right-0 top-0 z-50 transition ${
      scrolled ? "bg-[#0b0f14]/92 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl" : "bg-[#0b0f14]/42 backdrop-blur-sm"
    }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <button type="button" onClick={() => handleNav("home")} className="flex min-w-0 items-center gap-3 text-left">
            <img src={BRAND_LOGO_SRC} alt={BRAND_NAME} className="h-12 w-auto object-contain sm:h-14" />
          </button>

          <div className="hidden items-center gap-1 rounded-full border border-white/12 bg-white/8 p-1 md:flex">
            {PRIMARY_NAV_LINKS.map((link) => (
              <button
                key={link.page}
                type="button"
                onClick={() => handleNav(link.page)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  currentPage === link.page
                    ? "bg-white text-slate-950"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className="inline-flex max-w-[180px] items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-4 py-3 text-sm font-bold text-white transition hover:border-white/30"
                >
                  <User size={16} />
                  <span className="truncate">{user.email?.split("@")[0]}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-14 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-950 shadow-[0_22px_70px_rgba(0,0,0,0.25)]">
                    <button
                      type="button"
                      onClick={() => handleNav("dashboard")}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold transition hover:bg-slate-100"
                    >
                      <LayoutDashboard size={16} />
                      Track Orders
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav("services")}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold transition hover:bg-slate-100"
                    >
                      <ShoppingBag size={16} />
                      Choose Product
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 border-t border-slate-200 px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleNav("dashboard")}
                  className="rounded-lg px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Track Order
                </button>
                <button
                  type="button"
                  onClick={() => handleNav("services")}
                  className="rounded-lg bg-[#f1c75b] px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-[#ffdc73]"
                >
                  Start Order
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/8 text-white md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/12 bg-[#0b0f14] px-4 py-4 md:hidden">
          <div className="grid gap-2">
            {PRIMARY_NAV_LINKS.map((link) => (
              <button
                key={link.page}
                type="button"
                onClick={() => handleNav(link.page)}
                className={`rounded-lg px-4 py-3 text-left text-sm font-bold transition ${
                  currentPage === link.page ? "bg-white text-slate-950" : "text-slate-200 hover:bg-white/10"
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleNav("services")}
              className="rounded-lg bg-[#f1c75b] px-4 py-3 text-left text-sm font-black text-slate-950"
            >
              Choose Product
            </button>
            {user ? (
              <>
                <button type="button" onClick={() => handleNav("dashboard")} className="rounded-lg px-4 py-3 text-left text-sm font-bold text-slate-200 hover:bg-white/10">
                  Track Orders
                </button>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setMenuOpen(false);
                  }}
                  className="rounded-lg px-4 py-3 text-left text-sm font-bold text-red-300 hover:bg-red-500/10"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button type="button" onClick={() => handleNav("dashboard")} className="rounded-lg border border-white/15 px-4 py-3 text-sm font-bold text-white">
                  Track Order
                </button>
                <button type="button" onClick={() => handleNav("services")} className="rounded-lg bg-white px-4 py-3 text-sm font-black text-slate-950">
                  Start Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
