// Firebase and DOM initialization

document.addEventListener("DOMContentLoaded", async () => {
    console.log("account.js: DOM fully loaded and parsed");

    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js");
    const { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js");

    const firebaseConfig = {
        apiKey: "AIzaSyAfxbw_Ur2jfQDZqEh-wBX9Lqeo1RdAIPA",
        authDomain: "customeraccounts-a29eb.firebaseapp.com",
        projectId: "customeraccounts-a29eb",
        storageBucket: "customeraccounts-a29eb.appspot.com",
        messagingSenderId: "4968118695",
        appId: "1:4968118695:web:079298c836a3d5f5551e82"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Global user state
    let currentUser = null;

    // Handle user authentication state changes
    onAuthStateChanged(auth, async (user) => {
        const signInLink = document.querySelector("#signInLink");
        const welcomeMessage = document.getElementById("welcomeMessage");

        if (user) {
            currentUser = user;
            signInLink.innerHTML = '<a href="#">Sign Out</a>';
            signInLink.onclick = async (e) => {
                e.preventDefault();
                await signOut(auth);
                alert("You have been signed out.");
                currentUser = null;
                signInLink.innerHTML = '<a href="#">Sign In</a>';
                signInLink.onclick = (e) => {
                    e.preventDefault();
                    openModal("loginModal");
                };
                if (welcomeMessage) welcomeMessage.textContent = "Welcome, Guest";
            };
            if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${user.email}`;
        } else {
            currentUser = null;
            signInLink.innerHTML = '<a href="#">Sign In</a>';
            signInLink.onclick = (e) => {
                e.preventDefault();
                openModal("loginModal");
            };
            if (welcomeMessage) welcomeMessage.textContent = "Welcome, Guest";
        }
    });
    const apiKey = process.env.SNIPCART_API_KEY || "<fallback-if-local>";
    let snipcartDiv = document.getElementById("snipcart");

    // Ensure the Snipcart div doesn't already exist
    if (!snipcartDiv) {
        snipcartDiv = document.createElement("div");
        snipcartDiv.id = "snipcart";
        snipcartDiv.setAttribute("hidden", "");
        snipcartDiv.setAttribute("data-api-key", apiKey);
        document.body.appendChild(snipcartDiv);
    }
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
                closeModal("loginModal");
                openModal("customerDashboardModal");
                const welcomeMessage = document.getElementById("welcomeMessage");
                if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${currentUser.email}`;
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
});


function openModal(modalId) {
    // Hide all currently visible modals
    const allModals = document.querySelectorAll('.modal2, .modal3');
    allModals.forEach(modal => {
        modal.style.display = 'none';
    });

    // Show the specified modal
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

document.addEventListener("DOMContentLoaded", function () {
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

        // Event Listener for Password Input
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

        // Event Listener for Confirm Password Input
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

        // Terms Checkbox Handling
        document.getElementById("terms-checkbox")?.addEventListener("change", function () {
            const strength = checkPasswordStrength(passwordInput.value);
            registerButton.disabled = !(this.checked && strength === "strong" && confirmPasswordInput.value === passwordInput.value);
        });
    } else {
        console.warn("Registration form elements not found.");
    }
});
