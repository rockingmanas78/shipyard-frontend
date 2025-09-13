// src/pages/Landing.jsx
import Header from "../components/header";
import { useRef } from "react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-800">
      <Header />
      <Hero />
      <CTA />
      <FAQ />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Ship inspections, <br></br><span className="bg-blue-200 px-2 rounded">10× faster</span> with AI
            </h1>
            <p className="mt-5 text-slate-600 text-base md:text-lg leading-relaxed">
              Drag & drop photos from your walk-through. iShip AI detects hazards like fire risk, trip/fall,
              and corrosion — then generates a polished DOCX report you can share.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/upload" className="px-5 py-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-medium">
                Analyze my photos
              </a>
              <a href="#features" className="px-5 py-3 rounded-2xl border border-slate-300 hover:border-slate-400 font-medium">
                See features
              </a>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              JPEG, PNG, HEIC • Up to 20 photos per run • In Beta Testing
            </p>
          </div>

          {/* Right image with 3D tilt + shimmer */}
          <div>
            <Tilt3D max={3} scale={1.005} glareOpacity={0.1}>
              <div className="aspect-video rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden relative">
                <img src="/hero-sample.jpg" alt="iShip AI preview" className="h-full w-full object-cover" />
                <div className="hero-shimmer pointer-events-none" />
              </div>
            </Tilt3D>
            <div className="relative">
              <div className="absolute -bottom-4 -right-4 bg-white shadow-lg ring-1 ring-slate-200 rounded-xl px-4 py-2 text-sm">
                <span className="font-semibold">Auto-report</span> • DOCX export
              </div>
            </div>
          </div>
        </div>

        <LogosStrip />
      </div>
    </section>
  );
}

function Tilt3D({ children, max = 3, glare = true, scale = 1.005, glareOpacity = 0.1 }) {
  const innerRef = useRef(null);
  const glareRef = useRef(null);

  const handleMove = (e) => {
    const el = innerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;   // 0..1
    const py = (e.clientY - rect.top) / rect.height;   // 0..1
    const rx = (py - 0.5) * -2 * max; // rotateX
    const ry = (px - 0.5) * 2 * max;  // rotateY
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`;
    if (glare && glareRef.current) {
      const gx = px * 100;
      const gy = py * 100;
      glareRef.current.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,${glareOpacity}), rgba(255,255,255,0) 60%)`;
      glareRef.current.style.opacity = 1;
    }
  };

  const handleLeave = () => {
    const el = innerRef.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
    if (glareRef.current) glareRef.current.style.opacity = 0;
  };

  return (
    <div className="tilt-3d" onMouseMove={handleMove} onMouseLeave={handleLeave}>
      <div ref={innerRef} className="tilt-inner">
        {children}
        {glare && <div ref={glareRef} className="tilt-glare pointer-events-none" />}
      </div>
    </div>
  );
}

function LogosStrip() {
  return (
    <div className="mt-12 border-t border-slate-200 pt-6">
      <p className="text-xs uppercase tracking-wider text-slate-500 text-center">
        Built for marine operations teams
      </p>
      <div className="mt-4 flex justify-center gap-10 opacity-70">
        <div className="text-sm">Port Ops</div>
        <div className="text-sm">HSE</div>
        <div className="text-sm">Class</div>
        <div className="text-sm">Owners</div>
      </div>
    </div>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
      <div className="rounded-3xl bg-slate-900 text-white p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold">Run your first inspection in minutes</h3>
            <p className="mt-2 text-slate-300">No setup. Just add photos and export a DOCX report.</p>
          </div>
          <div className="flex md:justify-end items-center gap-3">
            <a href="/upload" className="px-5 py-3 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-medium">Analyze photos</a>
            <a href="#faq" className="px-5 py-3 rounded-2xl border border-white/30 hover:bg-white/10 font-medium">Questions?</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const qs = [
    { q: "What image formats do you support?", a: "JPEG, PNG and HEIC. You can also upload .docx/.pptx/.xlsx and we extract the images inside." },
    { q: "How many photos at once?", a: "Up to 100 per run. Large sets are processed safely in batches." },
    { q: "Can I edit findings before export?", a: "Yes — adjust severity, comments and recommended actions on the Summary page." },
    { q: "What does the report look like?", a: "A DOCX with cover, batch summary, per-image gallery and a defects table. Branding is customizable." },
  ];
  return (
    <section id="faq" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
      <h3 className="text-2xl font-bold text-slate-900">FAQ</h3>
      <div className="mt-6 grid md:grid-cols-2 gap-4 md:gap-6">
        {qs.map((x, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="font-semibold">{x.q}</div>
            <p className="mt-2 text-sm text-slate-600">{x.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-16 md:mt-24 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-900 text-white grid place-items-center text-xs font-bold">iS</div>
          <span className="text-sm text-slate-500">© {new Date().getFullYear()} iShip AI</span>
        </div>
        <div className="text-sm text-slate-600 flex items-center gap-6">
          <a href="#features" className="hover:text-slate-900">Features</a>
          <a href="#how" className="hover:text-slate-900">How it works</a>
          <a href="#faq" className="hover:text-slate-900">FAQ</a>
          <a href="/upload" className="hover:text-slate-900">Start</a>
        </div>
      </div>
    </footer>
  );
}