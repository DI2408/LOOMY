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

Shared Cursor **rules** and **agent skills** live in [DI2408/loomy-cursor-skills](https://github.com/DI2408/loomy-cursor-skills). This is **not** a git submodule: Vercel builds do not need it, and submodule fetch warnings/failures on CI are avoided.

**Optional — after clone, for local Cursor only:**

```bash
git clone https://github.com/DI2408/loomy-cursor-skills.git .cursor/loomy-cursor-skills
npm run cursor:sync
```

`npm run cursor:sync` copies `rules/loomy.mdc` → `.cursor/rules/loomy.mdc` and each skill folder from that repo into `.cursor/skills/<name>/`. When the skills repo updates: `cd .cursor/loomy-cursor-skills && git pull`, then `npm run cursor:sync` from the project root.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### 403 / “Forbidden” on `*.vercel.app`

That usually means **Deployment Protection** (kun team / ikke-logget ind). Åbn URL’en i en browser hvor du er **logget ind på Vercel** med en bruger der er inviteret til teamet, eller brug **Share** på deployment i Vercel-dashboard. Det er som regel **ikke** relateret til git-submodules.
