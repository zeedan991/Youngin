/**
 * Marketplace Module
 * Renders premium product grids with working Add to Cart functionality
 */

const products = [
    {
        id: 1,
        name: "Vintage Nike Hoodie",
        price: 45,
        originalPrice: 65,
        type: "Thrift",
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=200&fit=crop",
        rating: 4.8,
        reviews: 127,
        isNew: true,
        discount: 31
    },
    {
        id: 2,
        name: "Yeezy Gap Clone",
        price: 120,
        originalPrice: 150,
        type: "International",
        image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&h=200&fit=crop",
        rating: 4.9,
        reviews: 89,
        isNew: false,
        discount: 20
    },
    {
        id: 3,
        name: "Custom Anime Tee",
        price: 35,
        originalPrice: 45,
        type: "Local",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=200&fit=crop",
        rating: 4.7,
        reviews: 203,
        isNew: true,
        discount: 22
    },
    {
        id: 4,
        name: "Jordan 1 Retro",
        price: 250,
        originalPrice: 300,
        type: "Sneakers",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=200&fit=crop",
        rating: 5.0,
        reviews: 456,
        isNew: false,
        discount: 17
    },
    {
        id: 5,
        name: "Levi's 501 (1990)",
        price: 80,
        originalPrice: 100,
        type: "Thrift",
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=200&fit=crop",
        rating: 4.6,
        reviews: 78,
        isNew: false,
        discount: 20
    },
    {
        id: 6,
        name: "Supreme Box Logo",
        price: 400,
        originalPrice: 500,
        type: "International",
        image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=300&h=200&fit=crop",
        rating: 4.9,
        reviews: 312,
        isNew: true,
        discount: 20
    },
    {
        id: 7,
        name: "Vintage Denim Jacket",
        price: 85,
        originalPrice: 120,
        type: "Thrift",
        image: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=300&h=200&fit=crop",
        rating: 4.7,
        reviews: 45,
        isNew: true,
        discount: 29
    },
    {
        id: 8,
        name: "Chunky Platform Sneakers",
        price: 180,
        originalPrice: 220,
        type: "Sneakers",
        image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=300&h=200&fit=crop",
        rating: 4.8,
        reviews: 112,
        isNew: true,
        discount: 18
    },
    {
        id: 9,
        name: "Urban Cargo Pants",
        price: 65,
        originalPrice: 85,
        type: "Local",
        image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=200&fit=crop",
        rating: 4.5,
        reviews: 67,
        isNew: false,
        discount: 24
    },
    {
        id: 10,
        name: "Varsity Bomber Jacket",
        price: 220,
        originalPrice: 280,
        type: "International",
        image: "https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=300&h=200&fit=crop",
        rating: 4.9,
        reviews: 203,
        isNew: true,
        discount: 21
    },
    {
        id: 11,
        name: "Oversized Graphic Tee",
        price: 45,
        originalPrice: 60,
        type: "Local",
        image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=300&h=200&fit=crop",
        rating: 4.6,
        reviews: 156,
        isNew: false,
        discount: 25
    },
    {
        id: 12,
        name: "High-Top Retro Sneakers",
        price: 140,
        originalPrice: 170,
        type: "Sneakers",
        image: "https://images.unsplash.com/photo-1560769622-515bab3d274f?w=300&h=200&fit=crop",
        rating: 4.8,
        reviews: 89,
        isNew: false,
        discount: 18
    },
    {
        id: 13,
        name: "Distressed Dad Hat",
        price: 25,
        originalPrice: 35,
        type: "Thrift",
        image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89f?w=300&h=200&fit=crop",
        rating: 4.4,
        reviews: 42,
        isNew: true,
        discount: 28
    },
    {
        id: 14,
        name: "Tech Fleece Joggers",
        price: 95,
        originalPrice: 130,
        type: "International",
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&h=200&fit=crop",
        rating: 4.7,
        reviews: 134,
        isNew: false,
        discount: 27
    },
];

export function initMarketplace() {
    const grid = document.getElementById('market-grid');
    if (!grid) return;

    renderProducts(products, grid);

    // Setup Filters
    const filters = document.querySelectorAll('.filter-chip');
    filters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // UI Update
            filters.forEach(f => f.classList.remove('active'));
            e.target.classList.add('active');

            // Filter Logic
            const category = e.target.textContent;
            const filtered = category === 'All'
                ? products
                : products.filter(p => p.type === category);

            renderProducts(filtered, grid);
        });
    });
}

function renderProducts(items, container) {
    container.innerHTML = items.map(item => `
        <div class="product-card-premium">
            <div class="product-image-wrapper">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='assets/placeholder.png'">
                <div class="product-badges">
                    ${item.isNew ? '<span class="badge-new">NEW</span>' : ''}
                    ${item.discount ? `<span class="badge-sale">-${item.discount}%</span>` : ''}
                </div>
                <button class="btn-wishlist" onclick="toggleWishlist(${item.id})">
                    <span class="material-icons-round">favorite_border</span>
                </button>
            </div>
            
            <div class="product-details">
                <span class="product-category">${item.type}</span>
                <h4>${item.name}</h4>
                
                <div class="product-rating">
                    <span class="stars">${'★'.repeat(Math.floor(item.rating))}${'☆'.repeat(5 - Math.floor(item.rating))}</span>
                    <span class="reviews">(${item.reviews})</span>
                </div>
                
                <div class="product-price">
                    <span class="price-now">$${item.price}</span>
                    ${item.originalPrice ? `<span class="price-was">$${item.originalPrice}</span>` : ''}
                    ${item.discount ? `<span class="discount">-${item.discount}%</span>` : ''}
                </div>
                
                <button class="btn-add-cart" onclick="addToCartFromMarket(${item.id}, '${item.name}', ${item.price}, '${item.image}', '${item.type}')">
                    <span class="material-icons-round">shopping_cart</span>
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// Global function for adding to cart from marketplace
window.addToCartFromMarket = (id, name, price, image, category) => {
    if (window.cartModule && window.cartModule.addToCart) {
        window.cartModule.addToCart({
            id: id.toString(),
            name: name,
            price: price,
            image: image,
            category: category
        });
    } else {
        console.error('Cart module not initialized');
        if (window.app && window.app.showToast) {
            window.app.showToast('Cart is loading, please try again.', 'error');
        }
    }
};

// Global function for wishlist toggle
const wishlist = new Set(); // Initialize a Set to store wishlist item IDs
window.toggleWishlist = (id) => {
    const btn = event.target.closest('.btn-wishlist');
    // No need to query for icon if we're replacing innerHTML
    // const icon = btn.querySelector('.material-icons-round');

    if (wishlist.has(id)) {
        wishlist.delete(id);
        btn.innerHTML = '<span class="material-icons-round">favorite_border</span>';
    } else {
        wishlist.add(id);
        btn.innerHTML = '<span class="material-icons-round">favorite</span>';
    }
};
