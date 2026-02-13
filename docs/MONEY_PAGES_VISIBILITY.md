# Pros and cons of hiding Money pages

Brief tradeoffs for hiding or de-emphasizing Cami Money–related pages (e.g. `/cami-money`, `/services/cami-money-aegr.html`, Money in nav and app).

---

## Pros of hiding Money pages

- **Clearer positioning** — Site reads as “Human Service AI” (legal, health, research, tutor, customer service) without a separate “Money” product that may still be early or invite regulatory scrutiny.
- **Less compliance surface** — Fewer public claims about financial capabilities; easier to say “we’re not a financial advisor / broker” when Money isn’t front-and-center.
- **Simpler nav and onboarding** — Fewer items in header/sidebar and in the app mode list; less cognitive load for users who only care about non-financial services.
- **Controlled rollout** — You can keep Money for specific users (e.g. invite-only, enterprise, or post-signup) without promoting it on the main site.
- **Brand focus** — Emphasizes Law, Health, Research, Tutor, Human+, M.I.N. and avoids diluting the “human service” message with a distinct financial product.

---

## Cons of hiding Money pages

- **Less discoverability** — Prospects and partners who care about Money (AEGR, rails, integrations) may not find it unless they already know the URL or get a direct link.
- **Inconsistent experience** — Money still exists in app (Cami Money mode), dashboard copy, and possibly entitlements; hiding only the marketing/landing pages can feel half-done unless the product is explicitly “unlisted.”
- **SEO and links** — Existing links to `/cami-money` or service pages would 404 or redirect; you’d need a clear redirect or “coming soon” strategy and to update sitemap/nav everywhere.
- **Signals “not ready”** — Hiding can read as “we’re not confident in this product yet,” which might be fine for a soft launch but can affect enterprise or partner trust if they expect a full public offering.
- **Duplicate maintenance** — If you hide from nav but keep pages live, you have to remember to exclude Money from nav/footer/app in many places (index, dashboard, service pages, app.html, etc.) and keep that consistent.

---

## Summary

- **Hide** if you want a cleaner, lower-risk public story and are okay with Money being invite-only or discovered via direct links/docs.
- **Keep visible** if Money is a first-class product you want to sell and discoverable; then keep compliance language (e.g. “not a financial advisor”) clear everywhere Money appears.
- **Middle ground** — Keep one Money landing page and link from footer or “Products” only (not main nav), or show Money only after login in the app/dashboard so the public site stays focused.
