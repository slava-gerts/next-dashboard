# Product Feedback Board

A public board for proposing product improvements, voting on ideas, and following their progress.

[Try the live demo](https://next-dashboard-one-tau-24.vercel.app/)

![The suggestions board showing search, vote counts, and suggestion statuses](docs/suggestions.jpg)

## Features

- Browse and search suggestions, open discussions, and see which ideas are planned, in progress, completed, or declined.
- Sign in with Google to submit suggestions, vote or remove your vote, and leave comments.
- Use the moderator dashboard at `/moderation` to update suggestion statuses. The server checks the moderator role when loading the dashboard and when saving a change.

## How it works

The app uses Next.js App Router, TypeScript, and CSS Modules. GraphQL Yoga serves the API at `/api/graphql`, Apollo Client handles browser requests and caching, and GraphQL Code Generator generates resolver and operation types. Better Auth manages Google sign-in and database-backed sessions. Prisma handles data access, with PostgreSQL hosted on Neon for the Vercel deployment.

- **Browsing and voting.** Suggestions and comments use cursor pagination. Search waits for a short pause in typing before querying. Votes update optimistically in Apollo, and PostgreSQL enforces one vote per user per suggestion.
- **Moderation and caching.** A Next.js Server Action checks the session, saves the status through Prisma, and revalidates `/moderation`. On success, the form uses Apollo’s `cache.modify` to update the cached `Suggestion` by ID. Any cached list or discussion that references that suggestion can show the new status without refetching in the same tab.

## Run locally

You’ll need Node.js 24 LTS, npm, a PostgreSQL database, and a Google OAuth client of type **Web application**.

1. Install dependencies.

   ```bash
   npm ci
   ```

2. Create a `.env` file in the repository root and replace the placeholders with your own values. Generate the auth secret with `openssl rand -base64 32`.

   ```dotenv
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/next_dashboard"
   BETTER_AUTH_URL="http://localhost:3000"
   BETTER_AUTH_SECRET="replace-with-a-generated-secret"
   GOOGLE_CLIENT_ID="replace-with-your-google-client-id"
   GOOGLE_CLIENT_SECRET="replace-with-your-google-client-secret"
   ```

   Add `http://localhost:3000/api/auth/callback/google` to your OAuth client’s **Authorized redirect URIs**. If you use another port, update both the redirect URI and `BETTER_AUTH_URL`. [Better Auth Google setup](https://better-auth.com/docs/authentication/google)

3. Apply the existing migrations and generate the Prisma client and GraphQL types.

   ```bash
   npx prisma migrate deploy
   npm run generate
   ```

4. Optionally load sample suggestions, then start the development server.

   ```bash
   npx prisma db seed  # Optional
   npm run dev
   ```

   Open the [local app](http://localhost:3000). You can also try GraphQL operations in [GraphiQL](http://localhost:3000/api/graphql) while the development server is running.

### Try moderation locally

Sign in once to create your account. In your local PostgreSQL database, run the query below with the email you used to sign in. Then refresh `/moderation` while signed in.

```sql
UPDATE "user"
SET "role" = 'MODERATOR'
WHERE "email" = 'you@example.com'
RETURNING "email", "role";
```

### Production build

Run `npm run build` to regenerate the Prisma client and GraphQL types and compile the app. For a deployment, set `BETTER_AUTH_URL` to the public origin, register its Google callback URL, and apply pending database migrations before releasing the new build.
