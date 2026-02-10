/**
 * YOUNGIN - Main Application Logic 
 * Handles Navigation, Global State, and Module Initialization
 */

import { initCustomDesign } from './modules/custom_design.js';
import { initMarketplace } from './modules/marketplace.js';
import { initLocalHub } from './modules/social_local.js';
import { initAiSizing } from './modules/ai_sizing.js';
import { initProfile } from './modules/profile.js';
import { initChatbot } from './modules/chatbot.js';
import { initCart } from './modules/cart.js';
import { initLandingMega } from './modules/landing-mega.js';
import { initPremiumAnimations } from './modules/premium-animations.js';
import { initVipModal } from './modules/vip_modal.js';
import {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from './modules/firebase_config.js';
import { getUserProfile, createUserProfile } from './modules/db_service.js';

// Global Auth Modal Helper (Defined outside class to ensure availability)
window.openAuthModal = (mode = 'login') => {
    const modal = document.getElementById('auth-modal');
    if (!modal) {
        console.error("Auth modal not found!");
        return;
    }

    const tabs = document.querySelectorAll('.auth-tabs .tab');
    const forms = document.querySelectorAll('.auth-form');

    modal.classList.remove('hidden');

    // Reset active states
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));

    if (mode === 'signup') {
        if (tabs[1]) tabs[1].classList.add('active'); // Signup Tab
        const signupForm = document.getElementById('signup-form');
        if (signupForm) signupForm.classList.add('active');
    } else {
        if (tabs[0]) tabs[0].classList.add('active'); // Login Tab
        const loginForm = document.getElementById('login-form');
        if (loginForm) loginForm.classList.add('active');
    }
};

class App {
    constructor() {
        this.state = {
            user: {
                name: "Guest", // Default to Guest
                xp: 0,
                level: 1,
                streak: 0,
                badges: [],
                designs: []
            },
            isLoggedIn: false,
            bgMusicPlaying: false
        };

        this.init();
    }

    // Expose tab switcher globally
    setupGlobalFunctions() {
        window.switchWorkTab = (type) => {
            const freelancerTab = document.querySelector('.work-tabs button:first-child');
            const clientTab = document.querySelector('.work-tabs button:last-child');
            const freelancerSteps = document.getElementById('work-freelancer');
            const clientSteps = document.getElementById('work-client');

            if (type === 'freelancer') {
                freelancerTab.classList.add('active');
                clientTab.classList.remove('active');
                freelancerSteps.style.display = 'grid';
                clientSteps.style.display = 'none';
            } else {
                clientTab.classList.add('active');
                freelancerTab.classList.remove('active');
                clientSteps.style.display = 'grid';
                freelancerSteps.style.display = 'none';
            }
        };
    }

    init() {
        this.setupGlobalFunctions();
        this.setupNavigation();

        // Listen for Auth State Changes
        this.monitorAuthState();

        // Initialize Modules
        this.setupAuthListeners();
        this.chatbot = initChatbot(); // Initialize Chatbot
        initCart(); // Initialize Shopping Cart
        initLandingMega(); // Initialize Landing Page Animations
        initPremiumAnimations(); // Initialize Premium UI Animations
        initVipModal(); // Initialize VIP Modal
    }

    monitorAuthState() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in.
                this.state.isLoggedIn = true;

                // 1. Setup Basic User Info immediately from Auth (Fastest)
                this.state.user.name = user.displayName || user.email.split('@')[0] || "Designer";
                this.state.user.email = user.email;

                // 2. Fetch Full Profile from Firestore (Async)
                const profile = await getUserProfile(user.uid);

                if (profile) {
                    // Update state with DB data (merging carefully)
                    this.state.user = {
                        ...this.state.user, // Keep basics
                        ...profile,         // Override with DB data
                        name: profile.displayName || this.state.user.name // Prefer DB name
                    };
                } else {
                    // Optional: Auto-create if missing? 
                    // For now, we rely on the Signup flow to create it.
                }

                if (!this.state.user.xp) this.state.user.xp = 100;

                document.body.classList.remove('guest-mode');
                this.updateUserUI();
                this.showToast(`Welcome back, ${this.state.user.name}!`);

                // Hide Auth Modal if open
                document.getElementById('auth-modal').classList.add('hidden');

                // HIDE LANDING PAGE, SHOW APP
                document.getElementById('landing-page').classList.add('hidden');
                document.querySelector('.sidebar').classList.remove('hidden');
                document.querySelector('.main-content').classList.remove('hidden');

                // Re-init modules that depend on user data (like Profile)
                if (document.querySelector('#profile.active')) {
                    initProfile(this);
                }

