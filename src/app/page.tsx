"use client";

/**
 * LOOMY landing — indhold er synligt uden at vente på scroll/motion (pålidelig i remote + ældre browsere).
 * Accent og typografi følger Fashion Stylist / Luxe UI skills.
 */
import { motion, useReducedMotion } from "framer-motion";
import { Building2, Mail, Phone, Sparkles, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SplineScene } from "@/components/hero/spline-scene";
import { TiltCard } from "@/components/hero/tilt-card";
import { LumiHeader } from "@/components/lumi-header";
import { useLumi } from "@/components/providers/lumi-provider";
import { springSoft } from "@/components/motion-config";

const heroSlides = [
  {
    title: "Dine yndlingsbutikker — leveret mens dagen stadig føles ung.",
    subtitle:
      "Gennemse udvalgte brands fra København K og få levering med live tracking, når det passer dig.",
  },
  {
    title: "Én platform. Kunde, butik og bud i samme rolige flow.",
    subtitle:
      "Ordren finder selv vej til det rigtige hold, så du kan følge med uden at jagte beskeder.",
  },
  {
    title: "Live lager på størrelse — før du betaler.",
    subtitle:
      "Se præcis hvad der er tilbage i din størrelse, og sikr dig den rigtige pasform med det samme.",
  },
];

const SPLINE_SCENE_URL = "";

