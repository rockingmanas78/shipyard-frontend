// src/components/Header.jsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const [solid, setSolid] = useState(false);
  const { pathname } = useLocation();
  const isLanding = pathname === "/";

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-4 inset-x-0 z-50 pointer-events-none">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pointer-events-auto">
        <header
          className={[
            "flex h-14 items-center justify-between rounded-2xl border px-4 sm:px-6",
            "backdrop-blur transition-all",
            solid
              ? "bg-white/80 border-slate-200 shadow-md"
              : "bg-white/55 border-slate-200/70 shadow"
          ].join(" ")}
        >
          {/* Brand (clickable to home) */}
          <Link to="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-900 text-white grid place-items-center text-xs font-bold">iS</div>
            <span className="text-sm sm:text-base font-semibold tracking-tight">iShip Inspection AI</span>
          </Link>

          {/* Middle menu ONLY on landing */}
          {isLanding ? (
            <nav className="hidden md:flex items-center gap-8 text-sm text-slate-700">
              <a href="#features" className="hover:text-slate-900">Features</a>
              <a href="#how" className="hover:text-slate-900">How it works</a>
              <a href="#faq" className="hover:text-slate-900">FAQ</a>
            </nav>
          ) : (
            <div className="hidden md:block" /> // keeps spacing balanced
          )}

          {/* Right actions shown everywhere */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* On non-landing pages, make the first button a Home link */}
            {isLanding ? (
              <Link
                to="/upload"
                className="px-3 sm:px-4 py-2 rounded-xl border border-slate-300 hover:border-slate-400 text-sm"
              >
                Try demo
              </Link>
            ) : (
              <Link
                to="/"
                className="px-3 sm:px-4 py-2 rounded-xl border border-slate-300 hover:border-slate-400 text-sm"
              >
                Home
              </Link>
            )}
            <Link
              to="/upload"
              className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-sm"
            >
              Start
            </Link>
          </div>
        </header>
      </div>
    </div>
  );
}