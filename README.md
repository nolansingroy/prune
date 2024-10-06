This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

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

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

# prune

# commands

npm run dev
npm run build
vercel --prod
firebase deploy --only functions

# shadcn commponents

https://ui.shadcn.com/docs/components/navigation-menu
npx shadcn-ui@latest add navigation-menu

# issues identified while reviewing the code :

# Changelog

- removed the pages router
- added next-loader to maintain smooth transitions
- fixed header drawe bug where clicking links does not close the drawer
- server rendered all pages
- created paths on app router to organise folder structure
- fixed footer on viewport in auth pages
- impove the speed of page renders by server rendering pages to prevent loading unnessesary packeges to the client
- fixed a bug where calender page had multiple renders in a single session.
- replace fav icon.
