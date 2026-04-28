# LOOMY Supabase — migration order

Run these SQL files **in order** in the Supabase SQL Editor on a **fresh** project (or read upgrade notes below).

1. `partner_profiles.sql` — butik + bud mapping (`partner_profiles`)
2. `customer_profiles.sql` — kundeprofiler (`customer_profiles`)
3. `loomy_platform.sql` — fuldt platformskema (katalog, ordre, betalinger, feedback, trigger på `auth.users`)

## Efter kørsel

- Opret Auth-brugere der matcher seed-e-mails (se `supabase/README.md`).
- Sæt env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (kun server).

## Eksisterende database

Hvis du allerede har kørt `partner_profiles.sql` og `customer_profiles.sql`, kan du typisk **kun** tilføje `loomy_platform.sql`.  
Hvis du får fejl om manglende kolonne `user_id` på `customer_profiles`, kør først den relevante `ALTER TABLE` fra starten af `loomy_platform.sql` manuelt og ret evt. dubletter.
