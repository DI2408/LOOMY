"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Gem, Target, Users } from "lucide-react";
import { LumiHeader } from "@/components/lumi-header";
import { Card } from "@/components/ui/card";
import { springSoft } from "@/components/motion-config";

export default function AboutPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex min-h-screen flex-col text-stone-900">
      <LumiHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-10 px-4 py-8 md:space-y-14 md:px-8 md:py-12">
        <motion.section
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSoft}
          className="rounded-3xl border-[0.5px] border-stone-200/90 bg-white/90 p-8 shadow-[0_20px_60px_rgba(28,25,23,0.06)] backdrop-blur-sm md:p-12"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8b6914]">Om LOOMY</p>
          <h1 className="mt-4 max-w-4xl font-serif text-3xl font-medium leading-tight tracking-tight md:text-5xl md:leading-[1.12]">
            Vi gør tøjshopping hurtigere, nemmere og mere kvalitetsbevidst.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-stone-600 md:text-lg">
            LOOMY er skabt for dig, der vil shoppe fra sofaen og få udvalgt mode leveret på få timer fra
            lokale premium-butikker i København.
          </p>
        </motion.section>

        <section className="grid gap-6 md:grid-cols-2 md:gap-8">
          <motion.div
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={springSoft}
          >
            <Card className="h-full overflow-hidden border-[0.5px] border-stone-200/90 p-0 shadow-[0_16px_48px_rgba(28,25,23,0.06)]">
              <div className="relative aspect-[21/10] overflow-hidden border-b-[0.5px] border-stone-200/80 bg-stone-100/50">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,transparent_40%,rgba(28,25,23,0.04)_100%)]" />
                <Image
                  src="/about/vision.svg"
                  alt="LOOMY vision — horisont og retning"
                  width={1400}
                  height={900}
                  className="h-full w-full object-cover object-center transition duration-700 ease-out hover:scale-[1.03]"
                  priority
                />
              </div>
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-2 text-stone-900">
                  <Target size={18} className="text-[#8b6914]" strokeWidth={1.75} />
                  <h2 className="font-serif text-xl font-medium tracking-tight md:text-2xl">Vores vision</h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-600 md:text-base">
                  Vi vil være blandt de førende platforme inden for hurtig modelevering og kundernes
                  foretrukne sted at handle tøj. Vi kombinerer convenience, kvalitet og lokal butikskultur i
                  én rolig digital oplevelse.
                </p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={springSoft}
          >
            <Card className="h-full overflow-hidden border-[0.5px] border-stone-200/90 p-0 shadow-[0_16px_48px_rgba(28,25,23,0.06)]">
              <div className="relative aspect-[21/10] overflow-hidden border-b-[0.5px] border-stone-200/80 bg-stone-100/50">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,transparent_45%,rgba(28,25,23,0.05)_100%)]" />
                <Image
                  src="/about/mission.svg"
                  alt="LOOMY mission — forbindelse og flow"
                  width={1400}
                  height={900}
                  className="h-full w-full object-cover object-center transition duration-700 ease-out hover:scale-[1.03]"
                />
              </div>
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-2 text-stone-900">
                  <Users size={18} className="text-[#8b6914]" strokeWidth={1.75} />
                  <h2 className="font-serif text-xl font-medium tracking-tight md:text-2xl">Vores mission</h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-600 md:text-base">
                  Vores mission er at gøre levering af tøj markant hurtigere, så du ikke behøver fysisk
                  shopping for hvert look. Med LOOMY bestiller du fra sengen og modtager dit outfit inden for
                  få timer.
                </p>
              </div>
            </Card>
          </motion.div>
        </section>

        <section className="grid gap-5 md:grid-cols-3 md:gap-6">
          {[
            {
              icon: <Gem size={18} className="text-[#8b6914]" strokeWidth={1.75} />,
              title: "Kvalitet først",
              text: "Vi arbejder med butikker, der prioriterer kvalitet, pasform og holdbarhed.",
            },
            {
              icon: <CheckCircle2 size={18} className="text-[#8b6914]" strokeWidth={1.75} />,
              title: "Pålidelig levering",
              text: "Et flow hvor ordre, butik og bud arbejder sammen uden friktion.",
            },
            {
              icon: <Target size={18} className="text-[#8b6914]" strokeWidth={1.75} />,
              title: "Kundefokus",
              text: "Hurtigt, overskueligt og trygt — bygget omkring din hverdag.",
            },
          ].map((item) => (
            <motion.div
              key={item.title}
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={springSoft}
            >
              <Card className="h-full border-[0.5px] border-stone-200/90 p-6 shadow-sm md:p-8">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#8b6914]/10">
                  {item.icon}
                </div>
                <h3 className="font-serif text-lg font-medium tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.text}</p>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="rounded-3xl border-[0.5px] border-stone-200/90 bg-white/90 p-8 shadow-sm backdrop-blur-sm md:p-10">
          <h2 className="font-serif text-xl font-medium tracking-tight md:text-2xl">Hvorfor LOOMY?</h2>
          <p className="mt-4 max-w-4xl text-sm leading-relaxed text-stone-600 md:text-base">
            Vi tror på, at fremtidens modehandel er hyperlokal, hurtig og digital. Du skal kunne finde det
            rigtige look på få minutter, se live lagerstatus på størrelser og få hurtig levering uden at gå
            på kompromis med kvaliteten. Derfor bygger vi en platform, der forener moderne teknologi med de
            bedste lokale butikker.
          </p>
        </section>
      </main>
    </div>
  );
}
