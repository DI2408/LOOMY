---
name: vault-master
description: >-
  Enforces LOOMY security for Supabase Postgres (RLS, schemas) and Next.js API routes:
  zero-trust RLS, JWT role checks, E.164 phone normalization, address validation before
  persist, and index guidance (GIN on JSONB, B-tree on foreign keys). Use when designing
  or changing tables, policies, migrations, auth-related queries, route handlers, or
  when the user mentions security hardening, RLS, data sanitization, or Vault Master.
---

# The Vault Master (Security)

Apply this skill when working on **Supabase schemas**, **Row Level Security (RLS)**, or **API routes** (App Router `route.ts`, server actions, Edge Functions) that read or write protected data.

## 1. Zero Trust (RLS)

- **No table holding tenant or user data may rely on implicit access.** Every such table needs **explicit RLS enabled** and **explicit policies** for each operation (`SELECT` / `INSERT` / `UPDATE` / `DELETE`) that should exist—never “open by omission.”
- **Deny by default**: If a policy is missing for an operation, that operation must not succeed for client roles.
- **Service role bypass**: Remember the service role skips RLS; keep privileged paths in server-only code and never expose service keys to the client.
- When adding a new table, include in the same change: `ENABLE ROW LEVEL SECURITY` and policies, or a documented exception (e.g. truly public reference data) with a comment in migration.

## 2. Role-Based Access (JWT)

- **Every policy and every sensitive server query must account for who is calling**—anonymous, authenticated user, or privileged path.
- Use JWT claims for **application roles** (e.g. customer, store, rider) as your project defines them. If your Auth hook or JWT template exposes a top-level `role` for that purpose, enforce it in policies, for example:

```sql
(auth.jwt() ->> 'role') = 'store'
```

- **Align the JSON path with your real JWT**: Supabase’s default payload often uses `authenticated` / `anon` at `role` for Supabase’s own notion of role; **app roles** may live under `app_metadata` or `user_metadata`. Use the path that matches LOOMY’s issued tokens (e.g. `(auth.jwt() -> 'app_metadata' ->> 'role')`) while keeping the same rule: **no policy without an explicit role/tenant check** where data is scoped.
- API routes: validate session (e.g. Supabase server client) and **authorize** before mutating data; do not duplicate RLS in the route alone—RLS remains the database backstop.

## 3. Data Sanitization

- **Phone numbers**: Normalize to **E.164** before persist or downstream use (single canonical string, include country when parsing from user input). Reject or strip input that cannot be normalized unambiguously.
- **Addresses**: **Validate** (required fields, format, allowed regions if product-defined) **before save**; do not persist free-form blobs as production addresses without checks. Prefer structured fields + validation (Zod on API, constraints where useful in DB).

## 4. Performance (Indexes)

When suggesting or writing migrations for touched tables:

- **JSONB columns** used in filters or containment: recommend **`jsonb_path_ops` or `jsonb_ops` GIN** (choose based on query types; default `jsonb_ops` if unsure and queries use `?` / `@>` / `jsonb_path_exists`).
- **Foreign keys** and columns used in **joins / equality filters**: recommend **B-tree** indexes on the FK column (and matching composite indexes if queries are always multi-column).

Keep index advice proportional to the change—mention missing indexes when JSONB or FK filters appear in new hot paths.

## Quick checklist

- [ ] RLS enabled; policies exist for each intended client operation
- [ ] Policies tie rows to `auth.uid()`, tenant/store id, and/or JWT role claim as designed
- [ ] Phones E.164; addresses validated before write
- [ ] JSONB filter paths considered for GIN; FK/filter columns considered for B-tree
