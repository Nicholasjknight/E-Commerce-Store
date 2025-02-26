// Load environment variables before executing anything else
async function loadEnv() {
    try {
        const response = await fetch("/api/env.js");
        const scriptText = await response.text();
        const script = document.createElement("script");
        script.textContent = scriptText;
        document.head.appendChild(script);
        console.log("Environment variables loaded from /api/env.js");
    } catch (error) {
        console.error("Failed to load environment variables:", error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("account.js: DOM fully loaded and parsed");

    await loadEnv(); // ✅ Ensures environment variables load before Firebase.

    // Wait for the header before initializing Firebase
    const waitForHeader = setInterval(() => {
        if (document.querySelector("#signInLink")) {
            console.log("Header detected. Now initializing Firebase...");
            clearInterval(waitForHeader);
            initializeFirebase(); // ✅ Call Firebase init after header is ready
        }
    }, 100);

    // Wait for the footer to load before initializing cart UI
const footerPlaceholder = document.getElementById("footer-placeholder");
const footerObserver = new MutationObserver(() => {
    if (footerPlaceholder && footerPlaceholder.children.length > 0) {
        console.log("Footer detected. Initializing cart UI...");
        if (typeof initializeCartUI === "function") {
            initializeCartUI();
        }
        footerObserver.disconnect();
    }
});
footerObserver.observe(footerPlaceholder, { childList: true });

});

// Firebase initialization function
async function initializeFirebase() {
    try {
        // Import Firebase SDK modules dynamically
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js");
        const { 
            getAuth, 
            onAuthStateChanged, 
            createUserWithEmailAndPassword, 
            signInWithEmailAndPassword, 
            signOut 
        } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js");

        // Dynamically choose environment variables (local: window.env, production: process.env)
        const firebaseConfig = {
            apiKey: window.env?.FIREBASE_API_KEY || "",
            authDomain: window.env?.FIREBASE_AUTH_DOMAIN || "",
            projectId: window.env?.FIREBASE_PROJECT_ID || "",
            storageBucket: window.env?.FIREBASE_STORAGE_BUCKET || "",
            messagingSenderId: window.env?.FIREBASE_MESSAGING_SENDER_ID || "",
            appId: window.env?.FIREBASE_APP_ID || ""
        };

        console.log("Firebase Config Loaded:", firebaseConfig);

        // Initialize Firebase App and Auth
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        console.log("Firebase initialized.");

        // Global user state
        let currentUser = null;
// Handle user authentication state changes
onAuthStateChanged(auth, (user) => {
    const signInLink = document.querySelector("#signInLink");
    const welcomeMessage = document.getElementById("welcomeMessage");
    const createAccountLink = document.getElementById("createAccountLink"); // ✅ Add reference to "Create Account" link

    if (user) {
        currentUser = user;
        console.log("User signed in:", user.email);

        // Change "Sign In" to "Sign Out"
        if (signInLink) {
            signInLink.innerHTML = '<a href="#">Sign Out</a>';
            signInLink.onclick = async (e) => {
                e.preventDefault();
                await signOut(auth);
                alert("You have been signed out.");
                currentUser = null;
                location.reload();
            };
        }

        // Display welcome message with user email
        if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${user.email}`;

        // ✅ Ensure the email field in the dashboard modal is populated
        updateUserEmail(user.email);

        // ✅ Hide "Create Account" when logged in
        if (createAccountLink) createAccountLink.style.display = "none"; 

    } else {
        currentUser = null;
        console.log("No user signed in.");

        // Show "Sign In" option
        if (signInLink) {
            signInLink.innerHTML = '<a href="#">Sign In</a>';
            signInLink.onclick = (e) => {
                e.preventDefault();
                openModal("loginModal");
            };
        }

        // Show "Create Account" when not logged in
        if (createAccountLink) createAccountLink.style.display = "inline";

        // Display guest message
        if (welcomeMessage) welcomeMessage.textContent = "Welcome, Guest";

        // Clear email input if logged out
        updateUserEmail("");
    }
});

        // Function to update the email field inside the dashboard modal
        function updateUserEmail(email) {
            const emailInput = document.getElementById("email");
            if (emailInput) {
                emailInput.value = email || "Not Logged In";
                console.log("✅ Email set in dashboard:", email || "No email available");
            }
        }

        // Ensure email updates when the dashboard modal opens
        document.addEventListener("DOMContentLoaded", () => {
            const dashboardModal = document.getElementById("customerDashboardModal");

            if (dashboardModal) {
                dashboardModal.addEventListener("click", () => {
                    if (currentUser) {
                        updateUserEmail(currentUser.email);
                    } else {
                        updateUserEmail("Not Logged In");
                    }
                });
            }
        });
        async function loadOrderHistory() {
            const orderList = document.getElementById("orderList");
        
            if (!window.Snipcart || !Snipcart.api.user.getToken) {
                console.error("Snipcart is not fully loaded yet.");
                return;
            }
        
            // Get user token to authenticate API request
            const userToken = await Snipcart.api.user.getToken();
            
            if (!userToken) {
                orderList.innerHTML = "<p>You must be logged in to see your order history.</p>";
                return;
            }
        
            // Fetch orders using Snipcart API
            try {
                const response = await fetch("https://app.snipcart.com/api/orders", {
                    headers: {
                        "Authorization": `Bearer ${userToken}`,
                        "Accept": "application/json"
                    }
                });
        
                if (!response.ok) {
                    throw new Error("Failed to fetch orders.");
                }
        
                const data = await response.json();
        
                // If no orders, display message
                if (data.items.length === 0) {
                    orderList.innerHTML = "<p>No Order History</p>";
                    return;
                }
        
                // Generate order history table
                let orderHistoryHTML = "<table class='order-table'><thead><tr><th>Order ID</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>";
        
                data.items.forEach(order => {
                    orderHistoryHTML += `
                        <tr>
                            <td>${order.invoiceNumber}</td>
                            <td>${new Date(order.creationDate).toLocaleDateString()}</td>
                            <td>$${order.finalGrandTotal.toFixed(2)}</td>
                            <td>${order.status}</td>
                        </tr>
                    `;
                });
        
                orderHistoryHTML += "</tbody></table>";
        
                // Inject into the order list div
                orderList.innerHTML = orderHistoryHTML;
        
            } catch (error) {
                console.error("Error fetching order history:", error);
                orderList.innerHTML = "<p>Error loading order history.</p>";
            }
        }
        
        // Call function after user logs in
        document.addEventListener("DOMContentLoaded", () => {
            setTimeout(loadOrderHistory, 3000); // Delayed call to allow Snipcart to fully load
        });
        

        // Initialize customer dashboard
        function initializeDashboard() {
            const customerDashboard = document.getElementById("customerDashboard");
            if (customerDashboard) {
                customerDashboard.addEventListener("click", () => {
                    if (currentUser) {
                        openModal("customerDashboardModal");
                    } else {
                        openModal("loginModal");
                    }
                });
            } else {
                console.warn("customerDashboard element not found.");
            }
        }

        // Wait for header to load and initialize dashboard
        const headerPlaceholder = document.getElementById("header-placeholder");
        const observer = new MutationObserver(() => {
            if (headerPlaceholder && headerPlaceholder.children.length > 0) {
                initializeDashboard();
                observer.disconnect();
            }
        });

        observer.observe(headerPlaceholder, { childList: true });
        initializeDashboard();
    } catch (error) {
        console.error("Error initializing Firebase:", error.message);
    }
}

// ✅ Fix: Ensure modal functions are **global** across all pages (including catalog.html)
window.openModal = function (modalId) {
    const allModals = document.querySelectorAll(".modal2, .modal3");
    allModals.forEach(modal => modal.style.display = "none"); // Close all other modals

    const targetModal = document.getElementById(modalId);
    if (targetModal) {
        targetModal.style.display = "block";
        console.log(`Modal ${modalId} opened.`);
    } else {
        console.warn(`Modal with ID "${modalId}" not found.`);
    }
};

window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
        console.log(`Modal ${modalId} closed.`);
    } else {
        console.warn(`Modal with ID "${modalId}" not found.`);
    }
};

// ✅ Fix: Attach close event for dashboard close button (X)
document.addEventListener("DOMContentLoaded", () => {
    const closeDashboardBtn = document.querySelector("#customerDashboardModal .modal-close");
    if (closeDashboardBtn) {
        closeDashboardBtn.addEventListener("click", () => {
            closeModal("customerDashboardModal");
        });
    } else {
        console.warn("Dashboard close button not found.");
    }
});

// Close all modals except specified exceptions
window.closeAllModals = function (exceptions = []) {
    const modals = document.querySelectorAll(".modal3");
    modals.forEach(modal => {
        if (!exceptions.includes(modal.id)) {
            modal.style.display = "none";
        }
    });
};

// Password visibility toggle
window.togglePasswordVisibility = function (passwordFieldId) {
    const passwordField = document.getElementById(passwordFieldId);
    if (passwordField) {
        passwordField.type = passwordField.type === "password" ? "text" : "password";
    }
};
