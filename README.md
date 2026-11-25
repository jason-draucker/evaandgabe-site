# Eva & Gabe — evaandgabe.com prototype

A family communication site for Jason Draucker's kids, Eva and Gabe. This is **variation two**: a tab for each kid with a calendar and money-request buttons, plus a shared photo strip and wish list.

Built Tuesday, November 24, 2026 (America/Denver). This folder is a local prototype only. The site has **not** been deployed, and no real text or email was sent while it was built.

Domain: evaandgabe.com (already purchased). Do not buy anything else for this prototype.

## What's in this folder

- `index.html`, `styles.css`, `app.js` — the website
- `server.js`, `package.json` — optional Node/Express backend
- `data/events.json` — calendars (edit this file to change events)
- `data/wishlist.json` — starter wish list
- `images/photo-1.svg` … `photo-4.svg` — photo-strip placeholders; replace these files with real photos (keep the same names, or update the `<img>` tags)
- `render.yaml` — Render blueprint for later (a free static site, plus an optional web service)
- `.env.example` — names of the keys the API can use (no secret values)
- `preview.png`, `preview-desktop.png`, `preview-mobile.png` — screenshots of the local build
- `README.md` — this file

## What works in the demo (no keys needed)

Open `index.html` in a browser, or run the server without environment variables. Either way:

- Eva and Gabe tabs
- Month calendar and upcoming list, loaded from `data/events.json`
- Example events, clearly labeled
- Preset buttons ($5, $10, $20, $50) and a typed request field. Button labels stay “Dad, I need $5” (and $10, $20, $50). The text Jason receives is “Eva wants five dollars (via evaandgabe.com)” or “Gabe wants twenty dollars (via evaandgabe.com)” — amounts are spelled out as five, ten, twenty, or fifty.
- TCPA consent checkbox on the request form (separate, unchecked until someone checks it; required before a send)
- Confirmations such as: Demo: would text Dad: "Eva wants ten dollars (via evaandgabe.com)". Or “Demo: would email Dad.” Nothing is actually sent.
- Family photo strip (placeholders)
- Wish list with statuses Wanted, On the way, and Got
- Parent tools behind a PIN, so Jason can change statuses or add items
- Wish list changes are saved in `localStorage` when the backend is not available

Prototype parent PIN: `2468`. Change this before any real use (see `ADMIN_PIN` below). This is a clearly documented demo PIN, not a production secret.

## What needs keys for live sending

The backend only sends a real **text** when the Twilio keys are set **and** `DEMO_ONLY` is not `1`. Texts stay simulated whenever `DEMO_ONLY` is on, even if `EMAIL_LIVE` is on.

Email can go live in two ways:

- `DEMO_ONLY` is not `1`, and `JASON_EMAIL` plus a provider (`RESEND_API_KEY`, `SENDGRID_API_KEY`, or SMTP) are set; or
- `EMAIL_LIVE=1` and `RESEND_API_KEY` and `JASON_EMAIL` are set, even if `DEMO_ONLY=1`.

Live email covers the Ask Dad note (`/api/request-email`, sent to `JASON_EMAIL`), calendar submissions (`/api/calendar-request`, sent to `CALENDAR_INBOX`, and still added to the calendar), and Customize / 24-hour change ideas (`/api/suggestion`, sent to `SUGGESTIONS_INBOX` or `PIPER_EMAIL`). The From address is `SMTP_FROM`, or `Eva and Gabe <noreply@evaandgabe.com>` if that is unset. If a live send fails, the API returns an error and does not claim success.

### Texts (preset money buttons) — Twilio

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM` (the Twilio number that sends the text)
- `JASON_CELL` (Jason's cell number, used only on the server — it is never shown on the website)

A Twilio number usually also needs A2P / 10DLC registration before it can text a US number reliably.

### Email (typed requests)

Set `JASON_EMAIL`, then one of:

- `RESEND_API_KEY`, or
- `SENDGRID_API_KEY`, or
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`

### Other optional keys

- `ADMIN_PIN` — parent-tools PIN (defaults to the prototype PIN above if unset)
- `DEMO_ONLY=1` — keep texts (and email, unless `EMAIL_LIVE` is also on) in demo mode even if other keys are present
- `EMAIL_LIVE=1` — allow real email when `RESEND_API_KEY` and `JASON_EMAIL` are set, even if `DEMO_ONLY=1`. Does not enable texts.
- `CALENDAR_INBOX` — where calendar form submissions are emailed (default: `calendar@evaandgabe.com`)
- `PIPER_EMAIL` / `SUGGESTIONS_INBOX` — where Customize and 24-hour change ideas are emailed (default: `piper@evaandgabe.com`)
- `SMTP_FROM` — From address for outgoing mail (default: `Eva and Gabe <noreply@evaandgabe.com>`)
- `PORT` — server port (defaults to 3000)

Never put secret values in this README, in screenshots, or in client-side code. The website does not display a phone number or any pricing.

