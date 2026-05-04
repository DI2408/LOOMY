"use client";

import Image from "next/image";
import { CheckCircle2, Gem, Target, Users } from "lucide-react";
import { LoomyHeader } from "@/components/loomy-header";
import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen text-slate-900">
      <LoomyHeader />

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <p className="text-xs uppercase tracking-[0.25em] text-[#d97745]">Om LOOMY</p>
          <h1 className="mt-2 max-w-4xl text-3xl font-black leading-tight md:text-5xl">
            Vi gør tøjshopping hurtigere, nemmere og mere kvalitetsbevidst.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-slate-600">
            LOOMY er skabt for kunder, der vil kunne shoppe direkte fra sofaen eller
            sengen og få tøj leveret inden for få timer fra lokale premium-butikker i
            København.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm">
            <div className="mb-4 overflow-hidden rounded-xl border border-slate-200">
              <Image
                src="/about/vision.svg"
                alt="LOOMY vision illustration"
                width={1400}
                height={900}
                className="h-52 w-full object-cover md:h-64"
              />
            </div>
            <div className="flex items-center gap-2 text-slate-900">
              <Target size={18} className="text-[#d97745]" />
              <h2 className="text-xl font-bold">Vores vision</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Vi vil være en af de foerende platforme inden for hurtig modelevering og
              kundernes favoritsted at handle tøj. Vi kombinerer convenience, kvalitet og
              lokal butikskultur i en samlet digital oplevelse.
            </p>
          </Card>

          <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm">
            <div className="mb-4 overflow-hidden rounded-xl border border-slate-200">
              <Image
                src="/about/mission.svg"
                alt="LOOMY mission illustration"
                width={1400}
                height={900}
                className="h-52 w-full object-cover md:h-64"
              />
            </div>
            <div className="flex items-center gap-2 text-slate-900">
              <Users size={18} className="text-[#d97745]" />
              <h2 className="text-xl font-bold">Vores mission</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Vores mission er at goere levering af tøj markant hurtigere, så du ikke
              behoever at gå ud og shoppe fysisk. Med LOOMY kan du bestille fra din seng
              og modtage dit outfit inden for et par timer.
            </p>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: <Gem size={18} className="text-[#d97745]" />,
              title: "Kvalitet først",
              text: "Vi arbejder med butikker, der prioriterer kvalitet, pasform og holdbarhed.",
            },
            {
              icon: <CheckCircle2 size={18} className="text-[#d97745]" />,
              title: "Paalidelig levering",
              text: "Vi designer et flow, hvor ordre, butik og courier arbejder sammen uden friktion.",
            },
            {
              icon: <Target size={18} className="text-[#d97745]" />,
              title: "Kundefokus",
              text: "Vi bygger LOOMY ud fra en maalsaetning: hurtigt, overskueligt og trygt.",
            },
          ].map((item) => (
            <Card key={item.title} className="border border-slate-200 bg-white text-slate-900 shadow-sm">
              <div className="mb-2">{item.icon}</div>
              <h3 className="text-lg font-bold">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.text}</p>
            </Card>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Hvorfor LOOMY?</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            Vi tror på, at fremtidens modehandel er hyperlokal, hurtig og digital. Du skal
            kunne finde det rigtige look på få minutter, se live lagerstatus på størrelser,
            og få hurtig levering uden at gå på kompromis med kvaliteten. Derfor bygger vi en
            platform, der forener moderne teknologi med de bedste lokale butikker.
          </p>
        </section>
      </main>
    </div>
  );
}
