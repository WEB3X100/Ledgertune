# NeuralSync BPO landing

NeuralSync remote accounting offer, prepared for a supervised Netlify launch.

## What this page is for

- Build trust around NeuralSync remote accounting.
- Show the service ladder: bookkeeping, reporting, tax coordination, remote staff, with FP&A held as an expansion.
- A transparent fit-check section replaces testimonials until approved customer proof exists.
- Two-row integrations marquee (stack we implement, not partner logos).
- Convert to a contact form for a free 30-minute consultation.

## Run locally

```bash
npm start
```

Opens on `http://localhost:4173`.

## Netlify

The production site is a static deployment from `public/`; no paid server or build step is required.

```bash
npx netlify deploy --prod --dir=public
```

`netlify.toml` pins the publish directory and basic security headers. The deployed form is a Netlify contact form named `consultation`. Primary CTAs scroll to `#inquiry` and submit a free 30-minute consultation request.

## Replit (optional local/server deployment)

1. Upload this `landing/` folder as the Replit project root.
2. Click Run. `package.json` and `.replit` already start `node server.js`.
3. Publish as the account's one free app. Replit may add its Starter badge and the free deployment may need periodic re-publishing.
4. Add `?review=1` to the URL when the team needs the local-only review controls.

## Team amendments

| What to change | Where |
| --- | --- |
| Copy | `public/index.html` |
| Brand atmosphere | `public/styles.css` |
| Consultation form fields | `public/app.js` |
| Approved testimonials | Add them only after names, quotes, faces, and logos are approved. |
| Show review controls | Add `?review=1`; they are visible automatically on localhost |

Local preview stores consultation requests in `data/leads.jsonl`. Netlify production uses the `consultation` form. There is no WhatsApp send path.

## Boundaries

- Public review deployment. `noindex` remains until the final domain and proof review are approved.
- No pricing dollar claims.
- No invented clients, logos, quotes, savings, headcount, or partnership language.
- Generated images are illustrative.
- `neuralsync.ca` and `info@neuralsync.ca` came from the NeuralSync site config. Verify before public use.
