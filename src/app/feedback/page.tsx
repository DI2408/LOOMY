"use client";

import { useState } from "react";
import { Mail, MessageSquareHeart, Send } from "lucide-react";
import { LumiHeader } from "@/components/lumi-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FeedbackPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const submitFeedback = () => {
    if (!message.trim()) return;
    setSent(true);
    setMessage("");
  };

  return (
    <div className="min-h-screen text-slate-900">
      <LumiHeader />

      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 md:px-6 md:py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#fff3dd] p-2">
              <MessageSquareHeart size={18} className="text-[#d97745]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#d97745]">Feedback</p>
              <h1 className="mt-1 text-2xl font-black md:text-4xl">
                Er der noget, du synes vi kan forbedre?
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Vi vil gerne gøre LOOMY endnu bedre. Del din oplevelse, ideer eller
                forslag - sa kontakter vi dig gerne tilbage.
              </p>
            </div>
          </div>
        </section>

        <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm">
          <div className="grid gap-4">
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Mail size={14} className="text-[#d97745]" />
                Din email (valgfri)
              </span>
              <input
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setSent(false);
                }}
                type="email"
                placeholder="dig@email.dk"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-500"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-800">Din feedback</span>
              <textarea
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setSent(false);
                }}
                placeholder="Skriv hvad du synes fungerer godt, og hvad vi kan forbedre..."
                className="min-h-56 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-500"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={submitFeedback}>
                <span className="inline-flex items-center gap-2">
                  Send feedback
                  <Send size={14} />
                </span>
              </Button>
              <p className="text-xs text-slate-500">
                Vi læser al feedback og bruger det aktivt i produktudviklingen.
              </p>
            </div>

            {sent ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Tak for din feedback! Vi vender tilbage, hvis du har skrevet email.
              </div>
            ) : null}
          </div>
        </Card>
      </main>
    </div>
  );
}
