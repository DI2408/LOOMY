"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Mail, MessageSquareHeart, Send } from "lucide-react";
import { LumiHeader } from "@/components/lumi-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { springSoft } from "@/components/motion-config";

export default function FeedbackPage() {
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submitFeedback = () => {
    if (!message.trim()) return;
    setBusy(true);
    window.setTimeout(() => {
      setSent(true);
      setMessage("");
      setBusy(false);
    }, 450);
  };

  return (
    <div className="flex min-h-screen flex-col text-stone-900">
      <LumiHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-8 md:space-y-10 md:px-8 md:py-12">
        <motion.section
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSoft}
          className="rounded-3xl border-[0.5px] border-stone-200/90 bg-white/90 p-8 shadow-[0_20px_60px_rgba(28,25,23,0.06)] backdrop-blur-sm md:p-10"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#8b6914]/10">
              <MessageSquareHeart size={22} className="text-[#8b6914]" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8b6914]">Feedback</p>
              <h1 className="mt-2 font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl">
                Hvad kan vi gøre bedre?
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-stone-600 md:text-base">
                Vi læser al feedback og bruger den aktivt i produktet. Del gerne både det, der fungerer, og
                det der irriterer dig.
              </p>
            </div>
          </div>
        </motion.section>

        <Card className="border-[0.5px] border-stone-200/90 p-6 shadow-sm md:p-8">
          <div className="grid gap-6">
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-stone-800">
                <Mail size={16} className="text-[#8b6914]" strokeWidth={1.75} />
                Din e-mail (valgfri)
              </span>
              <input
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setSent(false);
                }}
                type="email"
                placeholder="dig@email.dk"
                className="min-h-11 w-full rounded-xl border-[0.5px] border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#8b6914]/45 focus:ring-2 focus:ring-[#8b6914]/15"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-800">Din feedback</span>
              <textarea
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setSent(false);
                }}
                placeholder="Skriv hvad der fungerer godt, og hvad vi kan forbedre…"
                className="min-h-52 w-full rounded-2xl border-[0.5px] border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#8b6914]/45 focus:ring-2 focus:ring-[#8b6914]/15"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button onClick={submitFeedback} disabled={busy || !message.trim()}>
                <span className="inline-flex items-center gap-2">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send feedback
                </span>
              </Button>
              <p className="text-xs text-stone-500">
                Demo: beskeden gemmes ikke på server — kun UI-feedback.
              </p>
            </div>

            {sent ? (
              <div className="rounded-xl border-[0.5px] border-emerald-200/90 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">
                Tak for din feedback! Vi vender tilbage, hvis du har angivet e-mail.
              </div>
            ) : null}
          </div>
        </Card>
      </main>
    </div>
  );
}
