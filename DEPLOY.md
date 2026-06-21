# Deploying the portfolio + contact form (Vercel + Resend)

The contact form posts to a serverless function (`api/contact.js`) that sends
email through **Resend**. The Resend API key is read from an environment
variable and is never in the front-end code.

## One-time setup

1. **Push this repo to GitHub** (already done: `github.com/itssbman/Portfolio`).

2. **Import the repo into Vercel**
   - Go to https://vercel.com/new → "Import Git Repository" → select `Portfolio`.
   - Framework Preset: **Other** (it's a static site + an `api/` function).
   - Click **Deploy**.

3. **Add your Resend API key as an environment variable**
   - In the Vercel project: **Settings → Environment Variables**.
   - Name: `RESEND_API_KEY`
   - Value: your key from https://resend.com/api-keys (starts with `re_`)
   - Apply to: Production (and Preview if you want).
   - **Redeploy** so the new variable takes effect (Deployments → ⋯ → Redeploy).

4. **Test** the live form. The message arrives at `nnabrianeze@gmail.com`.

## Important: deliverability without a custom domain

Because no custom domain is verified in Resend yet, two rules apply:

- Mail is sent **from** `onboarding@resend.dev` (set in `api/contact.js`).
- Resend will **only deliver to the email address your Resend account is
  registered with.** So make sure your Resend account uses
  **nnabrianeze@gmail.com**, since that's where contact messages go.

When you're ready for the best inbox placement and a from-address on your own
domain, verify a domain in Resend (Domains → Add Domain → add the DNS records),
then change `FROM_EMAIL` in `api/contact.js` to e.g. `Nnamdi <hello@yourdomain.com>`.

## Where to change things

- **Recipient address:** `TO_EMAIL` in `api/contact.js`
- **From address:** `FROM_EMAIL` in `api/contact.js`
- **Email design:** the `renderEmail()` function in `api/contact.js`
