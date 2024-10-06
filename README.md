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

- why when pressing on the drawer : "profile, calendar" on desktop view, sometimes it navigates and sometimes it does not ?
- we have a hydration error, most likely caused by renders on sever does not match client content.
- why do you have a mix between the app router and the pages router ??
- i recommend to use only the app router and each path has a page.tsx so that we can make the page async and do crud on the server and pass only the result to the client.
- i noticed that most pages are rendered on client. this can be a limitation as cannot use server inhancements and benefits.
- using server actions in forms can inhance speed and resources.
- from where the user can access "My Available time" ??
- priority is figma design or tickets ?? what is priorety for MVP
- does UI needs to be changed for release ?? because i normally start with UI to create re-useble components. it wil make the development faster and easier !!
- noticed that tickets are functional issues .. starts with that ?? whats the priority ??
