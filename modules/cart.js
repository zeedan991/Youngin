import { auth } from './firebase_config.js';
import { db } from './firebase_config.js';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Cart state
let cart = {
    items: [],
    total: 0
};

// Initialize cart
export function initCart() {
    // Cart module initialized


    // Load cart from localStorage
    loadCartFromStorage();

    // Update cart badge
    updateCartBadge();

    // Setup cart icon click handler
    const cartIcon = document.getElementById('cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', toggleCartPanel);
    }

    // Setup close cart button
    const closeCart = document.getElementById('close-cart');
    if (closeCart) {
        closeCart.addEventListener('click', closeCartPanel);
    }
}

// Add item to cart
export function addToCart(product) {

    // Check if item already exists
    const existingItem = cart.items.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.items.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
            quantity: 1
        });
    }

    // Update total
    calculateTotal();

    // Save to storage
    saveCartToStorage();

    // Update UI
    updateCartBadge();
    renderCartItems();

    // Show success feedback
    showCartNotification(`${product.name} added to cart!`);

    // Sync to Firebase if logged in
    if (auth.currentUser) {
        syncCartToFirebase();
    }
}

// Remove item from cart
export function removeFromCart(productId) {
    cart.items = cart.items.filter(item => item.id !== productId);
    calculateTotal();
    saveCartToStorage();
    updateCartBadge();
    renderCartItems();

    if (auth.currentUser) {
        syncCartToFirebase();
    }
}

// Update item quantity
export function updateQuantity(productId, quantity) {
    const item = cart.items.find(item => item.id === productId);
    if (item) {
        item.quantity = Math.max(1, quantity);
        calculateTotal();
        saveCartToStorage();
        updateCartBadge();
        renderCartItems();

        if (auth.currentUser) {
            syncCartToFirebase();
        }
    }
}

// Calculate total
function calculateTotal() {
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Save cart to localStorage
function saveCartToStorage() {
    localStorage.setItem('youngin_cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCartFromStorage() {
    const saved = localStorage.getItem('youngin_cart');
    if (saved) {
        cart = JSON.parse(saved);
    }
}

// Update cart badge
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Toggle cart panel
function toggleCartPanel() {
    const panel = document.getElementById('cart-panel');
    if (panel) {
        const isOpen = panel.classList.contains('open');
        if (isOpen) {
            closeCartPanel();
        } else {
            openCartPanel();
        }
    }
}

// Open cart panel
function openCartPanel() {
    const panel = document.getElementById('cart-panel');
    const overlay = document.getElementById('cart-overlay');

    if (panel) {
        panel.classList.add('open');
        renderCartItems();
    }

    if (overlay) {
        overlay.classList.add('active');
        overlay.addEventListener('click', closeCartPanel);
    }
}

// Close cart panel
function closeCartPanel() {
    const panel = document.getElementById('cart-panel');
    const overlay = document.getElementById('cart-overlay');

    if (panel) {
        panel.classList.remove('open');
    }

    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Render cart items
function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    if (cart.items.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <span class="material-icons-round" style="font-size: 64px; color: #64748b;">shopping_cart</span>
                <h3>Your cart is empty</h3>
                <p>Add some items to get started!</p>
            </div>
        `;

        const cartTotal = document.getElementById('cart-total');
        if (cartTotal) cartTotal.textContent = '$0.00';

        return;
    }

    container.innerHTML = cart.items.map(item => `
        <div class="cart-item">
            <img src="${item.image || 'assets/placeholder.png'}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p class="cart-item-category">${item.category}</p>
                <p class="cart-item-price">$${item.price}</p>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-controls">
                    <button onclick="window.cartModule.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="window.cartModule.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
                <button class="btn-remove" onclick="window.cartModule.removeFromCart('${item.id}')">
                    <span class="material-icons-round">delete</span>
                </button>
            </div>
        </div>
    `).join('');

    const cartTotal = document.getElementById('cart-total');
    if (cartTotal) {
        cartTotal.textContent = `$${cart.total.toFixed(2)}`;
    }
}

// Show cart notification
function showCartNotification(message) {
    if (window.app && window.app.showToast) {
        window.app.showToast(message, 'success');
    } else {
        // Fallback if app not ready
        // Cart notification handled

        const notification = document.createElement('div');
        notification.className = 'toast-notification toast-success show';
        notification.innerHTML = `
            <div class="toast-icon"><span class="material-icons-round">check</span></div>
            <div class="toast-content"><div class="toast-title">Success</div><div class="toast-message">${message}</div></div>`;
        notification.style.position = 'fixed';
        notification.style.bottom = '30px';
        notification.style.right = '30px';
        notification.style.zIndex = '10000';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// Sync cart to Firebase
async function syncCartToFirebase() {
    if (!auth.currentUser) return;

    try {
        // Save cart to user's document
        const cartRef = collection(db, 'carts');
        const q = query(cartRef, where('userId', '==', auth.currentUser.uid));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            await addDoc(cartRef, {
                userId: auth.currentUser.uid,
                items: cart.items,
                total: cart.total,
                updatedAt: Date.now()
            });
        } else {
            const docRef = doc(db, 'carts', snapshot.docs[0].id);
            await updateDoc(docRef, {
                items: cart.items,
                total: cart.total,
                updatedAt: Date.now()
            });
        }
    } catch (error) {
        console.error('Error syncing cart:', error);
    }
}

// Load cart from Firebase
export async function loadCartFromFirebase() {
    if (!auth.currentUser) return;

    try {
        const cartRef = collection(db, 'carts');
        const q = query(cartRef, where('userId', '==', auth.currentUser.uid));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            cart.items = data.items || [];
            cart.total = data.total || 0;

            saveCartToStorage();
            updateCartBadge();
            renderCartItems();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

// Clear cart
export function clearCart() {
    cart = { items: [], total: 0 };
    saveCartToStorage();
    updateCartBadge();
    renderCartItems();

    if (auth.currentUser) {
        syncCartToFirebase();
    }
}

// Get cart
export function getCart() {
    return cart;
}

// Make functions globally available
window.cartModule = {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCart
};
