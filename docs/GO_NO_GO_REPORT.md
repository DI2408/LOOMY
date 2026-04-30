# LOOMY — Go / No-Go report (max-kritisk)

**Formål:** Benhård vurdering pr. modul: kan vi sætte platformen i produktion uden uacceptabel risiko?

**Samlet vurdering:** **NO-GO for kommerciel launch** (demo / intern pilot: **CONDITIONAL GO**).

| Modul | Status | Kort begrundelse |
|-------|--------|------------------|
| Auth & roller | **CONDITIONAL GO** | Supabase Auth + partner mapping findes; mangler hård server-side rollevalidering på alle sensitive paths og fuld onboarding. |
| Katalog & lager | **CONDITIONAL GO** | DB + RLS + realtime muligt; mangler reservations-/timeout-flow og belastnings-/konkurrencetest. |
| Ordrer & status | **CONDITIONAL GO** | RPC + unikke ordrenumre er stærkt; mangler fuld state-machine audit, cancel/timeout, og bevis for RLS på tværs af edge cases. |
| Betalinger (Stripe) | **CONDITIONAL GO** | Checkout + Connect destination charge + webhook idempotency + payment gating er implementeret; mangler fuld onboarding, dispute depth, reconciliation, og Connect model hardening for scale. |
| Sikkerhed (RLS + API) | **NO-GO** | RLS er på plads i SQL, men **mangler dokumenteret og automatiseret policy-matrix** + rate limits + penetrationstest-light. |
| Frontend / UX | **CONDITIONAL GO** | Stærk visuel profil; blandet sprog, for meget kritisk logik i client provider, mangler ensartet error/toast-lag på alle flows. |
| Drift & observability | **NO-GO** | Mangler Sentry/alarmer, e2e i CI, staging-paritet, og runbooks der er testet i øvelse. |

---

## 1. Auth & roller

**GO hvis:** Alle tre aktører kan kun nå deres data; ingen vej fra “demo” til at skrive andres rækker; session refresh og logout er verificeret under belastning.

**I dag:** Partner-profiler + kundeprofiler + client flows — **OK til pilot**, ikke til fuld markedslancering uden server-side gate på alle mutations.

**NO-GO triggers:**

- Rolle kan sættes client-only uden at matche JWT + DB.
- Manglende rate limit på login / password reset (når I tilføjer det).

---

## 2. Katalog & lager

**GO hvis:** Lager er konsistent under samtidige bestillinger; udsolgt kan ikke oversælges; butik kan kun skrive egen butiks lager.

**I dag:** `place_loomy_order` decrementer atomisk i én transaktion — **godt fundament**. Mangler reservation ved checkout-start og release ved timeout.

**NO-GO triggers:**

- Ingen automatiseret test der beviser “sidste stk” under race.
- Ingen admin-værktøj til manuel lager-korrektion med audit trail.

---

## 3. Ordrer & status

**GO hvis:** Statusovergange er entydige, idempotente, og logges; bud/butik kan ikke hoppe status udenfor regler; kunde ser kun egne ordrer.

**I dag:** RPC til progress + unikke `LOO-…` id’er — **stærkt**. Mangler cancel/SLA, og fuld dokumentation af alle overgange.

**NO-GO triggers:**

- Ordrer kan “sidde fast” uden timeout/cancel uden manuel DB.
- Ingen e2e der dækker hele kæden på staging mod rigtig Supabase.

---

## 4. Betalinger (Stripe Connect)

**GO hvis:** Checkout/PaymentIntent oprettes server-side; Connect routing er korrekt; webhooks opdaterer `payments` konsistent; refunds/disputes håndteres; ingen hemmeligheder i browser; idempotency bevist under replay; reconciliation kører.

**I dag:** Stripe Checkout session med **destination charge** + **application fee** + webhook idempotency + `payments` opdatering + betaling påkrævet før butik starter pakning — **stærkt fundament**, men ikke “færdig bank” uden onboarding + reconciliation + dispute-dybde.

**Kommerciel launch forbliver NO-GO** indtil onboarding, reconciliation og dispute/chargeback-dybde er på plads — men pilot med manuelle Connect-konti er nu realistisk.

---

## 5. Sikkerhed (RLS + API)

**GO hvis:** For hver tabel: RLS ON + policies for SELECT/INSERT/UPDATE/DELETE som tiltænkt; service role kun i snævre server routes; ingen “åbne” RPCs uden auth check.

**I dag:** God retning i SQL; **mangler bevis** (automatiseret matrix + gennemgang af hver RPC).

**NO-GO triggers:**

- Enhver tabel med brugerdata uden eksplicit deny-default mental model i review.
- Webhook uden monitoring af fejlrate.

---

## 6. Frontend / UX

**GO hvis:** Alle kritiske flows har loading + fejl + tom tilstand; ét sprog (eller bevidst tosproget); ingen skjult afhængighed af demo-state i prod.

**I dag:** Flot UI; **CONDITIONAL** pga. demo-fallback og blandet copy.

---

## 7. Drift & observability

**GO hvis:** CI = lint + types + build + e2e; staging = prod-paritet; Sentry + dashboards; backup testet.

**I dag:** Lint + build i repo — **ikke nok**.

**NO-GO for launch.**

---

# Prioriteret løfteliste (rækkefølge der giver mest “rating” pr. uge arbejde)

## P0 — Stopper for launch (gør først)

1. **Stripe:** Connect onboarding i produkt (erstat `LOOMY_STORE_STRIPE_ACCOUNTS`) + reconciliation + dispute/chargeback playbooks.
2. **Stripe:** Udvid webhooks (refund, dispute, payment_intent amounts) + reconciliation felt / event log.
3. **E2E:** Playwright (eller lign.) mod staging: login → bestil → butik → bud → leveret.
4. **Observability:** Sentry + strukturerede logs på `/api/*` + webhook fejl.

## P1 — Høj risiko efter launch hvis ikke gjort

5. **Lager:** Reservation + timeout release + cancel path.
6. **RLS:** Skriftlig + testet matrix (automatiseret hvor muligt).
7. **Rate limits:** Auth + order create + webhook replay beskyttelse.

## P2 — Kvalitet og skala

8. Fjern eller isolér demo-fallback strikt til `NODE_ENV=development` eller feature flag.
9. Ensret sprog (DA) i hele kunde/butik/bud UI.
10. Admin / support read-only views (service role) til ordre- og betalingsopslag.

## P3 — “Top tier” polish

11. Push notifications + kunde kommunikationspræferencer.
12. Fraud heuristics + velocity checks.
13. Performance budgets (LCP, bundle size) og Real User Monitoring.

---

## Hurtig score (ærlig)

| Dimension | Score (/10) |
|-----------|-------------|
| Produkt (demo/pilot) | **7.0** |
| Produkt (kommerciel) | **6.0** |
| Production readiness | **4.5** |
| Betalinger | **6.5** |
| Sikkerhed (bevist) | **5.0** |
| UX / brand | **8.0** |

**Bundlinje:** I har et stærkt **MVP+** med retning mod enterprise — men **ikke** “klar til rollout” i betydningen fuld markedsgang med penge og tre parter, før P0 er lukket.

---

*Se også `docs/LAUNCH_READINESS_V1.md` for den konkrete pass/fail checkliste der kan følges under release.*
