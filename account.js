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

// Ensure env variables are loaded before Firebase initializes
document.addEventListener("DOMContentLoaded", async () => {
    console.log("account.js: DOM fully loaded and parsed");

    await loadEnv(); // ✅ Now, this will properly load the environment variables before Firebase initializes

    console.log("account.js: DOM fully loaded and parsed");

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
        

        // Debugging: Log the config being used
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

            if (user) {
                currentUser = user;
                console.log("User signed in:", user.email);
                if (signInLink) {
                    signInLink.innerHTML = '<a href="#">Sign Out</a>';
                    signInLink.onclick = async (e) => {
                        e.preventDefault();
                        await signOut(auth);
                        alert("You have been signed out.");
                        currentUser = null;
                        location.reload(); // Refresh UI
                    };
                }
                if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${user.email}`;
            } else {
                currentUser = null;
                console.log("No user signed in.");
                if (signInLink) {
                    signInLink.innerHTML = '<a href="#">Sign In</a>';
                    signInLink.onclick = (e) => {
                        e.preventDefault();
                        openModal("loginModal");
                    };
                }
                if (welcomeMessage) welcomeMessage.textContent = "Welcome, Guest";
            }
        });

        // Registration form handling
        const registerForm = document.getElementById("registerForm");
        if (registerForm) {
            registerForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const email = document.getElementById("register-email")?.value;
                const password = document.getElementById("register-password")?.value;
                const confirmPassword = document.getElementById("confirm-password")?.value;

                if (!email || !password || !confirmPassword || password !== confirmPassword) {
                    alert("All fields are required and passwords must match!");
                    return;
                }

                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    currentUser = userCredential.user;
                    console.log("Registration successful:", currentUser.email);
                    closeModal("registerModal");
                    alert("Registration successful. Please sign in.");
                    openModal("loginModal");
                } catch (error) {
                    console.error("Error creating account:", error.message);
                    alert("Registration failed: " + error.message);
                }
            });
        }

        // Login form handling
        const loginForm = document.getElementById("loginForm");
        if (loginForm) {
            loginForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const email = document.getElementById("login-email")?.value;
                const password = document.getElementById("login-password")?.value;

                if (!email || !password) {
                    alert("All fields are required");
                    return;
                }

                try {
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    currentUser = userCredential.user;
                    console.log("Login successful:", currentUser.email);
                    closeModal("loginModal");
                    openModal("customerDashboardModal");
                } catch (error) {
                    console.error("Error signing in:", error.message);
                    alert("Login failed: " + error.message);
                }
            });
        }

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
                observer.disconnect(); // Stop observing after initialization
            }
        });

        observer.observe(headerPlaceholder, { childList: true });
        initializeDashboard(); // Ensure it works for non-dynamic headers
    } catch (error) {
        console.error("Error initializing Firebase:", error.message);
    }

    const passwordInput = document.getElementById("register-password");
    const confirmPasswordInput = document.getElementById("confirm-password");
    const registerButton = document.getElementById("registerButton");
    const passwordFeedback = document.getElementById("passwordFeedback");
    const confirmPasswordFeedback = document.getElementById("confirmPasswordFeedback");
    const passwordStrengthBar = document.getElementById("password-strength");

    if (passwordInput && confirmPasswordInput) {
        function checkPasswordStrength(password) {
            let strength = "weak";
            if (password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password) && /\W/.test(password)) {
                strength = "strong";
            } else if (password.length >= 6 && /[A-Z]/.test(password)) {
                strength = "medium";
            }
            return strength;
        }

        passwordInput.addEventListener("input", function () {
            const strength = checkPasswordStrength(passwordInput.value);
            passwordStrengthBar.setAttribute("data-strength", strength);

            if (strength === "strong") {
                passwordFeedback.textContent = "Strong password!";
                passwordFeedback.style.color = "green";
            } else if (strength === "medium") {
                passwordFeedback.textContent = "Medium strength password.";
                passwordFeedback.style.color = "orange";
            } else {
                passwordFeedback.textContent = "Weak password. Try adding more characters, numbers, or symbols.";
                passwordFeedback.style.color = "red";
            }
            passwordFeedback.style.display = "block";

            registerButton.disabled = !(strength === "strong" && document.getElementById("terms-checkbox").checked);
        });

        confirmPasswordInput.addEventListener("input", function () {
            if (confirmPasswordInput.value !== passwordInput.value) {
                confirmPasswordFeedback.textContent = "Passwords do not match!";
                confirmPasswordFeedback.style.color = "red";
                confirmPasswordFeedback.style.display = "block";
                registerButton.disabled = true;
            } else {
                confirmPasswordFeedback.textContent = "Passwords match!";
                confirmPasswordFeedback.style.color = "green";
                confirmPasswordFeedback.style.display = "block";
                registerButton.disabled = !document.getElementById("terms-checkbox").checked;
            }
        });

        document.getElementById("terms-checkbox")?.addEventListener("change", function () {
            const strength = checkPasswordStrength(passwordInput.value);
            registerButton.disabled = !(this.checked && strength === "strong" && confirmPasswordInput.value === passwordInput.value);
        });
    } else {
        console.warn("Registration form elements not found.");
    }
});

// Modal management
function openModal(modalId) {
    const allModals = document.querySelectorAll('.modal2, .modal3');
    allModals.forEach(modal => modal.style.display = 'none');

    const targetModal = document.getElementById(modalId);
    if (targetModal) {
        targetModal.style.display = 'block';
    } else {
        console.warn(`Modal with ID "${modalId}" not found.`);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
    }
}

function closeAllModals(exceptions = []) {
    const modals = document.querySelectorAll(".modal3");
    modals.forEach(modal => {
        if (!exceptions.includes(modal.id)) {
            modal.style.display = "none";
        }
    });
}
// Password visibility toggle
function togglePasswordVisibility(passwordFieldId) {
    const passwordField = document.getElementById(passwordFieldId);
    if (passwordField) {
        passwordField.type = passwordField.type === "password" ? "text" : "password";
    }
}