document.addEventListener("DOMContentLoaded", () => {
  const addToCartButton = document.getElementById("addToCartButton");
  const buyNowButton = document.getElementById("buyNowButton");
  const quantityInput = document.getElementById("quantity");

  if (!addToCartButton || !buyNowButton || !quantityInput) {
      console.error("Essential elements (Add to Cart or Buy Now button) not found.");
      return;
  }

  // Attach listener for quantity changes
  quantityInput.addEventListener("input", () => {
      updateSidebarPrice();
      updateSnipcartAttributes();
  });

  // Attach listener for Buy Now button
  buyNowButton.addEventListener("click", handleBuyNow);
});

let selectedColor = null;
let selectedSize = null;
let productData = null;

// Fetch product data
const urlParams = new URLSearchParams(window.location.search);
const handle = urlParams.get("handle");

if (handle) {
    // Track Recently Viewed Products (NEW LOGIC)
    const sanitizedHandle = handle.trim().toLowerCase();
    let recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");

    if (!recentlyViewed.includes(sanitizedHandle)) {
        recentlyViewed.push(sanitizedHandle);
        localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed));
    }
}
document.getElementById("buyNowButton").addEventListener("click", handleBuyNow);

// Load JSON Product Data
fetch("updated_products.json")
    .then((response) => response.json())
    .then((products) => {
        productData = products.find((product) =>
            product.offers.some((o) => o.handle === handle)
        );

        if (!productData) {
            document.querySelector(".container2").innerHTML =
                "<p>Product not found.</p>";
            return;
        }

        // Load the CSV for Body (HTML) description
        fetch("updated_products.csv")
            .then((response) => response.text())
            .then((csvData) => {
                const csvRows = csvData.split("\n").map((row) => row.split(","));
                const csvHeaders = csvRows[0];
                const csvProducts = csvRows.slice(1).map((row) => {
                    const product = {};
                    row.forEach((value, index) => {
                        product[csvHeaders[index]] = value;
                    });
                    return product;
                });

                const csvProduct = csvProducts.find((p) => p.Handle === handle);
                initializeProductPage(productData, csvProduct);
            })
            .catch((error) => console.error("Error loading CSV:", error));
    })
    .catch((error) => console.error("Error fetching product data:", error));

    function initializeProductPage(product, csvProduct) {
      const selectedOffer = product.offers.find((offer) =>
          offer.sizes?.some((size) => size.handle === handle)
      );
  
      if (selectedOffer) {
          selectedColor = selectedOffer.color;
          selectedSize = selectedOffer.sizes?.find((size) => size.handle === handle)?.size;
  
          updateMainImage(selectedOffer.image[0]);
          updatePrice(selectedOffer.price, false);
          updateCanonicalURL(selectedOffer.handle);
      } else {
          setDefaultSelections(product);
      }
  
      document.getElementById("productTitle").textContent = product.name || "Untitled Product";
  
      // Use CSV Body (HTML) for product description, fallback to JSON description
      const productDescription = csvProduct ? csvProduct["Body (HTML)"] : product.description;
      document.getElementById("productDescription").innerHTML = productDescription;
  
      populateCarousel(product.image);
      populateColorOptions(product.offers);
      populateSizeOptions(product.offers);
  
      updateSidebarInfo();
      updateSidebarPrice();
  
      // Attach quantity change listener
      document.getElementById("quantity").addEventListener("input", () => {
          updateSidebarPrice();
          updateSnipcartAttributes();
      });
  
      // Set attributes for Add to Cart button
      const addToCartButton = document.getElementById("addToCartButton");
      if (addToCartButton) {
          updateSnipcartAttributes();
          addToCartButton.addEventListener("click", () => {
              addToCart(handle);
          });
      }
  
      // Set attributes for Buy Now button
      const buyNowButton = document.getElementById("buyNowButton");
      if (buyNowButton) {
          buyNowButton.addEventListener("click", () => {
              handleBuyNow();
          });
      }
  }
  
  
  function ensureButtonInitialization() {
    const addToCartButton = document.getElementById("addToCartButton");
    const buyNowButton = document.getElementById("buyNowButton");

    if (addToCartButton && buyNowButton) {
        // Set attributes and event listeners for Add to Cart button
        updateSnipcartAttributes();

        addToCartButton.addEventListener("click", () => {
            addToCart(handle);
        });

        // Set attributes and event listeners for Buy Now button
        buyNowButton.addEventListener("click", () => {
            const price = parseFloat(document.getElementById("productPrice").textContent.replace("$", "")) || 0;
            const quantity = parseInt(document.getElementById("quantity").value, 10) || 1;
            const total = price * quantity;
            const buyNowURL = `https://app.snipcart.com/api/cart/add?&id=${addToCartButton.getAttribute("data-item-id")}&name=${addToCartButton.getAttribute("data-item-name")}&price=${total}&quantity=${quantity}&url=${window.location.href}`;

            window.location.href = buyNowURL;
        });
    } else {
        // Retry initialization after a short delay if buttons are not yet loaded
        setTimeout(ensureButtonInitialization, 100);
    }
}
 
  
function populateCarousel(images) {
  const carousel = document.getElementById("thumbnailCarousel");
  carousel.innerHTML = "";

  const rows = Math.ceil(images.length / 4);
  for (let i = 0; i < rows; i++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "thumbnail-row";

    images.slice(i * 4, i * 4 + 4).forEach((image, index) => {
      const thumbnail = document.createElement("img");
      thumbnail.src = image;
      thumbnail.className = "thumbnail";
      thumbnail.onclick = () => updateMainImage(image);

      if (index === 0 && i === 0) thumbnail.classList.add("active");
      rowDiv.appendChild(thumbnail);
    });

    carousel.appendChild(rowDiv);
  }
}

