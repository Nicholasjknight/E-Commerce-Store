document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.querySelector(".search-input");
    const searchForm = document.querySelector(".search-form");

    // Dynamically create the search results container
    const searchResultsContainer = document.createElement("div");
    searchResultsContainer.className = "search-results";
    document.body.appendChild(searchResultsContainer); // Append to body for consistent positioning

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
            searchResultsContainer.innerHTML = ""; // Clear results
            searchResultsContainer.classList.remove("active"); // Hide dropdown
            return;
        }

        searchResultsContainer.classList.add("active"); // Show dropdown
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
        }, 200); // Small delay to allow clicks on results
    });

    // Function to render search results
    function renderSearchResults(products, query) {
        searchResultsContainer.innerHTML = ""; // Clear previous results

        if (products.length === 0) {
            searchResultsContainer.innerHTML = `<div class="no-results">No results found</div>`;
            return;
        }

        products.slice(0, 10).forEach((product) => {
            const resultItem = document.createElement("div");
            resultItem.className = "search-result-item";

            // Ensure price exists and format it to two decimal places
            const price = product.offers?.[0]?.price !== undefined
                ? `$${parseFloat(product.offers[0].price).toFixed(2)}`
                : "Price Not Available";

            resultItem.innerHTML = `
                <div class="result-left">
                    <img src="${product.image[0]}" alt="${product.name}" class="result-image">
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
    const adjustSearchResultsPosition = () => {
        const formRect = searchForm.getBoundingClientRect();
        searchResultsContainer.style.position = "absolute";
        searchResultsContainer.style.top = `${window.scrollY + formRect.bottom}px`; // Place below form
        searchResultsContainer.style.left = `${formRect.left}px`; // Align horizontally
        searchResultsContainer.style.width = `${formRect.width}px`; // Match form's width
    };

    // Call adjustment on load and resize
    adjustSearchResultsPosition();
    window.addEventListener("resize", adjustSearchResultsPosition);

    // Highlight query in results
    function highlightQuery(text, query) {
        const regex = new RegExp(`(${query})`, "gi");
        return text.replace(regex, "<mark>$1</mark>");
    }
});
