// JSON-LD_breadcrumbs.js

// Function to inject JSON-LD structured data
function addJsonLd(jsonData) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonData);
    document.head.appendChild(script);
}

// Breadcrumbs JSON-LD generation
function generateBreadcrumbJsonLd(trail) {
    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": trail.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url,
        })),
    };
    addJsonLd(breadcrumbJsonLd);
}

// Open Graph and Twitter metadata injection
function addSocialMediaMetadata(data) {
    const metaTags = {
        "og:title": data.title,
        "og:description": data.description,
        "og:image": data.image,
        "og:url": data.url,
        "twitter:card": "summary_large_image",
        "twitter:title": data.title,
        "twitter:description": data.description,
        "twitter:image": data.image,
    };

    Object.entries(metaTags).forEach(([property, content]) => {
        let meta = document.querySelector(`meta[property='${property}'], meta[name='${property}']`);
        if (!meta) {
            meta = document.createElement('meta');
            if (property.startsWith('og:')) meta.setAttribute('property', property);
            else meta.setAttribute('name', property);
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    });
}

// Dynamic breadcrumb rendering
function updateBreadcrumbs(trail) {
    const breadcrumbContainer = document.querySelector(".breadcrumb");
    if (breadcrumbContainer) {
        breadcrumbContainer.innerHTML = trail.map((crumb, index) => {
            return index === trail.length - 1
                ? `<li class='breadcrumb-item active' aria-current='page'>${crumb.name}</li>`
                : `<li class='breadcrumb-item'><a href='${crumb.url}'>${crumb.name}</a></li>`;
        }).join('');
        generateBreadcrumbJsonLd(trail); // Add JSON-LD breadcrumbs
    }
}

// Example metadata for the current page
const pageMetadata = {
    title: "Man Kave - Home",
    description: "Discover unique products to elevate your space. Shop at Man Kave for curated collections of tech, furniture, and more!",
    image: "https://mankave.store/images/ManCavesLogo.png",
    url: window.location.href,
};
addSocialMediaMetadata(pageMetadata);

// Example breadcrumb trail based on page URL
const breadcrumbMap = {
    "/index.html": { name: "Home", parent: null },
    "/catalog.html": { name: "All Products", parent: "/index.html" },
    "/collection_pages/tech_gadgets.html": { name: "Tech Gadgets", parent: "/catalog.html" },
    "/collection_pages/furniture.html": { name: "Furniture", parent: "/catalog.html" },
};

const currentPath = window.location.pathname.replace(/\/$/, "");
const breadcrumbTrail = [];
let current = breadcrumbMap[currentPath];

while (current) {
    breadcrumbTrail.unshift({
        name: current.name,
        url: currentPath,
    });
    current = breadcrumbMap[current.parent];
}
updateBreadcrumbs(breadcrumbTrail);

// Utility: Add structured data for organization
const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Man Kave",
    "url": "https://mankave.store",
    "logo": "https://mankave.store/images/ManCavesLogo.png",
    "contactPoint": [
        {
            "@type": "ContactPoint",
            "telephone": "+1-813-649-3341",
            "contactType": "Customer Service",
            "areaServed": "US",
            "availableLanguage": "English",
        },
    ],
};
addJsonLd(organizationSchema);

// Additional structured data for product pages (if applicable)
if (currentPath.includes("product")) {
    fetch('/updated_products.json')
        .then(response => response.json())
        .then(products => {
            const product = products.find(p => p.offers.some(o => o.handle === new URLSearchParams(window.location.search).get('handle')));
            if (product) {
                const productJsonLd = {
                    "@context": "https://schema.org",
                    "@type": "Product",
                    "name": product.name,
                    "image": product.image,
                    "description": product.description,
                    "category": product.category,
                    "offers": {
                        "@type": "Offer",
                        "priceCurrency": product.offers[0].priceCurrency,
                        "price": product.offers[0].price,
                        "availability": product.offers[0].availability,
                        "url": window.location.href,
                    },
                };
                addJsonLd(productJsonLd);
            }
        });
}
