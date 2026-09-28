# Knight Logics e-commerce

Public status for the online stores run by [Knight Logics](https://knightlogics.com). Production source code is private and does not deploy from this repository. Nothing here is store code.

| Store | Site | Stage |
|---|---|---|
| ManCaves.Store | https://mancaves.store | Live. Man cave, garage, bar, and game room goods. Ships to U.S. addresses only. Stripe Checkout. |
| Knight Jewelry | https://knightjewelry.store | Prelaunch. Site is up, crawlers are blocked, checkout is off. |

## Current status

[STATUS.md](STATUS.md) is rewritten daily at 11:15 UTC by the `Store status` GitHub Action, reading only public endpoints. Raw data is in [status/](status/). If `STATUS.md` is more than 48 hours old, the action failed; check the Actions tab.

## Verifying ManCaves.Store yourself

- `https://mancaves.store/api/store-health`: live checkout gate. `checks.verification` gives ship-to countries, the age of catalog, stock, and freight verification against the limits checkout enforces (36 hours for catalog, 192 hours for stock and freight evidence), checkout-safe variants per warehouse, and the claim window count per product.
- Checkout refuses any variant that fails those limits, so a stale number means the item cannot be bought, not that it sells on old data.
- `https://mancaves.store/sitemap.xml`, `https://mancaves.store/llms.txt`, `https://mancaves.store/llms-full.txt`, and `/products/{PRODUCT_ID}.llms.txt` per product.
- Claims and returns: each product page states its own claim window, matching the supplier's window for that product type. Most items have 30 days from delivery for damage, defect, or wrong-item claims with photos or video. Items marked supplier-handled have no set window. There are no change-of-mind returns. Policy: https://mancaves.store/policy_pages/ReturnAndRefundPolicy.html

## How ManCaves.Store runs

- Static storefront with serverless API functions. Stripe Checkout is limited to U.S. shipping addresses.
- Stock and availability are re-checked daily. Out-of-stock or no-longer-shippable variants are hidden automatically. New products are added weekly in small batches.
- Every catalog change regenerates product pages, structured data, the sitemap, and the llms files, then runs consistency checks before publishing. Publishing stops if a check fails.
- Paid orders are recorded from the Stripe webhook. Each supplier purchase is approved by a person.

## Knight Jewelry

Prelaunch storefront. Checkout stays off and `robots.txt` blocks crawlers until launch. `STATUS.md` shows the change when that happens.

## Legacy prototype

The March 2026 Snipcart prototype that used to be on `main` is preserved on the [`legacy-snipcart-2026-03`](https://github.com/Nicholasjknight/E-Commerce-Store/tree/legacy-snipcart-2026-03) branch. It is not what runs on either live site. Do not audit the stores from it.

## For automated auditors

- Read `STATUS.md` and `status/*.json` first. They are the newest facts in this repository.
- Treat the live `store-health` endpoint and the live pages as the source of truth. This repository only mirrors them.
- Do not infer current store behavior, pricing, or checkout from the legacy branch.