function populateColorOptions(offers) {
  const colorOptions = document.getElementById("colorOptions");
  colorOptions.innerHTML = ""; // Clear previous options

  // Get unique colors
  const uniqueColors = [...new Set(offers.map((o) => o.color))];

  if (uniqueColors.length === 0) {
      document.getElementById("color-options-container").style.display = "none";
      selectedColor = null; // No color selected
  } else {
      uniqueColors.forEach((color, index) => {
          const colorOption = document.createElement("div");
          const thumbnail = offers.find((o) => o.color === color)?.image[0] || "product_images/fallback_image.webp";

          colorOption.className = `variant-option${index === 0 ? " active" : ""}`;
          colorOption.innerHTML = `
              <img src="${thumbnail}" class="variant-thumbnail" alt="${color}">
              <p>${color}</p>
          `;

          colorOption.onclick = () => handleColorSelection(color, offers);

          colorOptions.appendChild(colorOption);
      });

      selectedColor = uniqueColors[0]; // Default to the first color
  }
}


function populateSizeOptions(offers) {
  const sizeOptions = document.getElementById("sizeOptions");
  const sizeLabel = sizeOptions.previousElementSibling; // Label for size options
  sizeOptions.innerHTML = ""; // Clear any previous sizes

  // Get unique sizes
  const uniqueSizes = [...new Set(offers.flatMap((o) => o.sizes?.map((s) => s.size) || []))];

  if (uniqueSizes.length === 0) {
      // Hide size options if no sizes are available
      sizeOptions.style.display = "none";
      sizeLabel.style.display = "none";
      document.querySelector("#selectedSize").parentElement.style.display = "none";
      selectedSize = null; // No size selected
  } else {
      // Show size options and populate them
      sizeOptions.style.display = "grid";
      sizeLabel.style.display = "block";
      document.querySelector("#selectedSize").parentElement.style.display = "block";

      uniqueSizes.forEach((size, index) => {
          const sizeButton = document.createElement("button");
          sizeButton.textContent = size;
          sizeButton.className = `size-button${index === 0 ? " active" : ""}`;
          sizeButton.onclick = () => handleSizeSelection(size);

          sizeOptions.appendChild(sizeButton);
      });

      selectedSize = uniqueSizes[0]; // Default to the first size
  }
}

function updateSidebarInfo() {
  const selectedVariantName = `${selectedColor || "Default"}${selectedSize ? ` - ${selectedSize}` : ""}`;
  const selectedVariantThumbnail =
      productData.offers.find((o) => o.color === selectedColor)?.image[0] || "product_images/fallback_image.webp";

  document.getElementById("selectedVariant").textContent = selectedVariantName;
  document.getElementById("selectedVariantThumbnail").src = selectedVariantThumbnail;

  const sizeElement = document.querySelector("#selectedSize").parentElement;
  if (selectedSize) {
      sizeElement.style.display = "block";
      document.getElementById("selectedSize").textContent = selectedSize;
  } else {
      sizeElement.style.display = "none";
  }
}
function setProductPrice(basePrice) {
  const productPriceElement = document.getElementById("productPrice");
  if (productPriceElement) {
      productPriceElement.textContent = `$${basePrice.toFixed(2)}`;
  }
}

function updateSidebarPrice() {
  const quantity = parseInt(document.getElementById("quantity").value, 10) || 1;

  // Get the base price from the productPrice element
  const productPriceElement = document.getElementById("productPrice");
  const basePrice = parseFloat(productPriceElement.textContent.replace("$", "")) || 0;

  // Calculate the total price
  const totalPrice = basePrice * quantity;

  // Update the sidebar price
  const sidebarPriceElement = document.getElementById("sidebarPrice");
  if (sidebarPriceElement) {
      sidebarPriceElement.textContent = `$${totalPrice.toFixed(2)}`;
  }
}


function updatePrice(basePrice = 0, colorPriceAdjustment = 0) {
  const quantity = parseInt(document.getElementById("quantity").value, 10) || 1;

  // Calculate the final price
  let finalPrice = basePrice;

  if (colorPriceAdjustment) {
      finalPrice += colorPriceAdjustment;
  }

  // Multiply by quantity
  const totalPrice = finalPrice * quantity;

  // Update UI
  document.getElementById("productPrice").textContent = `$${totalPrice.toFixed(2)}`;
  document.getElementById("sidebarPrice").textContent = `$${totalPrice.toFixed(2)}`;
}

