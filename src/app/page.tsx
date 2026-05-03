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
import { HeroVisualLuxe } from "@/components/hero/hero-visual-luxe";
import { TiltCard } from "@/components/hero/tilt-card";
import { LumiHeader } from "@/components/lumi-header";
import { useLumi } from "@/components/providers/lumi-provider";
import { springSoft } from "@/components/motion-config";

const heroSlides = [
  {
    title: "Modekurateret på minutter. Leveret i dag.",
    subtitle:
      "LOOMY samler byens mest eftertragtede butikker i ét roligt flow med live lager og hurtig levering.",
  },
  {
    title: "Én elegant platform for kunde, butik og bud.",
    subtitle:
      "Fra køb til dør er hvert trin synligt og afstemt, så oplevelsen føles enkel og premium.",
  },
  {
    title: "Se din størrelse live, før du går til betaling.",
    subtitle:
      "Undgå usikkerhed: se præcise størrelsesantal og lås dit look med det samme.",
  },
];

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
    <div className="flex min-h-screen flex-col overflow-x-hidden text-stone-900">
      <LumiHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-10 bg-[#f7f5f2] px-4 py-8 md:space-y-14 md:px-8 md:py-12">
        <section className="relative overflow-hidden rounded-[2rem] border border-stone-900/25 bg-[radial-gradient(ellipse_120%_100%_at_50%_0%,#2a2621_0%,#0c0a09_55%,#151311_100%)] p-8 shadow-[0_40px_100px_rgba(12,10,9,0.38)] md:p-12 lg:min-h-[min(520px,85vh)] lg:p-14">
          <div className="pointer-events-none absolute inset-0">
            <div className="mesh-float absolute -left-20 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(197,160,89,0.18)_0%,transparent_68%)] blur-3xl" />
            <div className="mesh-float absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06)_0%,transparent_65%)] blur-3xl [animation-delay:1.8s]" />
            <div className="mesh-float absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(197,160,89,0.12)_0%,transparent_70%)] blur-2xl [animation-delay:2.6s]" />
          </div>
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#c5a059]/50 to-transparent" />

          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:gap-12">
            <div className="flex min-h-0 flex-col justify-between space-y-8">
              <div className="space-y-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#c5a059]">
                  LOOMY · Atelier Delivery
                </p>
                <div className="relative -mt-2">
                  <p
                    className="pointer-events-none select-none font-serif text-6xl font-medium leading-none tracking-tight text-white/[0.07] sm:text-7xl md:text-8xl"
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
                  <h1 className="max-w-2xl font-serif text-3xl font-medium leading-[1.12] tracking-tight text-[#faf8f5] md:text-5xl md:leading-[1.08] lg:text-[2.75rem]">
                    {heroSlides[slideIndex].title}
                  </h1>
                  <p className="max-w-xl text-base leading-relaxed text-stone-400 md:text-lg">
                    {heroSlides[slideIndex].subtitle}
                  </p>
                </motion.div>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex gap-2">
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
                            : "w-2 bg-white/25 hover:bg-white/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="hidden h-px flex-1 min-w-[3rem] bg-gradient-to-r from-white/15 to-transparent sm:block" aria-hidden />
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                  <Button
                    variant="secondary"
                    className="!border-[#c5a059]/35 !bg-[#1a1816]/80 !text-[#faf8f5] backdrop-blur-md hover:!border-[#c5a059]/55 hover:!bg-[#252220]"
                    onClick={() => {
                      window.location.href = "/shopping";
                    }}
                  >
                    Udforsk shop
                  </Button>
                  <Button
                    variant="secondary"
                    className="!border-white/20 !bg-white/[0.07] !text-[#faf8f5] backdrop-blur-md hover:!border-white/30 hover:!bg-white/10"
                    onClick={() =>
                      document.getElementById("about")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      })
                    }
                  >
                    Historien bag
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative flex min-h-[320px] flex-col lg:min-h-0">
              <div className="flex flex-1 flex-col rounded-[1.65rem] border border-white/[0.12] bg-[#232019]/95 p-1 shadow-[0_24px_60px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.06)] ring-1 ring-inset ring-black/40 backdrop-blur-md">
                <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-[1.45rem] lg:min-h-[360px]">
                  <HeroVisualLuxe />
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-6 left-1/2 h-10 w-4/5 -translate-x-1/2 rounded-full bg-black/50 blur-2xl" />
            </div>
          </div>
        </section>

        <section aria-label="Nøgletal" className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-2 -top-3 h-px bg-gradient-to-r from-transparent via-[#c5a059]/35 to-transparent"
          />
          <div className="relative rounded-[1.65rem] border border-stone-200/90 bg-white/80 p-1.5 shadow-[0_16px_48px_rgba(28,25,23,0.06)] ring-1 ring-stone-900/[0.04] backdrop-blur-sm md:p-2">
            <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
              {[
                {
                  label: "Leveringsvindue",
                  value: "~36 min",
                  tone: "from-[#faf8f5]/98 to-stone-100/95",
                  accent: "from-[#c5a059]/90 to-[#8b6914]/75",
                },
                {
                  label: "Aktive boutiques",
                  value: `${stores.length}+`,
                  tone: "from-stone-50/98 to-[#faf8f5]/92",
                  accent: "from-stone-400/80 to-stone-600/70",
                },
                {
                  label: "Lager",
                  value: "Live",
                  tone: "from-amber-50/98 to-[#faf8f5]/95",
                  accent: "from-amber-400/85 to-[#8b6914]/70",
                },
              ].map((item) => (
                <div key={item.label} className="min-w-0">
                  <TiltCard>
                    <div
                      className={`group relative overflow-hidden rounded-[1.125rem] border border-white/50 bg-gradient-to-br ${item.tone} px-4 py-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.65),0_10px_28px_rgba(0,0,0,0.12)] ring-1 ring-inset ring-stone-900/[0.05] backdrop-blur-[8px] md:px-5 md:py-[1.125rem]`}
                    >
                      <div
                        className={`pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b ${item.accent} opacity-90`}
                        aria-hidden
                      />
                      <div
                        className="pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full bg-white/25 blur-2xl opacity-60 transition-opacity duration-500 group-hover:opacity-90"
                        aria-hidden
                      />
                      <p className="pl-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-600">
                        {item.label}
                      </p>
                      <p className="mt-2 pl-2 font-serif text-2xl font-semibold tabular-nums tracking-tight text-stone-950 md:text-[1.65rem]">
                        {item.value}
                      </p>
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
              title: "Kuraterede drops",
              text: "Kuraterede kollektioner frem for støjende kataloger.",
            },
            {
              icon: <Truck size={20} strokeWidth={1.5} className="text-[#8b6914]" />,
              title: "Diskret levering",
              text: "Følg ordren roligt fra butik til dør i realtid.",
            },
            {
              icon: <Building2 size={20} strokeWidth={1.5} className="text-[#8b6914]" />,
              title: "Lokal luksus",
              text: "Skabt omkring København K med hurtig radius.",
            },
          ].map((item) => (
            <TiltCard key={item.title}>
              <motion.div
                whileHover={reduceMotion ? undefined : { y: -2 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="h-full"
              >
                <Card className="h-full rounded-[1.125rem] border border-stone-200/95 bg-white p-6 text-stone-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),0_14px_40px_rgba(28,25,23,0.07)] ring-1 ring-stone-900/[0.04]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border-[0.5px] border-stone-200/90 bg-[#faf8f5] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)]">
                    {item.icon}
                  </div>
                  <h3 className="font-serif text-xl font-medium tracking-tight text-stone-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.text}</p>
                </Card>
              </motion.div>
            </TiltCard>
          ))}
        </section>

        <section id="about" className="space-y-5">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-stone-900 md:text-3xl">
            En ny shopping-rytme
          </h2>
          <Card className="border-[0.5px] border-stone-200/90 bg-white/90 p-8 text-stone-900 shadow-sm backdrop-blur-sm md:p-10">
            <p className="text-sm leading-relaxed text-stone-600 md:text-base">
              LOOMY er designet som et moderne fashion-atelier i app-form. Vi forener
              lokale butikker, live lager og hurtig levering i et minimalistisk flow, så du
              kan beslutte dig hurtigt uden at miste overblik.
            </p>
            <div className="mt-6">
              <Link
                href="/about"
                className="inline-flex min-h-11 items-center rounded-xl border-[0.5px] border-stone-300 bg-white px-5 text-sm font-medium text-stone-800 shadow-sm transition hover:border-stone-400 hover:bg-stone-50 active:scale-[0.98]"
              >
                Læs LOOMY universet
              </Link>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-stone-600 md:text-base">
              Målet er enkelt: færre klik, bedre kvalitet og en oplevelse der føles
              gennemtænkt fra første swipe til levering.
            </p>
          </Card>
        </section>

        <section id="feedback" className="space-y-5">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-stone-900 md:text-3xl">
            Form LOOMY med os
          </h2>
          <Card className="border-[0.5px] border-stone-200/90 bg-white/90 p-8 shadow-sm backdrop-blur-sm md:p-10">
            <p className="text-sm leading-relaxed text-stone-600 md:text-base">
              Har du idéer til en bedre oplevelse? Del dem — vi justerer løbende design,
              flow og sortiment efter rigtig brugeradfærd.
            </p>
            <div className="mt-6">
              <Link
                href="/feedback"
                className="inline-flex min-h-11 items-center rounded-xl border-[0.5px] border-stone-900/15 bg-stone-900 px-5 text-sm font-medium text-[#faf8f5] shadow-md transition hover:bg-stone-800 active:scale-[0.98]"
              >
                Del feedback
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
