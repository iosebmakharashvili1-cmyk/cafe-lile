# Deploying Cafe Lile to Cloudflare

Follow this order exactly. Most deploy errors in this stack come from doing
steps out of sequence (e.g. deploying Pages before the Worker exists, so
there's no API URL to point at).

## 0. One-time setup

```bash
npm install -g pnpm wrangler
cd cafe-lile
pnpm install
npx wrangler login
```

## 1. Create the D1 databases

```bash
cd workers/ordering-api
npx wrangler d1 create ordering-staging
npx wrangler d1 create ordering-prod
```

Each command prints a `database_id`. Open `wrangler.jsonc` and paste them in —
there are two `REPLACE_WITH_STAGING_DATABASE_ID` occurrences (top-level +
`env.staging`) and one `REPLACE_WITH_PROD_DATABASE_ID` (`env.production`).

## 2. Apply the schema

```bash
# Local (for `wrangler dev` testing)
npx wrangler d1 migrations apply ordering-staging --local

# Staging (remote)
npx wrangler d1 migrations apply ordering-staging --env staging --remote

# Production (remote)
npx wrangler d1 migrations apply ordering-prod --env production --remote
```

## 3. Set Worker secrets

Generate two random strings (a password manager or `openssl rand -base64 32`
works fine) and set them for **both** environments:

```bash
npx wrangler secret put SESSION_TOKEN_HASH_PEPPER --env staging
npx wrangler secret put IP_HASH_KEY --env staging

npx wrangler secret put SESSION_TOKEN_HASH_PEPPER --env production
npx wrangler secret put IP_HASH_KEY --env production
```

Use **different** random values for staging vs. production.

## 4. Create your admin login

```bash
cd ../..  # back to repo root
node scripts/create-admin.mjs soso "a-strong-real-password" "Soso"
```

This prints an `INSERT` statement. Run it against staging and/or production:

```bash
npx wrangler d1 execute ordering-staging --env staging --remote --command "<paste the INSERT here>"
npx wrangler d1 execute ordering-prod --env production --remote --command "<paste the INSERT here>"
```

Repeat `create-admin.mjs` once per staff member who needs a login.

## 5. Deploy the Worker

```bash
cd workers/ordering-api
npx wrangler deploy --env staging
```

Wrangler prints a URL like `https://ordering-api-staging.<subdomain>.workers.dev`.
**Copy this URL** — you need it in step 6.

(Repeat with `--env production` when you're ready to go live.)

## 6. Create the two Pages projects

In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**,
pointing at this repo. Create **two separate Pages projects**:

| Pages project | Root directory | Build command | Build output directory |
|---|---|---|---|
| `cafe-lile-customer` | `apps/customer-web` | `pnpm install && pnpm build` | `dist` |
| `cafe-lile-admin` | `apps/admin-web` | `pnpm install && pnpm build` | `dist` |

For **each** project, under **Settings → Environment variables**, add:

```
VITE_API_BASE_URL = https://ordering-api-staging.<subdomain>.workers.dev
```

(the exact URL Wrangler printed in step 5). This is the step most likely to
be missed — without it, the deployed site quietly tries to call
`localhost:8787` and every request fails.

Deploy each project. Cloudflare gives you `*.pages.dev` URLs, e.g.:
- `https://cafe-lile-customer.pages.dev`
- `https://cafe-lile-admin.pages.dev`

## 7. Point CORS at the real Pages URLs

Open `workers/ordering-api/wrangler.jsonc` and update `env.staging.vars` to
match the **exact** URLs from step 6:

```jsonc
"vars": {
  "ALLOWED_PUBLIC_ORIGIN": "https://cafe-lile-customer.pages.dev",
  "ALLOWED_ADMIN_ORIGIN": "https://cafe-lile-admin.pages.dev"
}
```

Exact match matters — `https://cafe-lile-customer.pages.dev` and
`https://www.cafe-lile-customer.pages.dev` are different origins to the
Worker's CORS check. Then redeploy the Worker so it picks up the change:

```bash
cd workers/ordering-api
npx wrangler deploy --env staging
```

## 8. Test end-to-end

- Open the customer Pages URL → menu should load (no skeleton stuck forever,
  no CORS error in the browser console)
- Add an item, checkout, confirm you get an order reference
- Open the admin Pages URL → log in with the credentials from step 4
- The order you just placed should appear in the **New** column within 5 seconds

## Troubleshooting

**"Failed to fetch" / blank menu on the customer site**
Open browser dev tools → Network tab. If the request to `/v1/public/menu`
shows as blocked with a CORS error, `ALLOWED_PUBLIC_ORIGIN` doesn't exactly
match the Pages URL — recheck step 7.

**Admin login always says "Incorrect username or password"**
The admin user probably wasn't inserted into the environment you're testing
against (staging vs. production are separate databases) — rerun step 4
against the right one.

**Worker deploy fails with a routes/custom domain error**
You're using `--env production` before `cafelile.ge` DNS is on this
Cloudflare account. Either finish domain setup first, or deploy without
routes (the current `wrangler.jsonc` has the production `routes` block
commented out for exactly this reason — production is reachable at its
`workers.dev` URL until you're ready).

## Going live on custom domains

Once `cafelile.ge` DNS is added to this Cloudflare account:
1. Uncomment the `routes` block in `wrangler.jsonc` under `env.production`
2. In each Pages project → **Custom domains**, add `order.cafelile.ge` /
   `admin.cafelile.ge`
3. Update `env.production.vars` in `wrangler.jsonc` to the final domains
4. Redeploy the Worker, then update `VITE_API_BASE_URL` in both Pages
   projects to `https://api.cafelile.ge`, then redeploy both Pages projects