function handleColorSelection(color, offers) {
  const selectedOffer = offers.find((o) => o.color === color);

  if (!selectedOffer) return;

  selectedColor = color;

  // Update the product price to the base price of the selected color
  setProductPrice(selectedOffer.price);

  // Reset quantity to 1 and update the sidebar price
  document.getElementById("quantity").value = 1;
  updateSidebarPrice();

  // Update the sidebar info and Snipcart attributes
  updateSidebarInfo();
  updateSnipcartAttributes();

  // Visually update active state for color options
  document.querySelectorAll(".variant-option").forEach((option) => {
      const colorText = option.querySelector("p")?.textContent;
      option.classList.toggle("active", colorText === color);
  });
}

function handleSizeSelection(size) {
  selectedSize = size;

  const selectedOffer = productData.offers.find(
      (offer) => offer.color === selectedColor
  );

  if (selectedOffer) {
      const sizeOffer = selectedOffer.sizes.find((s) => s.size === size);
      if (sizeOffer) {
          setProductPrice(sizeOffer.price); // Set base price for the selected size
      }
  }

  // Reset quantity to 1 and update the sidebar price
  document.getElementById("quantity").value = 1;
  updateSidebarPrice();

  // Update the sidebar info and Snipcart attributes
  updateSidebarInfo();
  updateSnipcartAttributes();

  // Highlight the selected size
  document.querySelectorAll(".size-button").forEach((btn) => {
      btn.classList.toggle("active", btn.textContent === size);
  });
}


function setDefaultSelections(product) {
  const defaultOffer = product.offers[0];
  selectedColor = defaultOffer.color;
  selectedSize = defaultOffer.sizes[0]?.size;

  updateMainImage(defaultOffer.image[0]);
  updatePrice(defaultOffer.price);

  const defaultHandle = defaultOffer.sizes[0]?.handle;
  if (defaultHandle) {
    updateCanonicalURL(defaultHandle);
  }

  updateSidebarInfo();
  updateSidebarPrice();
  updateSnipcartAttributes();
}

function updateMainImage(imageSrc) {
    const mainImage = document.getElementById("mainImage");
    mainImage.src = imageSrc;
    mainImage.onerror = () => (mainImage.src = "product_images/fallback_image.webp");
  }
  
  function updateSnipcartAttributes() {
    const addToCartButton = document.getElementById("addToCartButton");

    if (!addToCartButton) {
        console.error("Add to Cart button not found!");
        return;
    }

    const price = parseFloat(document.getElementById("productPrice").textContent.replace("$", "")) || 0;
    const quantity = parseInt(document.getElementById("quantity").value, 10) || 1;
    const selectedVariant = document.getElementById("selectedVariant").textContent || "Default";
    const selectedVariantThumbnail = document.getElementById("selectedVariantThumbnail").src;
    const selectedSize = document.getElementById("selectedSize")?.textContent || "Default";

    if (!price || isNaN(price)) {
        console.error("Price is invalid or missing!");
        return;
    }

    // Generate a unique ID
    const uniqueId = `${handle}-${selectedVariant}-${selectedSize}`;

    // Update attributes
    addToCartButton.setAttribute("data-item-id", uniqueId);
    addToCartButton.setAttribute("data-item-name", `${productData.name} - ${selectedVariant}`);
    addToCartButton.setAttribute("data-item-price", price.toFixed(2));
    addToCartButton.setAttribute("data-item-url", window.location.href);
    addToCartButton.setAttribute("data-item-description", productData.description);
    addToCartButton.setAttribute("data-item-image", selectedVariantThumbnail);
    addToCartButton.setAttribute("data-item-quantity", quantity);

    console.log("Updated Snipcart Attributes:", {
        id: uniqueId,
        name: `${productData.name} - ${selectedVariant}`,
        price: price.toFixed(2),
        quantity: quantity,
    });
}

function handleBuyNow() {
  const price = parseFloat(document.getElementById("productPrice").textContent.replace("$", "")) || 0;
  const quantity = parseInt(document.getElementById("quantity").value, 10) || 1;

  // Validate price and quantity
  if (isNaN(price) || price <= 0 || quantity <= 0) {
      console.error("Invalid price or quantity for Buy Now action.");
      alert("Error: Invalid product information. Please check the price and quantity.");
      return;
  }

  // Ensure proper redirection to checkout
  const currentURL = window.location.href.split("#")[0]; // Remove existing hash fragments
  const checkoutURL = `${currentURL}#/checkout`;

  console.log(`Redirecting to Checkout: ${checkoutURL}`);
  window.location.href = checkoutURL;
}

  function addToCart(handle) {
    let cartItems = JSON.parse(localStorage.getItem("cartItems") || "[]");
    if (!cartItems.includes(handle)) {
        cartItems.push(handle);
        localStorage.setItem("cartItems", JSON.stringify(cartItems));
    }
    console.log("Cart Items:", cartItems); // Debugging
}

  function updateCanonicalURL(handle) {
    const canonicalURL = `${window.location.origin}/product_page.html?handle=${handle}`;
    history.replaceState({}, "", canonicalURL);
  }
  
