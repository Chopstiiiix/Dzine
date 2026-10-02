# Dzine

A design agent for posters, album art, flyers, social posts and cards.

The user adds their content (text, photos, logos), describes the look or attaches a reference, and
watches the design build live: chat on the left, canvas on the right.

## Why the output beats a plain image generator

Dzine is a hybrid engine. An AI image model paints the pictures. Claude, acting as art director,
composes the piece as real layers: every word, logo and shape is placed precisely, not painted.

- Text is always spelled correctly and stays sharp at print size.
- Uploaded logos are placed exactly as supplied, never redrawn.
- A change ("make the date bigger") edits one layer instead of regenerating the whole image.
- After composing, the agent is shown the real render and fixes what looks wrong before replying.
- Exports are rendered at the right pixel size for the chosen platform (for example 3000 x 3000 for an album cover).

## Run it

Open your computer's terminal, go to this folder, and run:

```bash
npm install
npm run dev
```

Then open http://localhost:3000. With no `.env.local` file it runs in **demo mode**: no sign-in,
data kept in memory, and a sample designer in place of the AI. Everything else is real, so you can
try the chat, live canvas, manual edits, credits, paywall and export straight away.

## Run locally for free (Apple Silicon Mac)

No API keys: Ollama plays the designer and [mflux](https://github.com/filipstrand/mflux) makes the
images (Z-Image Turbo for new images, FLUX.2 Klein 4B for edits of your photos; both Apache 2.0).

```bash
ollama pull gemma4:26b
uv tool install mflux --python 3.12   # puts mflux-generate-* in ~/.local/bin
```

Then use the "Free, fully local" block from `.env.example` in `.env.local`. The first image
downloads the model weights (about 30 GB in all). After that one image takes about 2 minutes on an
M-series Mac, and a full design with its review pass about 10 minutes. Lower `DZINE_LOCAL_IMAGE_SIZE`
to go faster.
A local model is a weaker designer than Claude, and background removal is off in this mode.
This setup only works on your own machine, not on Vercel.

## Go live

1. In your terminal, in this folder: `cp .env.example .env.local`
2. Fill in `.env.local`:

| Key | Where to get it |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard > project **CRDT** > Project Settings > API keys |
| `ANTHROPIC_API_KEY` | platform.claude.com > API keys |
| `FAL_KEY` | fal.ai/dashboard/keys |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe dashboard > Developers |
| `PAYSTACK_SECRET_KEY` | Paystack dashboard > Settings > API keys & webhooks |
| `NEXT_PUBLIC_APP_URL` | Your site address, e.g. `https://dzine.app` |

The Supabase URL and publishable key are already filled in. The database tables, security rules
and storage bucket are already created in that project (all prefixed `dzine_`, see
`supabase/migrations/0001_dzine.sql`).

3. Supabase dashboard > Authentication > URL Configuration: add `http://localhost:3000/**` and
   `https://YOUR-DOMAIN/**` to **Redirect URLs**. For "Continue with Google", enable the Google
   provider under Authentication > Sign In / Providers.
4. Webhooks (so credits arrive even if the buyer closes the tab):
   - Stripe: endpoint `https://YOUR-DOMAIN/api/webhooks/stripe`, event `checkout.session.completed`.
   - Paystack: webhook URL `https://YOUR-DOMAIN/api/webhooks/paystack`.
5. Deploy. In your terminal, in this folder: `npx vercel` (then `npx vercel --prod`). Add the same
   keys under Vercel > Project > Settings > Environment Variables before the production deploy.

Each key switches on one piece, so you can add them one at a time: without `ANTHROPIC_API_KEY` the
sample designer runs, without `FAL_KEY` images are gradient placeholders, without payment keys the
paywall shows but checkout is off.

## Credits and pricing

- New accounts get 2 free credits. One credit = one generation or revision. Manual edits are free.
- Pack sizes and prices live in `src/lib/config.ts` (`PACKS`). **The prices there are placeholders.**
- Rough model cost per credit: $0.25 to $0.60 (Claude about $0.10-$0.25, plus about $0.15 per AI
  image, capped at 3 images per turn). Check current fal.ai and Anthropic pricing before you set prices.
- If you change the 2 free credits, change it in both `src/lib/config.ts` and the
  `dzine_ensure_profile` SQL function.

## How it is built

| Part | Where |
| --- | --- |
| Designer prompt (the main quality lever) | `src/lib/agent/prompt.ts` |
| Agent loop, tools, streaming | `src/lib/agent/run.ts`, `tools.ts` |
| Image generation, background removal | `src/lib/agent/images.ts` |
| Layer model and validation | `src/lib/design/` |
| Live canvas renderer | `src/components/DesignCanvas.tsx` |
| Split-screen studio | `src/components/Studio.tsx`, `ChatPanel.tsx` |
| Formats and export sizes | `src/lib/ratios.ts` |
| Fonts the agent may use | `src/lib/fonts.ts` |
| Credits, Stripe, Paystack | `src/lib/payments.ts`, `src/app/api/checkout`, `src/app/api/webhooks` |
| Data access (Supabase or in-memory demo) | `src/lib/store/` |

Stack: Next.js 16 (App Router), React 19, Tailwind 4, Supabase, Anthropic API, fal.ai, Stripe, Paystack.

## Known limits of this MVP

- Export is PNG, rendered in the browser. Chrome and Edge are the tested path; Safari can be less reliable.
- Uploaded files sit in a public storage bucket under unguessable paths, so the AI models can read them by URL.
- No shared or team projects, no version history, no PDF or CMYK output yet.
- Free credits are per account. Before a public launch, keep email confirmation on (or use Google
  sign-in only) so people cannot farm free credits with throwaway addresses.