export default function Home() {
  const { stores } = useLumi();
  const [slideIndex, setSlideIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5200);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  return (
    <div className="min-h-screen overflow-x-hidden text-stone-900">
      <LumiHeader />

      <main className="mx-auto w-full max-w-7xl space-y-10 px-4 py-8 md:space-y-14 md:px-8 md:py-12">
        <section className="relative overflow-hidden rounded-3xl border-[0.5px] border-stone-700/40 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 p-8 shadow-[0_32px_80px_rgba(12,10,9,0.35)] md:p-12 lg:p-14">
          <div className="pointer-events-none absolute inset-0">
            <div className="mesh-float absolute -left-20 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.14)_0%,transparent_68%)] blur-3xl" />
            <div className="mesh-float absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(250,248,245,0.06)_0%,transparent_65%)] blur-3xl [animation-delay:1.8s]" />
            <div className="mesh-float absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(139,105,20,0.12)_0%,transparent_70%)] blur-2xl [animation-delay:2.6s]" />
          </div>
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/35 to-transparent" />

          <div className="relative grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
            <div className="space-y-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d4af37]/90">
                LOOMY · København K
              </p>
              <div className="relative">
                <p
                  className="pointer-events-none select-none font-serif text-6xl font-medium leading-none tracking-tight text-white/[0.06] sm:text-7xl md:text-8xl"
                  aria-hidden
                >
                  LOOMY
                </p>
              </div>
              <motion.div
                key={`slide-${slideIndex}`}
                initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0.92, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springSoft}
                className="relative z-10 space-y-4"
              >
                <h1 className="max-w-2xl font-serif text-3xl font-medium leading-[1.15] tracking-tight text-[#faf8f5] md:text-5xl md:leading-[1.12]">
                  {heroSlides[slideIndex].title}
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-stone-300/95 md:text-lg">
                  {heroSlides[slideIndex].subtitle}
                </p>
              </motion.div>
              <div className="flex gap-2 pt-1">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.title}
                    type="button"
                    onClick={() => setSlideIndex(index)}
                    className={`min-h-11 min-w-11 rounded-full p-2 transition ${slideIndex === index ? "px-4" : ""}`}
                    aria-label={`Slide ${index + 1}`}
                    aria-current={slideIndex === index}
                  >
                    <span
                      className={`block h-2 rounded-full transition-all ${
                        slideIndex === index
                          ? "w-8 bg-[#faf8f5]"
                          : "w-2 bg-white/30 hover:bg-white/45"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  className="bg-[#faf8f5] !text-stone-900 shadow-[0_12px_32px_rgba(0,0,0,0.2)] ring-0 hover:!bg-white"
                  onClick={() => {
                    window.location.href = "/shopping";
                  }}
                >
                  Gå til shop
                </Button>
                <Button
                  variant="secondary"
                  className="!border-white/25 !bg-white/10 !text-[#faf8f5] backdrop-blur-md"
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
            </div>

            <div className="relative hidden min-h-[320px] lg:block">
              <div className="absolute inset-0 rounded-3xl border-[0.5px] border-white/15 bg-white/[0.04] p-2 backdrop-blur-[28px]">
                <SplineScene sceneUrl={SPLINE_SCENE_URL} />
              </div>
              <div className="pointer-events-none absolute -bottom-8 left-1/2 h-12 w-2/3 -translate-x-1/2 rounded-full bg-black/40 blur-2xl" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-3">
              {[
                {
                  label: "Typisk levering",
                  value: "~36 min",
                  tone: "from-[#faf8f5]/95 to-stone-100/95",
                },
                {
                  label: "Butikker i centrum",
                  value: `${stores.length}+`,
                  tone: "from-stone-100/95 to-stone-50/95",
                },
                {
                  label: "Lager",
                  value: "Live",
                  tone: "from-amber-50/95 to-[#faf8f5]/95",
                },
              ].map((item) => (
                <div key={item.label} className="min-w-0">
                  <TiltCard>
                    <div
                      className={`rounded-2xl border-[0.5px] border-white/25 bg-gradient-to-br ${item.tone} p-5 shadow-[0_16px_40px_rgba(12,10,9,0.2)] backdrop-blur-md`}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                        {item.label}
                      </p>
                      <p className="mt-2 font-serif text-2xl font-medium text-stone-900">{item.value}</p>
                    </div>
                  </TiltCard>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3 md:gap-8">
          {[
            {
              icon: <Sparkles size={20} strokeWidth={1.5} className="text-[#8b6914]" />,
              title: "Kurateret mode",
              text: "Udvalgte styles fra butikker, der forstår kvalitet og sæson.",
            },
            {
              icon: <Truck size={20} strokeWidth={1.5} className="text-[#8b6914]" />,
              title: "Tryg levering",
              text: "Klare statusser fra butik til bud — uden gætteri.",
            },
            {
              icon: <Building2 size={20} strokeWidth={1.5} className="text-[#8b6914]" />,
              title: "Lokalt først",
              text: "Bygget omkring Indre By, så afstanden fra rail til dør er kort.",
            },
          ].map((item) => (
            <TiltCard key={item.title}>
              <motion.div
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="h-full"
              >
                <Card className="h-full border-[0.5px] border-stone-200/90 bg-white/90 p-6 text-stone-900 shadow-[0_12px_40px_rgba(28,25,23,0.06)] backdrop-blur-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#8b6914]/[0.08]">
                    {item.icon}
                  </div>
                  <h3 className="font-serif text-xl font-medium tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.text}</p>
                </Card>
              </motion.div>
            </TiltCard>
          ))}
        </section>

        <section id="about" className="space-y-5">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-stone-900 md:text-3xl">
            Om LOOMY
          </h2>
          <Card className="border-[0.5px] border-stone-200/90 bg-white/90 p-8 text-stone-900 shadow-sm backdrop-blur-sm md:p-10">
            <p className="text-sm leading-relaxed text-stone-600 md:text-base">
              LOOMY er lavet til hurtig modelevering i København K. Vi samler lokale
              butikker, realtime lager og bud i én rolig platform — så du kan handle med
              ro i maven.
            </p>
            <div className="mt-6">
              <Link
                href="/about"
                className="inline-flex min-h-11 items-center rounded-xl border-[0.5px] border-stone-300 bg-white px-5 text-sm font-medium text-stone-800 shadow-sm transition hover:border-stone-400 hover:bg-stone-50 active:scale-[0.98]"
              >
                Læs mere om os
              </Link>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-stone-600 md:text-base">
              Vi bygger en ny standard for bekvem shopping, hvor kvalitet og hurtig levering
              går hånd i hånd.
            </p>
          </Card>
        </section>

        <section id="feedback" className="space-y-5">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-stone-900 md:text-3xl">
            Din stemme
          </h2>
          <Card className="border-[0.5px] border-stone-200/90 bg-white/90 p-8 shadow-sm backdrop-blur-sm md:p-10">
            <p className="text-sm leading-relaxed text-stone-600 md:text-base">
              Har du idéer til en bedre oplevelse? Del meget gerne feedback — vi læser med.
            </p>
            <div className="mt-6">
              <Link
                href="/feedback"
                className="inline-flex min-h-11 items-center rounded-xl border-[0.5px] border-stone-900/15 bg-stone-900 px-5 text-sm font-medium text-[#faf8f5] shadow-md transition hover:bg-stone-800 active:scale-[0.98]"
              >
                Gå til feedback
              </Link>
            </div>
          </Card>
        </section>

        <section id="contact" className="space-y-5 pb-8">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-stone-900 md:text-3xl">
            Kontakt
          </h2>
          <Card className="border-[0.5px] border-stone-200/90 bg-white/90 p-8 shadow-sm backdrop-blur-sm md:p-10">
            <div className="grid gap-5 md:grid-cols-3 md:gap-6">
              <div className="rounded-2xl border-[0.5px] border-stone-200/80 bg-stone-50/80 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-800">
                  <Mail size={17} className="text-[#8b6914]" strokeWidth={1.75} />
                  E-mail
                </div>
                <a
                  href="mailto:hello@loomy.dk"
                  className="text-sm text-stone-700 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-900"
                >
                  hello@loomy.dk
                </a>
              </div>
              <div className="rounded-2xl border-[0.5px] border-stone-200/80 bg-stone-50/80 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-800">
                  <Phone size={17} className="text-[#8b6914]" strokeWidth={1.75} />
                  Telefon
                </div>
                <a
                  href="tel:+4531258090"
                  className="text-sm text-stone-700 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-900"
                >
                  +45 31 25 80 90
                </a>
              </div>
              <div className="rounded-2xl border-[0.5px] border-stone-200/80 bg-stone-50/80 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-800">
                  <Building2 size={17} className="text-[#8b6914]" strokeWidth={1.75} />
                  Adresse
                </div>
                <p className="text-sm leading-relaxed text-stone-700">
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