## Run it locally

```bash
cd evaandgabe-site
npm install
npm start
```

Then open http://127.0.0.1:3000/

To run the API tests (they mock outbound email and never send a real message):

```bash
npm test
```

To try only the static demo, skip the server and open `index.html`, or run:

```bash
python3 -m http.server 8080
```

## How to edit events and photos

- Events: edit `data/events.json`. Each event has `id`, `kid` (`eva`, `gabe`, or `both`), `date` (`YYYY-MM-DD`), optional `time`, `title`, and `note`. Keep the word `EXAMPLE:` at the start of a title until it is a real event.
- Wish list seed: edit `data/wishlist.json`. If the server is running, later edits are stored in `data/wishlist-store.json` (ignored by git).
- Photos: replace `images/photo-1.svg` through `images/photo-4.svg` with real images, or change the `src` in `index.html`.

## Deploy later (do not do this until Jason says so)

1. Put this project in a GitHub repository (or similar) that Render can access.
2. On Render, create a **static site** from the repo, using the `staticSites` entry in `render.yaml`. Static sites are free. This is enough for the demo website. Requests will stay in demo mode until the API is also hosted.
3. Optional: create the `evaandgabe-api` web service from the same blueprint and add the keys listed in `.env.example` in the Render dashboard. Do not paste keys into the repo.
4. Point evaandgabe.com (Porkbun DNS) at the Render static site, and — if the API is used — configure the frontend to call that API origin (today the frontend calls same-origin `/api/…`).
5. After a real deploy, change `ADMIN_PIN` and add real events and photos.

The website shows no public phone number and no pricing. Mesa owns design; this prototype uses the same warm ivory and terracotta look as the earlier Eva & Gabe page, made more kid-friendly and mobile-first. Send finished mock-ups to Mesa for her files.

## What's next

- Put the project in a GitHub repo so it can be deployed on Render
- Confirm Twilio keys, A2P / 10DLC, and a from-number before any live texts
- Add a Resend or SendGrid key (or SMTP) and `JASON_EMAIL` before any live emails
- Change the parent PIN
- Point Porkbun DNS for evaandgabe.com at Render when Jason is ready to go live
- Swap in real photos and real calendar events
- Mesa review of the design

## Added on this build (still local-only)

- **Dad Updates** (same list on both tabs): date plus the message, no subject line and no click-to-expand. The top entry on November 24, 2026 is the SatBuddy request, with the sat-buddy picture, the $100 Apple Pay wording (display text only — the site never processes a payment or sends money), and the deadline **SatBuddy needed by 10 PM tonight** (America/Denver).
- **Claim / complete:** a kid can Claim an unclaimed request. The claim message is: “You have claimed this task. SatBuddy is needed by 10 PM tonight.” Both tabs show who claimed it and the time left until 10 PM. Only the claimer can Mark done. A parent PIN check then records “Completed: SatBuddy — Money sent to Eva/Gabe.” That money line is status text only. If the deadline passes without a PIN check, the claim expires and either kid can grab it. Demo buttons under the shared completion record can end a claim early or reset tasks.
- **Customize** and **24 hour change to website** buttons (styled to each tab). Customize asks: “What else would you like to customize on your website?” The 24-hour button asks: “Please describe in detail how you would like to change this website.” Submissions are tagged Eva or Gabe and are meant for `piper@evaandgabe.com` (Porkbun free forwarding already set up). They do **not** go to the calendar inbox. In demo mode, nothing is actually emailed.
- **Calendar request form** on each tab: type a date and a note, submit, and it goes to the shared calendar inbox (`calendar@evaandgabe.com` placeholder). The prototype then adds the entry to that kid’s calendar after a short delay. There is no Google sign-in.
- **Private calendar logins** (backup links in the footer): `/kid/eva?token=…` and `/kid/gabe?token=…`. Documented demo tokens, used only when `EVA_TOKEN` / `GABE_TOKEN` are unset: `eva-local-demo` and `gabe-local-demo`. A missing or wrong token is rejected, and a kid can add, edit, or delete only their own events. Tokens are never logged, and the token is stripped from the address bar after the page loads.
- **Email-fed updates:** `POST /api/inbound-email` (token in the JSON body or `X-Inbound-Token` header). Documented demo token if `INBOUND_EMAIL_TOKEN` is unset: `inbound-local-demo`. In production, point Postmark, SendGrid Inbound Parse, or Mailgun at this endpoint and send the raw message text. Only the date and the message are shown on the site.
- **Looks:** Eva has four floral looks (default: blush roses). Gabe has four original game-style looks (default: dark blue/black). These are original drawings and colors, not official PlayStation marks. Use “Try another look” to compare.

Payment reminder: Apple Pay wording and “Money sent to Eva/Gabe” are display-only. The prototype does not charge, send money, or talk to Apple Pay.

Review screenshots: `review-eva.png`, `review-gabe.png`, and `review-claimed.png`.