                // Show Chatbot
                if (this.chatbot) this.chatbot.setVisible(true);

            } else {
                // User is signed out.
                this.state.isLoggedIn = false;
                this.state.user = {
                    name: "Guest",
                    xp: 0,
                    level: 1,
                    streak: 0,
                    badges: [],
                    designs: [],
                    measurements: null
                };

                document.body.classList.add('guest-mode'); // Enable Guest Mode

                // SHOW LANDING PAGE, HIDE APP
                document.getElementById('landing-page').classList.remove('hidden');
                document.querySelector('.sidebar').classList.add('hidden');
                document.querySelector('.main-content').classList.add('hidden');

                // this.navigateTo('dashboard'); // No longer needed as we switch entire view container

                this.updateUserUI();

                // Hide Chatbot
                if (this.chatbot) this.chatbot.setVisible(false);
            }
        });
    }

    setupAuthListeners() {
        const modal = document.getElementById('auth-modal');
        const loginBtn = document.getElementById('nav-login-btn');
        const landingLoginBtn = document.getElementById('landing-login-btn');
        const landingSignupBtn = document.getElementById('landing-signup-btn');
        const closeBtn = document.querySelector('.close-modal');
        const tabs = document.querySelectorAll('.auth-tabs .tab');
        const forms = document.querySelectorAll('.auth-form');

        // Toggle Modal / Logout
        const openLogin = () => {
            modal.classList.remove('hidden');
            // Default to login tab
            tabs[0].click();
        };

        const openSignup = () => {
            modal.classList.remove('hidden');
            // Switch to signup tab
            tabs[1].click();
        };

        if (landingLoginBtn) landingLoginBtn.addEventListener('click', openLogin);
        if (landingSignupBtn) landingSignupBtn.addEventListener('click', openSignup);

        loginBtn.addEventListener('click', () => {
            if (this.state.isLoggedIn) {
                // Handle Logout
                signOut(auth).then(() => {
                    this.showToast("Signed out successfully.");
                }).catch((error) => {
                    console.error("Sign Out Error", error);
                });
            } else {
                openLogin();
            }
        });

        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

        // Helper Functions for Error Display
        const showAuthError = (formType, message) => {
            const errorEl = document.getElementById(`${formType}-error`);
            if (errorEl) {
                errorEl.textContent = message;
                errorEl.classList.remove('hidden');
            }
        };

        const clearAuthError = (formType) => {
            const errorEl = document.getElementById(`${formType}-error`);
            if (errorEl) {
                errorEl.classList.add('hidden');
                errorEl.textContent = '';
            }
        };

        const setButtonLoading = (button, isLoading) => {
            if (isLoading) {
                button.classList.add('loading');
                button.disabled = true;
            } else {
                button.classList.remove('loading');
                button.disabled = false;
            }
        };

        const translateFirebaseError = (errorCode) => {
            const errorMessages = {
                'auth/wrong-password': 'Incorrect password. Please try again.',
                'auth/user-not-found': 'No account found with this email address.',
                'auth/email-already-in-use': 'An account with this email already exists.',
                'auth/weak-password': 'Password should be at least 6 characters long.',
                'auth/invalid-email': 'Please enter a valid email address.',
                'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
                'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
                'auth/network-request-failed': 'Network error. Please check your connection.',
                'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
                'auth/requires-recent-login': 'Please log out and log in again to perform this action.'
            };
            return errorMessages[errorCode] || 'An error occurred. Please try again.';
        };

        const validateEmail = (email) => {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        };

        const validatePassword = (password) => {
            return password.length >= 6;
        };

        const validateUsername = (username) => {
            return username.length >= 3;
        };

        // Tabs
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                forms.forEach(f => f.classList.remove('active'));

                tab.classList.add('active');
                const target = tab.dataset.tab;
                document.getElementById(`${target}-form`).classList.add('active');

                // Clear errors when switching tabs
                clearAuthError('login');
                clearAuthError('signup');
            });
        });

        // Login Submit
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAuthError('login');

            const email = e.target.querySelector('input[type="email"]').value.trim();
            const password = e.target.querySelector('input[type="password"]').value;
            const submitBtn = e.target.querySelector('button[type="submit"]');

            // Client-side validation
            if (!validateEmail(email)) {
                showAuthError('login', 'Please enter a valid email address.');
                return;
            }

            if (!password) {
                showAuthError('login', 'Please enter your password.');
                return;
            }

            setButtonLoading(submitBtn, true);

            try {
                await signInWithEmailAndPassword(auth, email, password);
                // monitorAuthState will handle the rest
                clearAuthError('login');
            } catch (error) {
                console.error('Login Error:', error);
                const friendlyMessage = translateFirebaseError(error.code);
                showAuthError('login', friendlyMessage);
                setButtonLoading(submitBtn, false);
            }
        });

        // Signup Submit
        document.getElementById('signup-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAuthError('signup');

            const username = e.target.querySelector('input[type="text"]').value.trim();
            const email = e.target.querySelector('input[type="email"]').value.trim();
            const password = e.target.querySelector('input[type="password"]').value;
            const submitBtn = e.target.querySelector('button[type="submit"]');

            // Client-side validation
            if (!validateUsername(username)) {
                showAuthError('signup', 'Username must be at least 3 characters long.');
                return;
            }

            if (!validateEmail(email)) {
                showAuthError('signup', 'Please enter a valid email address.');
                return;
            }

            if (!validatePassword(password)) {
                showAuthError('signup', 'Password must be at least 6 characters long.');
                return;
            }

            setButtonLoading(submitBtn, true);

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                // Update Display Name
                await updateProfile(userCredential.user, {
                    displayName: username
                });

                // Create Firestore Document
                await createUserProfile({
                    uid: userCredential.user.uid,
                    email: email,
                    displayName: username
                });

                // Manually trigger UI update or let callback handle it (callback might fire before profile update)
                // We'll rely on the callback, but the name might be null initially in the callback if it fires fast.
                // Let's force a local update just in case for immediate feedback.
                this.state.user.name = username;
                this.updateUserUI();
                clearAuthError('signup');

            } catch (error) {
                console.error('Signup Error:', error);
                const friendlyMessage = translateFirebaseError(error.code);
                showAuthError('signup', friendlyMessage);
                setButtonLoading(submitBtn, false);
            }
        });
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-links li');
        const sections = document.querySelectorAll('.content-section');

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const targetId = link.getAttribute('data-section');
                this.navigateTo(targetId);
            });
        });
    }

    navigateTo(sectionId) {
        // Update Sidebar
        document.querySelectorAll('.nav-links li').forEach(li => {
            li.classList.toggle('active', li.getAttribute('data-section') === sectionId);
        });

        // Update Content Area
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionId) {
                section.classList.add('active');
                this.handleSectionEnter(sectionId);
            }
        });

        // Dispatch Custom Event for other modules to listen to
        const sectionEvent = new CustomEvent('sectionChanged', { detail: sectionId });
        document.dispatchEvent(sectionEvent);
    }

    handleSectionEnter(sectionId) {
        // Trigger specific module renders if needed
        switch (sectionId) {
            case 'custom-design':
                initCustomDesign(this);
                break;
            case 'marketplace':
                initMarketplace();
                break;
            case 'local-hub':
                initLocalHub();
                break;
            case 'ai-sizing':
                initAiSizing();
                break;
            case 'profile':
                initProfile(this);
                break;
        }
    }

    addXP(amount) {
        this.state.user.xp += amount;
        this.updateUserUI();
        this.showToast(`+${amount} XP Gained!`);
    }

    updateUserUI() {
        // Update Sidebar User Info
        const nameEl = document.querySelector('.user-mini-profile .name');
        const xpEl = document.querySelector('.user-mini-profile .xp');
        const navLoginBtn = document.getElementById('nav-login-btn');
        const authHelper = document.querySelector('.auth-helper');
        const miniProfile = document.querySelector('.user-mini-profile');
        const avatarEl = document.querySelector('.user-mini-profile .avatar');
        const dashboardWelcome = document.querySelector('.top-bar h2');

        if (this.state.isLoggedIn) {
            // Show Mini Profile, Hide Login Button (or change it to Logout icon?)
            // Implementation: The original code hid auth-helper and showed mini-profile.
            // But we might want a Logout button accessible. 
            // For now, let's keep the sidebar clean: User Profile is visible.
            // We can make the Auth Button "Sign Out".

            authHelper.classList.remove('hidden'); // Show button container
            navLoginBtn.innerHTML = '<span class="material-icons-round">logout</span><span>Sign Out</span>';

            miniProfile.classList.remove('hidden');
            if (nameEl) nameEl.textContent = this.state.user.name;
            if (xpEl) xpEl.textContent = `Lvl ${this.state.user.level} • ${this.state.user.xp} XP`;
            if (avatarEl) avatarEl.textContent = this.state.user.name.charAt(0).toUpperCase();

            // Update Dashboard Welcome Message
            if (dashboardWelcome) {
                dashboardWelcome.textContent = `Welcome back, ${this.state.user.name}`;
            }

        } else {
            // Guest Mode
            authHelper.classList.remove('hidden');
            navLoginBtn.innerHTML = '<span class="material-icons-round">login</span><span>Sign In</span>';

            miniProfile.classList.add('hidden');

            if (dashboardWelcome) {
                dashboardWelcome.textContent = 'Welcome back, Guest';
            }
        }
    }

    showToast(message, type = 'info') {
        // Remove existing toast if any (to prevent stacking too many)
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;

        // Icon mapping
        let iconName = 'info';
        let title = 'Info';
        if (type === 'success') { iconName = 'check'; title = 'Success'; }
        if (type === 'error') { iconName = 'error'; title = 'Error'; }

        toast.innerHTML = `
            <div class="toast-icon">
                <span class="material-icons-round">${iconName}</span>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <div class="toast-progress">
                <div class="toast-progress-bar"></div>
            </div>
        `;

        document.body.appendChild(toast);

        // Trigger reflow
        void toast.offsetWidth;

        // Show
        toast.classList.add('show');

        // Play subtle sound (optional, kept silent for now)

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400); // Wait for transition
        }, 3000);
    }
}

// Global Instance
window.app = new App();
