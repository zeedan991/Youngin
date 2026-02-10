/**
 * Social & Local Hub Module
 * Premium tailor directory with contact functionality and luxury Rich & Rare section with VIP subscriptions
 */

export function initLocalHub() {
    const grid = document.getElementById('tailor-grid');
    if (!grid) return;

    // Premium Tailors with detailed profiles - 9 TAILORS
    const tailors = [
        {
            id: 1,
            name: "Master Stitch",
            location: "Downtown",
            distance: "2.3 km",
            rating: 4.9,
            reviews: 234,
            specialties: ["Custom Suits", "Alterations", "Wedding"],
            years: "15+",
            projects: "1.2k",
            priceRange: "$$",
            phone: "+1 (555) 123-4567",
            email: "contact@masterstitch.com",
            verified: true,
            pro: true,
            image: "https://ui-avatars.com/api/?name=Master+Stitch&background=8b5cf6&color=fff&size=80"
        },
        {
            id: 2,
            name: "The Hemming House",
            location: "Westside",
            distance: "3.8 km",
            rating: 4.7,
            reviews: 189,
            specialties: ["Casual Wear", "Repairs", "Denim"],
            years: "10+",
            projects: "850",
            priceRange: "$",
            phone: "+1 (555) 234-5678",
            email: "info@hemminghouse.com",
            verified: true,
            pro: false,
            image: "https://ui-avatars.com/api/?name=Hemming+House&background=ec4899&color=fff&size=80"
        },
        {
            id: 3,
            name: "Sew What?",
            location: "Uptown",
            distance: "1.5 km",
            rating: 4.5,
            reviews: 156,
            specialties: ["Embroidery", "Custom Designs", "Patches"],
            years: "8+",
            projects: "620",
            priceRange: "$",
            phone: "+1 (555) 345-6789",
            email: "hello@sewwhat.com",
            verified: false,
            pro: false,
            image: "https://ui-avatars.com/api/?name=Sew+What&background=06b6d4&color=fff&size=80"
        },
        {
            id: 4,
            name: "Elegant Threads",
            location: "Midtown",
            distance: "2.8 km",
            rating: 4.8,
            reviews: 298,
            specialties: ["Evening Gowns", "Formal Wear", "Bridal"],
            years: "20+",
            projects: "1.5k",
            priceRange: "$$$",
            phone: "+1 (555) 456-7890",
            email: "info@elegantthreads.com",
            verified: true,
            pro: true,
            image: "https://ui-avatars.com/api/?name=Elegant+Threads&background=f59e0b&color=fff&size=80"
        },
        {
            id: 5,
            name: "Urban Fit Studio",
            location: "East Side",
            distance: "4.2 km",
            rating: 4.6,
            reviews: 167,
            specialties: ["Streetwear", "Athletic Wear", "Hoodies"],
            years: "6+",
            projects: "540",
            priceRange: "$$",
            phone: "+1 (555) 567-8901",
            email: "contact@urbanfit.com",
            verified: true,
            pro: false,
            image: "https://ui-avatars.com/api/?name=Urban+Fit&background=10b981&color=fff&size=80"
        },
        {
            id: 6,
            name: "Classic Couture",
            location: "Old Town",
            distance: "5.1 km",
            rating: 4.9,
            reviews: 412,
            specialties: ["Vintage Restoration", "Bespoke Tailoring", "Luxury"],
            years: "25+",
            projects: "2.1k",
            priceRange: "$$$",
            phone: "+1 (555) 678-9012",
            email: "info@classiccouture.com",
            verified: true,
            pro: true,
            image: "https://ui-avatars.com/api/?name=Classic+Couture&background=d946ef&color=fff&size=80"
        },
        {
            id: 7,
            name: "Quick Fix Tailors",
            location: "South End",
            distance: "1.9 km",
            rating: 4.4,
            reviews: 89,
            specialties: ["Same Day Service", "Basic Alterations", "Hemming"],
            years: "5+",
            projects: "380",
            priceRange: "$",
            phone: "+1 (555) 789-0123",
            email: "hello@quickfix.com",
            verified: false,
            pro: false,
            image: "https://ui-avatars.com/api/?name=Quick+Fix&background=ef4444&color=fff&size=80"
        },
        {
            id: 8,
            name: "Artisan Alterations",
            location: "Arts District",
            distance: "3.3 km",
            rating: 4.7,
            reviews: 203,
            specialties: ["Designer Pieces", "Leather Work", "Accessories"],
            years: "12+",
            projects: "920",
            priceRange: "$$",
            phone: "+1 (555) 890-1234",
            email: "contact@artisanalterations.com",
            verified: true,
            pro: true,
            image: "https://ui-avatars.com/api/?name=Artisan+Alt&background=3b82f6&color=fff&size=80"
        },
        {
            id: 9,
            name: "Precision Tailoring",
            location: "Business District",
            distance: "2.6 km",
            rating: 4.8,
            reviews: 276,
            specialties: ["Corporate Wear", "Shirts", "Pants"],
            years: "18+",
            projects: "1.3k",
            priceRange: "$$",
            phone: "+1 (555) 901-2345",
            email: "info@precisiontailoring.com",
            verified: true,
            pro: true,
            image: "https://ui-avatars.com/api/?name=Precision+Tailor&background=14b8a6&color=fff&size=80"
        },
    ];

    grid.innerHTML = tailors.map(t => `
        <div class="tailor-card-premium">
            <div class="tailor-header">
                <img src="${t.image}" class="tailor-avatar" alt="${t.name}">
                <div class="tailor-badges">
                    ${t.verified ? '<span class="badge-verified">✓ Verified</span>' : ''}
                    ${t.pro ? '<span class="badge-pro">PRO</span>' : ''}
                </div>
            </div>
            
            <div class="tailor-info">
                <h3>${t.name}</h3>
                <p class="tailor-location">
                    <span class="material-icons-round">location_on</span>
                    ${t.location}, ${t.distance} away
                </p>
                
                <div class="tailor-rating">
                    <span class="stars">${'★'.repeat(Math.floor(t.rating))}${'☆'.repeat(5 - Math.floor(t.rating))}</span>
                    <span class="rating-value">${t.rating}</span>
                    <span class="reviews">(${t.reviews} reviews)</span>
                </div>
                
                <div class="tailor-specialties">
                    ${t.specialties.map(s => `<span class="specialty-tag">${s}</span>`).join('')}
                </div>
                
                <div class="tailor-stats">
                    <div class="stat">
                        <span class="stat-value">${t.years}</span>
                        <span class="stat-label">Years</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${t.projects}</span>
                        <span class="stat-label">Projects</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${t.priceRange}</span>
                        <span class="stat-label">Price</span>
                    </div>
                </div>
                
                <div class="tailor-actions">
                    <button class="btn-primary" onclick="contactTailor(${t.id}, '${t.name}', '${t.email}')">
                        <span class="material-icons-round">chat</span>
                        Contact
                    </button>
                    <button class="btn-outline" onclick="bookTailor(${t.id}, '${t.name}')">
                        <span class="material-icons-round">calendar_today</span>
                        Book
                    </button>
                    <button class="btn-icon" onclick="callTailor('${t.phone}')">
                        <span class="material-icons-round">phone</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Also init Rich Section
    initRichSection();
}

function initRichSection() {
    const grid = document.getElementById('rich-grid');
    if (!grid) return;

    // EXPANDED LUXURY ITEMS - 9 ITEMS
    const luxuryItems = [
        {
            id: 1,
            name: "Diamond Encrusted Rolex",
            price: "$45,000",
            description: "Limited edition timepiece with 2.5ct diamonds",
            image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&h=500&fit=crop",
            brand: "Rolex x YOUNGIN",
            vipOnly: true,
            earlyAccess: false
        },
        {
            id: 2,
            name: "1-of-1 LV Jacket",
            price: "$12,000",
            description: "Exclusive custom Louis Vuitton collaboration",
            image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop",
            brand: "Louis Vuitton",
            vipOnly: false,
            earlyAccess: true
        },
        {
            id: 3,
            name: "Rare Jordan 1 (1985)",
            price: "$25,000",
            description: "Original 1985 release, mint condition",
            image: "https://images.unsplash.com/photo-1556906781-9cba4a6f5e4e?w=400&h=500&fit=crop",
            brand: "Nike Jordan",
            vipOnly: true,
            earlyAccess: false
        },
        {
            id: 4,
            name: "Hermès Birkin 30",
            price: "$35,000",
            description: "Rare crocodile leather, rose gold hardware",
            image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=500&fit=crop",
            brand: "Hermès",
            vipOnly: true,
            earlyAccess: false
        },
        {
            id: 5,
            name: "Gucci x Dapper Dan",
            price: "$8,500",
            description: "Limited capsule collection piece",
            image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop",
            brand: "Gucci",
            vipOnly: false,
            earlyAccess: true
        },
        {
            id: 6,
            name: "Balenciaga Triple S",
            price: "$1,850",
            description: "Exclusive colorway, limited to 100 pairs",
            image: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&h=500&fit=crop",
            brand: "Balenciaga",
            vipOnly: false,
            earlyAccess: true
        },
        {
            id: 7,
            name: "Patek Philippe Nautilus",
            price: "$85,000",
            description: "Rose gold, blue dial, full set",
            image: "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=400&h=500&fit=crop",
            brand: "Patek Philippe",
            vipOnly: true,
            earlyAccess: false
        },
        {
            id: 8,
            name: "Off-White x Nike",
            price: "$4,200",
            description: "The Ten collection, deadstock",
            image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop",
            brand: "Off-White",
            vipOnly: false,
            earlyAccess: true
        },
        {
            id: 9,
            name: "Chanel Classic Flap",
            price: "$9,800",
            description: "Medium, caviar leather, gold hardware",
            image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=500&fit=crop",
            brand: "Chanel",
            vipOnly: true,
            earlyAccess: false
        },
    ];

    // Add VIP subscription banner before items
    const vipBanner = `
        <div class="vip-subscription-banner" style="grid-column: 1 / -1; margin-bottom: 30px;">
            <div class="vip-banner-content">
                <div class="vip-icon">👑</div>
                <div class="vip-text">
                    <h2>Become a VIP Member</h2>
                    <p>Get early access to rare items, exclusive discounts, and priority support</p>
                </div>
                <button class="btn-vip-subscribe" onclick="showVIPPlans()">View Plans</button>
            </div>
        </div>
    `;

    grid.innerHTML = vipBanner + luxuryItems.map(item => `
        <div class="luxury-item ${item.vipOnly ? 'vip-only' : ''}">
            <img src="${item.image}" alt="${item.name}" onerror="this.src='assets/placeholder.png'">
            ${item.vipOnly ? '<div class="vip-lock-badge">🔒 VIP Only</div>' : ''}
            ${item.earlyAccess ? '<div class="early-access-badge">⚡ Early Access</div>' : ''}
            <div class="luxury-overlay">
                <span class="designer-name">${item.brand}</span>
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <p class="gold-price" style="font-size: 24px; font-weight: 700; color: #d4af37; margin: 12px 0;">${item.price}</p>
                <button class="btn-luxury" onclick="requestLuxuryAccess(${item.id}, '${item.name}', '${item.price}', ${item.vipOnly})">
                    ${item.vipOnly ? 'VIP Access Required' : 'Request Access'}
                </button>
            </div>
        </div>
    `).join('');
}

// Global functions for tailor interactions
window.contactTailor = (id, name, email) => {
    const message = `Hi! I found your profile on YOUNGIN and I'm interested in your tailoring services. Could we discuss a custom project?`;
    const subject = `YOUNGIN Inquiry - Custom Tailoring`;

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
};

window.bookTailor = (id, name) => {
    if (window.app) window.app.showToast('Booking feature coming soon!', 'info');
};

window.callTailor = (phone) => {
    if (confirm(`📞 Call ${phone}?\n\nThis will open your phone app.`)) {
        window.location.href = `tel:${phone}`;
    }
};

// VIP Subscription Plans - Now handled by vip_modal.js

// Global function for luxury access requests
window.requestLuxuryAccess = (id, name, price, vipOnly) => {
    if (vipOnly) {
        // Show VIP modal instead of confirm dialog
        if (window.showVIPPlans) {
            window.showVIPPlans();
        }
        return;
    }

    // For non-VIP items, show success message
    if (window.app) window.app.showToast('Luxury request submitted! We will contact you shortly.', 'success');

};

