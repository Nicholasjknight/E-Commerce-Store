# E-Commerce Store

This repository is a legacy e-commerce storefront prototype built around a static front end, product data files, and Snipcart-based cart/checkout behavior.

## Current Status

This is best treated as a prototype and portfolio case study rather than a primary Knight Logics production product.

## What It Does

The project implements a storefront flow with:

- catalog and product listing pages
- product detail pages with variant handling
- JSON- and CSV-driven product data
- Snipcart cart integration
- recommendation sections using local storage history
- Vercel deployment configuration

## Technical Notes

The repository currently includes:

- storefront pages in HTML/CSS/JavaScript
- data files such as `updated_products.json` and `updated_products.csv`
- dynamic rendering logic in `render_products.js`, `product_page.js`, and `search.js`
- policy and collection pages
- deployment config via `vercel.json`

## Why It Matters

Even as a legacy prototype, this repo is useful as a case study for:

- storefront UX implementation
- data-driven front-end rendering
- lightweight commerce integrations
- product catalog architecture without a full custom backend

## Local Development

Serve the project locally with a static server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deployment

The repository includes Vercel configuration and can be deployed as a static storefront with client-side product rendering.

## Recommended Positioning

Use this as a legacy commerce prototype in GitHub and Upwork narratives, not as a flagship Knight Logics product.

## License

No additional license beyond repository terms.