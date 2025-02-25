// Define initializeThemeToggle globally
function initializeThemeToggle() {
    const themeToggle = document.getElementById("theme-toggle");

    if (!themeToggle) {
        console.warn("Theme toggle button not found. Skipping initialization.");
        return;
    }

    // Apply the saved theme
    const currentTheme = localStorage.getItem("theme") || "light";
    document.body.classList.toggle("dark-mode", currentTheme === "dark");
    themeToggle.textContent = currentTheme === "dark" ? "Light Mode" : "Dark Mode";

    // Toggle theme on button click
    themeToggle.addEventListener("click", () => {
        const isDarkMode = document.body.classList.toggle("dark-mode");
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
        themeToggle.textContent = isDarkMode ? "Light Mode" : "Dark Mode";
    });
}

// Ensure Snipcart updates the cart count correctly
function waitForSnipcart() {
    if (window.Snipcart && window.Snipcart.store) {
        console.log("Snipcart is already loaded. Initializing UI.");
        initializeCartUI();
    } else {
        document.addEventListener("snipcart.ready", () => {
            console.log("Snipcart is fully initialized!");
            initializeCartUI();
        });
    }
}

// Run immediately in case Snipcart is already ready
setTimeout(waitForSnipcart, 500);

// Wrap remaining logic in DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("script.js initialized.");

    // Handle Sign In Link
    const signInLink = document.getElementById("signInLink");
    if (signInLink) {
        signInLink.addEventListener("click", (event) => {
            event.preventDefault();
            if (localStorage.getItem("isLoggedIn") === "true") {
                alert("You have been signed out.");
                localStorage.setItem("isLoggedIn", "false");
                signInLink.textContent = "Sign In";
            } else {
                openModal("loginModal");
            }
        });
    } else {
        console.warn("Sign In link not found.");
    }

    // Observe dynamically loaded header or handle static header
    const headerPlaceholder = document.getElementById("header-placeholder");
    if (headerPlaceholder) {
        const observer = new MutationObserver(() => {
            const themeToggle = document.getElementById("theme-toggle");
            if (themeToggle) {
                initializeThemeToggle();
                observer.disconnect();
            }
        });
        observer.observe(headerPlaceholder, { childList: true });
    } else {
        // Fallback for static headers
        const themeToggle = document.getElementById("theme-toggle");
        if (themeToggle) {
            initializeThemeToggle();
        }
    }

    // Existing slideshow logic
    let currentIndex = 0;
    const images = document.querySelectorAll(".slideshow img");
    if (images.length) {
        function showNextImage() {
            images.forEach((img, index) =>
                img.classList.toggle("visible", index === currentIndex)
            );
            currentIndex = (currentIndex + 1) % images.length;
        }

        setInterval(showNextImage, 5000);
        showNextImage();
    }
});

// Sidebar Toggle with Safeguard
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
        sidebar.classList.toggle("active");
    } else {
        console.warn("Sidebar element is not available on the page.");
    }
}

// Snipcart Cart UI Update
function initializeCartUI() {
    const cartIcon = document.getElementById("cartIcon");
    const cartCountElement = document.getElementById("cartCount");

    function updateCartUI() {
        if (window.Snipcart && window.Snipcart.store) {
            const cartState = window.Snipcart.store.getState().cart || {};
            const itemCount = cartState.items?.count || 0;

            if (cartCountElement) cartCountElement.textContent = itemCount;
            if (cartIcon) {
                cartIcon.src = itemCount > 0 ? "/images/fullcart.png" : "/images/emptycart.png";
                cartIcon.alt = itemCount > 0 ? "Full Cart" : "Empty Cart";
            }
        }
    }

    if (window.Snipcart && window.Snipcart.store) {
        window.Snipcart.store.subscribe(updateCartUI);
        updateCartUI();
    }
}

// Ensure Snipcart updates the cart count correctly
document.addEventListener("snipcart.ready", () => {
    console.log("Snipcart is fully initialized!");
    initializeCartUI();

    window.Snipcart.events.on("cart.confirmed", initializeCartUI);
    window.Snipcart.events.on("cart.closed", initializeCartUI);
    window.Snipcart.events.on("item.added", initializeCartUI);
    window.Snipcart.events.on("item.updated", initializeCartUI);
    window.Snipcart.events.on("item.removed", initializeCartUI);
});

function loadPurchasedOrCartItems() {
    const purchasedSection = document.querySelector('#customer-interest .product-grid');

    if (!purchasedSection) {
        console.warn("'#customer-interest' or '.product-grid' not found. Skipping purchase history load.");
        return;
    }

    const purchasedProducts = JSON.parse(localStorage.getItem('purchasedProducts') || '[]');
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');

    const uniqueHandles = [...new Set([...purchasedProducts, ...cartItems])];
    if (uniqueHandles.length === 0) {
        renderNoProductHistory(purchasedSection);
        return;
    }

    fetch('updated_products.json')
        .then((response) => response.json())
        .then((products) => {
            const matchingProducts = products.filter((product) =>
                product.offers.some((offer) => uniqueHandles.includes(offer.handle))
            );

            const productsToShow = matchingProducts.slice(0, 3);
            if (productsToShow.length > 0) {
                renderProducts(productsToShow, purchasedSection);
            } else {
                renderNoProductHistory(purchasedSection);
            }
        })
        .catch((error) => {
            console.error('Error loading product data:', error);
            renderNoProductHistory(purchasedSection);
        });
}

function renderNoProductHistory(container) {
    if (!container) {
        console.warn("Container for rendering no product history is not defined.");
        return;
    }
    container.innerHTML = `
        <div class="no-history">
            <p>No products found in your purchase or cart history.</p>
        </div>
    `;
}

function renderProducts(productList, container) {
    if (!container) {
        console.warn("Container for rendering products is not defined.");
        return;
    }

    container.innerHTML = ''; // Clear the container

    productList.forEach(product => {
        const { name, description, image, offers } = product;

        if (!name || !description || !image?.length || !offers?.length) {
            console.warn("Skipping product due to missing required fields.");
            return;
        }

        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        const firstImage = image[0];
        const { price, handle } = offers[0];

        productCard.innerHTML = `
            <img src="${firstImage}" alt="${name}" class="product-image" />
            <h3 class="product-title">${name}</h3>
            <p class="product-description">${description}</p>
            <p class="product-price">$${price.toFixed(2)}</p>
        `;

        // Click-to-Redirect
        productCard.addEventListener('click', () => {
            window.location.href = `product_page.html?handle=${handle}`;
        });

        container.appendChild(productCard);
    });
}

// Safely Initialize Scripts
document.addEventListener("snipcart.ready", () => {
    console.log("Snipcart is ready. Initializing UI updates and product history.");
    initializeCartUI();
    loadPurchasedOrCartItems();
});
