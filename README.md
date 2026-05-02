This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Cursor: LOOMY app + loomy-cursor-skills

This repo stays the **Next.js app** ([LOOMY](https://github.com/DI2408/LOOMY)). Shared Cursor **rules** and **agent skills** live in a separate repo and are wired in as a **git submodule** (source of truth for agents):

- Submodule: [DI2408/loomy-cursor-skills](https://github.com/DI2408/loomy-cursor-skills) at `.cursor/loomy-cursor-skills/`

After clone, initialize the submodule and sync files into the paths Cursor reads:

```bash
git submodule update --init --recursive
npm run cursor:sync
```

`npm run cursor:sync` copies `rules/loomy.mdc` → `.cursor/rules/loomy.mdc` and each skill folder from the submodule into `.cursor/skills/<name>/`. Other skill folders under `.cursor/skills/` that only exist in this repo are left unchanged.

When the skills repo updates: `cd .cursor/loomy-cursor-skills && git pull` (or `git submodule update --remote`) then `npm run cursor:sync` from the project root.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### 403 / “Forbidden” on `*.vercel.app`

That usually means **Deployment Protection** (kun team / ikke-logget ind). Åbn URL’en i en browser hvor du er **logget ind på Vercel** med en bruger der er inviteret til teamet, eller brug **Share** på deployment i Vercel-dashboard.

### Vercel build: “Failed to fetch git submodules”

Vercel clones submodules on build. If **`loomy-cursor-skills` is private**, give Vercel access: connect the same GitHub account/org to Vercel and grant the Vercel GitHub app access to that repo, **or** make `DI2408/loomy-cursor-skills` **public**. The Next.js app does not import that folder at runtime; the warning is safe to ignore for deploys if the build still succeeds.
