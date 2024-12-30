export async function loadProducts(filePath = '/updated_products.json') {
    console.log(`Loading products from: ${filePath}`);
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Failed to load product data from ${filePath}`);
        const data = await response.json();
        console.log('Products Loaded Successfully:', data);
        return data;
    } catch (error) {
        console.error('Error loading product data:', error);
        return [];
    }
}

export function renderHeaderImages() {
    console.log('Rendering Header Images');

    // Man Kave logo
    const logo = document.querySelector('.logo img');
    if (logo) {
        logo.src = '/images/Man Kave Text.png';
        console.log('Set logo image path:', logo.src);
    } else {
        console.warn('Logo image element not found.');
    }

    // Empty cart icon
    const emptyCart = document.querySelector('.cart-icon.empty img');
    if (emptyCart) {
        emptyCart.src = '/images/emptycart.png';
        console.log('Set empty cart image path:', emptyCart.src);
    } else {
        console.warn('Empty cart icon element not found.');
    }

    // Full cart icon
    const fullCart = document.querySelector('.cart-icon.full img');
    if (fullCart) {
        fullCart.src = '/images/fullcart.png';
        console.log('Set full cart image path:', fullCart.src);
    } else {
        console.warn('Full cart icon element not found.');
    }
}

export function renderProducts(productList, containerId, options = {}) {
    console.log('Rendering Products to Container:', containerId);
    const container = document.getElementById(containerId);

    if (!container) {
        console.warn(`Container with ID "${containerId}" not found.`);
        return;
    }

    container.innerHTML = ''; // Clear previous content

    productList.forEach((product) => {
        const { name, description, image, offers } = product;
        console.log('Rendering Product:', product);

        // Ensure correct product image path
        const firstImage = image && image[0] ? `/${image[0]}` : '/images/placeholder.jpg';
        console.log(`Resolved Product Image Path: ${firstImage}`);

        const price = offers?.[0]?.price
            ? `$${offers[0].price.toFixed(2)}`
            : 'Price Unavailable';
        const handle = offers?.[0]?.handle || '';

        // Create the product card
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        productCard.innerHTML = `
            <img src="${firstImage}" alt="${name || 'Product Image'}" class="product-image" />
            <h3 class="product-title">${name || 'Unnamed Product'}</h3>
            <p class="product-description">${description || 'No description available'}</p>
            <p class="product-price">${price}</p>
        `;

        productCard.addEventListener('click', () => {
            console.log(`Redirecting to Product Page: /product_page.html?handle=${handle}`);
            window.location.href = `/product_page.html?handle=${handle}`;
        });

        container.appendChild(productCard);
    });
    console.log('Finished Rendering Products');
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('policy-page')) {
        console.log('Policy page detected. Skipping product and cart logic.');
        return;
    }

    // Initialize cart and product-related logic
    initializeCartUI();
    loadPurchasedOrCartItems();

    // Product JSON-LD Injection (handled by JSON-LD_breadcrumbs.js for consistency)
});
