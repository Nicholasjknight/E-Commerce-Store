document.addEventListener("DOMContentLoaded", () => {
    function initializeSearch() {
        const searchInput = document.querySelector(".search-input");
        const searchForm = document.querySelector(".search-form");

        if (!searchInput || !searchForm) {
            console.warn("Search input or form not found. Retrying...");
            setTimeout(initializeSearch, 500); // Retry in 500ms
            return;
        }

        console.log("✅ Search bar detected. Initializing search functionality.");

        // Dynamically create the search results container
        const searchResultsContainer = document.createElement("div");
        searchResultsContainer.className = "search-results";
        document.body.appendChild(searchResultsContainer);

        let productsData = [];

        // Load product data from JSON file
        fetch("/updated_products.json")
            .then((response) => response.json())
            .then((data) => {
                productsData = data;
            })
            .catch((error) => console.error("Error loading product data:", error));

        // Show search results container when typing
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase().trim();
            if (!query) {
                searchResultsContainer.innerHTML = "";
                searchResultsContainer.classList.remove("active");
                return;
            }

            searchResultsContainer.classList.add("active");
            const matchingProducts = productsData.filter((product) =>
                product.name.toLowerCase().includes(query) ||
                product.description.toLowerCase().includes(query)
            );

            renderSearchResults(matchingProducts, query);
        });

        // Hide results when input loses focus
        searchInput.addEventListener("blur", () => {
            setTimeout(() => {
                searchResultsContainer.classList.remove("active");
            }, 200);
        });

        // Function to render search results
        function renderSearchResults(products, query) {
            searchResultsContainer.innerHTML = "";

            if (products.length === 0) {
                searchResultsContainer.innerHTML = `<div class="no-results">No results found</div>`;
                return;
            }

            products.slice(0, 10).forEach((product) => {
                const resultItem = document.createElement("div");
                resultItem.className = "search-result-item";

                const price = product.offers?.[0]?.price !== undefined
                    ? `$${parseFloat(product.offers[0].price).toFixed(2)}`
                    : "Price Not Available";

                resultItem.innerHTML = `
                    <div class="result-left">
                        <img src="${product.image[0].startsWith('/') ? product.image[0] : '/' + product.image[0]}" 
     alt="${product.name}" class="result-image">

                        <div class="result-info">
                            <h4 class="result-name">${highlightQuery(product.name, query)}</h4>
                            <p class="result-description">${highlightQuery(product.description, query)}</p>
                        </div>
                    </div>
                    <div class="result-right">
                        <span class="result-price">${price}</span>
                    </div>
                `;

                resultItem.addEventListener("click", () => {
                    window.location.href = `product_page.html?handle=${product.offers[0].handle}`;
                });

                searchResultsContainer.appendChild(resultItem);
            });
        }

        // Adjust search results' position
        function adjustSearchResultsPosition() {
            const formRect = searchForm.getBoundingClientRect();
            searchResultsContainer.style.position = "absolute";
            searchResultsContainer.style.top = `${window.scrollY + formRect.bottom}px`;
            searchResultsContainer.style.left = `${formRect.left}px`;
            searchResultsContainer.style.width = `${formRect.width}px`;
        }

        adjustSearchResultsPosition();
        window.addEventListener("resize", adjustSearchResultsPosition);

        // Highlight query in results
        function highlightQuery(text, query) {
            const regex = new RegExp(`(${query})`, "gi");
            return text.replace(regex, "<mark>$1</mark>");
        }
    }

    // **Ensure header is fully loaded before initializing search**
    function waitForHeaderAndInitialize(retryCount = 0) {
        const searchInputExists = document.querySelector(".search-input");

        if (searchInputExists) {
            console.log("🔄 Header detected, initializing search.js...");
            initializeSearch();
            return;
        }

        if (retryCount > 20) {  // Stop after 20 retries (~4 seconds max wait)
            console.warn("Header did not load after multiple retries. Search.js execution halted.");
            return;
        }

        console.warn(`Header not fully loaded yet. Retrying in 200ms... (Attempt ${retryCount + 1})`);
        setTimeout(() => waitForHeaderAndInitialize(retryCount + 1), 200);
    }

    // Detect if we are on a policy page
    if (document.body.classList.contains("policy-page")) {
        console.warn("Policy page detected. Forcing extended retries for search bar.");
        waitForHeaderAndInitialize();
    } else {
        waitForHeaderAndInitialize();
    }
});
