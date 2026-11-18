# Deploy Super Admin Dashboard to Cloudflare Workers

This app is already set up for Cloudflare Workers (OpenNext). Everything below runs inside this folder.

| | |
|---|---|
| Worker name | `v-try-super-admin` (set in `wrangler.jsonc`) |
| Production domain | `https://admin.vtrystudio.com` |
| Backend API | `https://api.vtrystudio.com` |
| Node | 26 (`.nvmrc`) |

## 1. One-time setup

```bash
npm ci                 # install dependencies
npx wrangler login     # opens the browser to sign in to Cloudflare
```

## 2. Set the secrets (never put these in a file in git)

```bash
npx wrangler secret put NEXTAUTH_SECRET   # random 32+ character string that encrypts login sessions (`openssl rand -hex 32`)
# npx wrangler secret put SUPER_ADMIN_SECURITY_KEY   # optional extra key read by `lib/server-security.ts`
```

Public, non-secret settings (site URL, API URL) are already in `wrangler.jsonc` (runtime) and `.env.production` (baked in at build). Change them there if a domain changes, then redeploy.

## 3. Deploy

```bash
npm run deploy
```

This builds the app and publishes it. Cloudflare prints the URL (`https://v-try-super-admin.<your-subdomain>.workers.dev`).

## 4. Attach your domain

Either in the dashboard (**Workers & Pages -> v-try-super-admin -> Settings -> Domains & Routes -> Add -> Custom domain -> `admin.vtrystudio.com`**), or uncomment the `routes` block in `wrangler.jsonc` and run `npm run deploy` again. The domain's DNS must be in the same Cloudflare account.

## 5. Settings in other places that must match

- **Backend `.env`:** `CORS_ORIGINS` must include `https://admin.vtrystudio.com`, and `COOKIE_DOMAIN=.vtrystudio.com` must be set so the login cookies are shared with the API. Restart the backend after changing them.
- **Google:** Google sign-in uses the Google button, not a redirect. In Google Cloud Console, open the OAuth client the backend uses (`GOOGLE_CLIENT_ID`) and add this under **Authorized JavaScript origins**: `https://admin.vtrystudio.com`.
- **Google:** The backend `.env` must have `SEED_ADMIN_EMAIL` set to the Google email allowed to sign in.

## Preview locally in the Cloudflare runtime

```bash
cp .dev.vars.example .dev.vars   # fill in the values (this file is git-ignored)
npm run preview
```

## Deploy from Git (Workers Builds) instead of from your computer

In the Cloudflare dashboard create a Worker from this Git repository and use:

- Build command: `npx opennextjs-cloudflare build`
- Deploy command: `npx opennextjs-cloudflare deploy`
- Build variable: `NODE_VERSION=26`

Add the secrets above under **Settings -> Variables and Secrets** (type "Secret").

## Good to know

- `NEXT_PUBLIC_*` values are baked in at build time. Edit `.env.production` and redeploy to change them.
- The Edge runtime (`export const runtime = 'edge'`) is not supported by the adapter and must not be used in this app. Routes already run on Workers.
- `next/image` uses the Cloudflare Images binding (`IMAGES` in `wrangler.jsonc`). If you do not want to use it, set `images.unoptimized: true` in `next.config.js` and remove the binding.
- If you start using ISR / `revalidate`, add an R2 or KV cache in `open-next.config.ts`.
- The `Dockerfile` is not used for Cloudflare. Keep it only if you also deploy somewhere else.
- Limits: the Worker is about 2 MiB compressed, well under the 3 MiB free-plan limit.
