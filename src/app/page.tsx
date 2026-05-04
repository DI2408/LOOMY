"use client";

import { motion } from "framer-motion";
import { Building2, Mail, Phone, Sparkles, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoomyHeroStudioCard } from "@/components/hero/loomy-hero-studio-card";
import { TiltCard } from "@/components/hero/tilt-card";
import { LoomyHeader } from "@/components/loomy-header";

const heroSlides = [
  {
    title: "Én elegant platform for kunde, butik og bud.",
    subtitle:
      "Fra køb til dør er hvert trin synligt og afstemt, så oplevelsen føles enkel og premium.",
  },
  {
    title: "Dine yndlingsbutikker — leveret på under en time.",
    subtitle:
      "Gennemse kuraterede kataloger fra København K med levering samme dag og live tracking.",
  },
  {
    title: "Live lager pr. størrelse før du betaler.",
    subtitle:
      "Se præcis hvor mange stykker der er tilbage i hver størrelse og sikr dit fit med det samme.",
  },
];

export default function Home() {
  const router = useRouter();
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen text-slate-900">
      <LoomyHeader />

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#121212] p-6 shadow-[0_32px_90px_rgba(0,0,0,0.35)] md:rounded-[2.25rem] md:p-10 lg:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(197,160,89,0.16),transparent_50%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_20%,rgba(70,80,120,0.12),transparent_45%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          <div className="relative grid gap-10 md:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] md:gap-12 md:items-start">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#c5a059]">
                LOOMY · ATELIER DELIVERY
              </p>
              <div className="relative min-h-[4.5rem] md:min-h-[6rem]">
                <p className="pointer-events-none absolute -top-2 left-0 font-loomy text-[clamp(3.5rem,12vw,6rem)] font-semibold leading-none tracking-tight text-white/[0.09]">
                  LOOMY
                </p>
              </div>
              <motion.div
                key={`slide-${slideIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <h1 className="relative z-10 max-w-3xl font-loomy text-3xl font-semibold leading-[1.15] text-white md:text-5xl lg:text-[3.25rem]">
                  {heroSlides[slideIndex].title}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">
                  {heroSlides[slideIndex].subtitle}
                </p>
              </motion.div>
              <div className="mt-2 flex gap-2">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.title}
                    type="button"
                    onClick={() => setSlideIndex(index)}
                    className={`h-2.5 rounded-full transition ${
                      slideIndex === index ? "w-8 bg-white" : "w-2.5 bg-white/35"
                    }`}
                    aria-label={`Gå til slide ${index + 1}`}
                  />
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="gold"
                  className="rounded-full"
                  onClick={() => router.push("/shopping")}
                >
                  Start shopping
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-full border border-white/35 bg-transparent text-white backdrop-blur-md hover:bg-white/10"
                  onClick={() =>
                    document.getElementById("about")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }
                >
                  Læs mere
                </Button>
              </div>
            </motion.div>

            <div className="relative min-h-[360px] md:min-h-[460px]">
              <LoomyHeroStudioCard />
              <div className="pointer-events-none absolute -bottom-3 left-1/2 h-14 w-[85%] -translate-x-1/2 rounded-full bg-black/40 blur-3xl" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: <Sparkles size={18} className="text-[#d97745]" />,
              title: "Curated Fashion",
              text: "Handpicked styles from premium boutiques in Copenhagen K.",
            },
            {
              icon: <Truck size={18} className="text-[#d97745]" />,
              title: "Fast Delivery",
              text: "Reliable courier handoff and delivery updates in real time.",
            },
            {
              icon: <Building2 size={18} className="text-[#d97745]" />,
              title: "Local First",
              text: "Built around Indre By with neighborhood-level store coverage.",
            },
          ].map((item) => (
            <TiltCard key={item.title}>
              <Card className="h-full border border-slate-200 bg-white text-slate-900 shadow-sm">
                <div className="mb-2">{item.icon}</div>
                <h3 className="text-base font-bold">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.text}</p>
              </Card>
            </TiltCard>
          ))}
        </section>
        <section id="about" className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">Om os</h2>
          <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm">
            <p className="text-sm leading-6 text-slate-600">
              LOOMY er bygget til hurtig modelevering i Kobenhavn K. Vi samler lokale
              butikker, realtime lagerstatus og courier-flow i en samlet platform.
            </p>
            <div className="mt-4">
              <Link
                href="/about"
                className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Laes mere om os
              </Link>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Vi bygger en ny standard for bekvem shopping, hvor kvalitet og hurtig
              levering gaar haand i haand.
            </p>
          </Card>
        </section>

        <section id="feedback" className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">Feedback</h2>
          <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm">
            <p className="text-sm leading-6 text-slate-600">
              Har du forslag til bedre oplevelse? Del meget gerne feedback via shopping-siden.
            </p>
            <div className="mt-4">
              <a
                href="/feedback"
                className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Gå til feedback
              </a>
            </div>
          </Card>
        </section>

        <section id="contact" className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">Kontakt</h2>
          <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Mail size={16} className="text-[#d97745]" />
                  Email
                </div>
                <a
                  href="mailto:hello@loomy.dk"
                  className="text-sm text-slate-700 underline decoration-slate-300 underline-offset-4"
                >
                  hello@loomy.dk
                </a>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Phone size={16} className="text-[#d97745]" />
                  Telefon
                </div>
                <a
                  href="tel:+4531258090"
                  className="text-sm text-slate-700 underline decoration-slate-300 underline-offset-4"
                >
                  +45 31 25 80 90
                </a>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Building2 size={16} className="text-[#d97745]" />
                  Adresse
                </div>
                <p className="text-sm text-slate-700">
                  LOOMY ApS
                  <br />
                  Nørregade 12, 2. sal
                  <br />
                  1165 København K
                </p>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
