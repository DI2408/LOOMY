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
import { LumiHeader } from "@/components/lumi-header";
import { useLumi } from "@/components/providers/lumi-provider";

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
  const { stores } = useLumi();
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen text-slate-900">
      <LumiHeader />

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/20 bg-[#0c0a09] p-6 shadow-[0_25px_80px_rgba(10,14,26,0.45)] md:p-10">
          <div className="pointer-events-none absolute inset-0 opacity-90">
            <div className="mesh-float absolute -left-10 -top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,#5b3b98_0%,transparent_70%)] blur-3xl" />
            <div className="mesh-float absolute right-0 top-16 h-80 w-80 rounded-full bg-[radial-gradient(circle,#1d3c7f_0%,transparent_70%)] blur-3xl [animation-delay:1.4s]" />
            <div className="mesh-float absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,#c58f2a_0%,transparent_70%)] blur-3xl [animation-delay:2.4s]" />
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          <div className="pointer-events-none absolute left-1/2 top-8 h-28 w-72 -translate-x-1/2 rounded-full bg-amber-300/20 blur-3xl" />

          <div className="relative grid gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <p className="text-xs uppercase tracking-[0.28em] text-[#f4c57a]">
                LOOMY · Atelier delivery
              </p>
              <div className="relative">
                <p className="pointer-events-none absolute -top-6 left-0 font-loomy text-5xl font-semibold tracking-tight text-white/[0.07] md:-top-10 md:text-[5.5rem]">
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
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-200/92 md:text-lg">
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
              <div className="mt-6 flex flex-wrap gap-3">
                <Button type="button" onClick={() => router.push("/shopping")}>
                  Start shopping
                </Button>
                <Button
                  variant="secondary"
                  className="border border-white/40 bg-white/10 text-white backdrop-blur-2xl"
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

            <div className="relative min-h-[320px] md:min-h-[420px]">
              <LoomyHeroStudioCard />
              <div className="pointer-events-none absolute -bottom-4 left-1/2 h-12 w-4/5 -translate-x-1/2 rounded-full bg-black/50 blur-2xl" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3 md:col-span-2">
              {[
                {
                  label: "Gns. levering",
                  value: "36 min",
                  tone: "from-[#f7d08f]/95 to-[#f7e0b8]/95",
                },
                {
                  label: "Butikker i byen",
                  value: `${stores.length}+`,
                  tone: "from-[#8eb0ff]/95 to-[#b7ccff]/95",
                },
                {
                  label: "Live lagersync",
                  value: "Realtime",
                  tone: "from-[#8de8ca]/95 to-[#c2f8e6]/95",
                },
              ].map((item) => (
                <TiltCard key={item.label}>
                  <div
                    className={`rounded-2xl border border-white/35 bg-gradient-to-br ${item.tone} p-4 shadow-[0_16px_36px_rgba(15,23,42,0.25)] backdrop-blur-2xl`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                      {item.label}
                    </p>
                    <p className="mt-1 text-2xl font-black text-slate-900">{item.value}</p>
                  </div>
                </TiltCard>
              ))}
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
