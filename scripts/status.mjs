// Writes status/*.json and STATUS.md from public store endpoints only. No secrets.
import { mkdir, writeFile } from "node:fs/promises";

const UA = { "User-Agent": "KnightLogicsStatus/1.0 (+https://github.com/Nicholasjknight/E-Commerce-Store)" };

async function get(url) {
    try {
        const res = await fetch(url, { headers: UA, redirect: "manual", signal: AbortSignal.timeout(30000) });
        return { status: res.status, location: res.headers.get("location") || "", text: await res.text() };
    } catch (error) {
        return { status: 0, location: "", text: String(error) };
    }
}

function json(text) {
    try {
        return JSON.parse(text);
    } catch {
        return {};
    }
}

const locCount = (xml) => (xml.match(/<loc>/g) || []).length;

async function mancaves(checkedAt) {
    const health = await get("https://mancaves.store/api/store-health");
    const body = json(health.text);
    const checks = body.checks || {};
    const sitemap = await get("https://mancaves.store/sitemap.xml");
    const www = await get("https://www.mancaves.store/");
    return {
        store: "ManCaves.Store",
        url: "https://mancaves.store/",
        checkedAt,
        health: {
            status: health.status,
            ok: Boolean(body.ok),
            salesReady: Boolean(body.salesReady),
            checkoutEnabled: Boolean(checks.checkoutEnabled),
            build: checks.build || null,
        },
        catalog: {
            products: checks.catalogCount ?? null,
            variants: checks.variantCount ?? null,
            checkoutSafeVariants: checks.checkoutSafeVariants ?? null,
            checkoutBlockedVariants: checks.checkoutBlockedVariants ?? null,
            blockedReasons: checks.blockedReasons || {},
            evidenceReady: Boolean(checks.catalogEvidenceReady),
        },
        verification: checks.verification || null,
        crawl: {
            sitemapStatus: sitemap.status,
            sitemapUrls: sitemap.status === 200 ? locCount(sitemap.text) : null,
            wwwRedirect: `${www.status} ${www.location}`.trim(),
        },
    };
}

async function knightJewelry(checkedAt) {
    const home = await get("https://knightjewelry.store/");
    const robots = await get("https://knightjewelry.store/robots.txt");
    const sitemap = await get("https://knightjewelry.store/sitemap.xml");
    const blocksAll = /^\s*Disallow:\s*\/\s*$/im.test(robots.text);
    const title = (home.text.match(/<title>([^<]*)<\/title>/i) || [])[1] || null;
    return {
        store: "Knight Jewelry",
        url: "https://knightjewelry.store/",
        checkedAt,
        stage: blocksAll ? "prelaunch" : "indexable",
        home: { status: home.status, title },
        crawl: {
            robotsBlocksAll: blocksAll,
            sitemapStatus: sitemap.status,
            sitemapUrls: sitemap.status === 200 ? locCount(sitemap.text) : null,
        },
    };
}

const age = (range, limit) =>
    range && range.oldestAgeHours != null
        ? `${range.oldestAgeHours}h oldest (limit ${limit}h) ${range.oldestAgeHours <= limit ? "ok" : "STALE"}`
        : "n/a";

function markdown(mc, kj) {
    const v = mc.verification || {};
    const warehouses = Object.entries(v.checkoutSafeByWarehouse || {})
        .map(([code, n]) => `${code} ${n}`)
        .join(", ");
    const claims = Object.entries(v.claimWindows || {})
        .map(([key, n]) => `${key === "supplierHandled" ? "supplier-handled (no set window)" : key} ${n}`)
        .join(", ");
    return [
        "# Store status",
        "",
        `Checked ${mc.checkedAt} by GitHub Actions from public endpoints. Raw data: [status/](status/).`,
        "",
        "## ManCaves.Store",
        "",
        "| Check | Value |",
        "|---|---|",
        `| Health | HTTP ${mc.health.status}, ok=${mc.health.ok}, salesReady=${mc.health.salesReady}, checkout=${mc.health.checkoutEnabled ? "on" : "off"}, build ${mc.health.build} |`,
        `| Catalog | ${mc.catalog.products} products, ${mc.catalog.variants} variants, ${mc.catalog.checkoutSafeVariants} checkout-safe, ${mc.catalog.checkoutBlockedVariants} blocked |`,
        `| Ships to | ${(v.shipsTo || []).join(", ") || "n/a"} |`,
        `| Catalog verified | ${age(v.catalogVerified, v.catalogMaxAgeHours)} |`,
        `| Stock verified | ${age(v.stockVerified, v.evidenceMaxAgeHours)} |`,
        `| Freight verified | ${age(v.freightVerified, v.evidenceMaxAgeHours)} |`,
        `| Checkout-safe variants by warehouse | ${warehouses || "n/a"} |`,
        `| Lowest checkout-safe stock | ${v.lowestCheckoutSafeStock ?? "n/a"} |`,
        `| Claim windows (products) | ${claims || "n/a"} |`,
        `| Claim windows verified | ${age(v.claimWindowVerified, 720)} |`,
        `| Sitemap | HTTP ${mc.crawl.sitemapStatus}, ${mc.crawl.sitemapUrls} URLs |`,
        `| www host | ${mc.crawl.wwwRedirect} |`,
        "",
        "## Knight Jewelry",
        "",
        "| Check | Value |",
        "|---|---|",
        `| Stage | ${kj.stage} |`,
        `| Home | HTTP ${kj.home.status}, "${kj.home.title}" |`,
        `| robots.txt blocks all crawlers | ${kj.crawl.robotsBlocksAll} |`,
        `| Sitemap | HTTP ${kj.crawl.sitemapStatus}, ${kj.crawl.sitemapUrls} URLs |`,
        "",
    ].join("\n");
}

const checkedAt = new Date().toISOString();
const [mc, kj] = await Promise.all([mancaves(checkedAt), knightJewelry(checkedAt)]);
await mkdir("status", { recursive: true });
await writeFile("status/mancaves.json", JSON.stringify(mc, null, 2) + "\n");
await writeFile("status/knightjewelry.json", JSON.stringify(kj, null, 2) + "\n");
await writeFile("STATUS.md", markdown(mc, kj));
console.log(JSON.stringify({ mancavesOk: mc.health.ok, knightJewelry: kj.stage }));
if (!mc.health.ok) process.exitCode = 1;
