/**
 * Profile Module - Premium Edition
 * Renders User Statistics, Achievements, and Design History
 */

import { auth } from './firebase_config.js';
import { getDesigns, deleteDesign } from './db_service.js';

// Achievement definitions
const ACHIEVEMENTS = {
    first_design: { icon: '🎨', name: 'Creator', description: 'Created your first design', requirement: 1 },
    ten_designs: { icon: '🌟', name: 'Designer', description: 'Created 10 designs', requirement: 10 },
    fifty_designs: { icon: '💎', name: 'Expert', description: 'Created 50 designs', requirement: 50 },
    hundred_designs: { icon: '👑', name: 'Master', description: 'Created 100 designs', requirement: 100 },
    early_adopter: { icon: '🚀', name: 'Pioneer', description: 'Early platform adopter', requirement: 0 },
    active_creator: { icon: '⚡', name: 'Active', description: '7 day streak', requirement: 7 },
    social_butterfly: { icon: '🦋', name: 'Social', description: '10+ followers', requirement: 10 },
};

/**
 * Initialize Profile with User Data
 * @param {Object} app - App instance with user state
 */
export async function initProfile(app) {
    if (!app || !app.state || !app.state.user) return;

    const user = app.state.user;

    // Update Profile Header
    updateProfileHeader(user);

    // Calculate and display achievements
    await displayAchievements(user);

    // Fetch and Display Designs
    await loadUserDesigns(user);

    // Initialize animated counters
    animateCounters();
}

/**
 * Update Profile Header with User Data
 * @param {Object} user - User object
 */
function updateProfileHeader(user) {
    // Update Avatar
    const avatarEl = document.getElementById('profile-avatar-premium');
    if (avatarEl && user.name) {
        avatarEl.textContent = user.name.charAt(0).toUpperCase();
    }

    // Update Username
    const usernameEl = document.getElementById('profile-username-premium');
    if (usernameEl) {
        usernameEl.textContent = user.name || 'Guest';
    }

    // Update XP
    const xpEl = document.getElementById('profile-xp');
    if (xpEl) {
        xpEl.setAttribute('data-target', user.xp || 100);
    }

    // Calculate Level
    const level = Math.floor((user.xp || 100) / 100) + 1;
    const levelEl = document.getElementById('profile-level');
    if (levelEl) {
        levelEl.textContent = level;
    }

    // Calculate XP to next level
    const xpToNext = 100 - ((user.xp || 100) % 100);
    const xpNextEl = document.getElementById('xp-to-next');
    if (xpNextEl) {
        xpNextEl.textContent = xpToNext;
    }

    // Update progress bar
    const progress = ((user.xp || 100) % 100);
    const progressBar = document.querySelector('.xp-progress-fill');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }

    // Update Followers
    const followersEl = document.getElementById('profile-followers');
    if (followersEl) {
        followersEl.setAttribute('data-target', user.followers || 0);
    }

    // Update Streak
    const streakEl = document.getElementById('profile-streak');
    if (streakEl) {
        streakEl.setAttribute('data-target', user.streak || 4);
    }

    // Calculate tier
    const tier = getTier(level);
    const tierEl = document.getElementById('user-tier');
    if (tierEl) {
        tierEl.textContent = tier;
        tierEl.className = `tier-badge tier-${tier.toLowerCase()}`;
    }


    // Calculate credibility score
    const credibility = calculateCredibility(user);
    const credibilityEl = document.getElementById('credibility-score');
    if (credibilityEl) {
        animateValue(credibilityEl, 0, credibility, 1500); // Animated counter
        // Update circular progress if it exists (assuming it uses a stroke-dasharray)
        const circle = document.querySelector('.credibility-ring-circle');
        if (circle) {
            const radius = circle.r.baseVal.value;
            const circumference = radius * 2 * Math.PI;
            const offset = circumference - (credibility / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }
    }

    // Save updated stats to DB
    saveComputedStats(user, credibility);
}

/**
 * Calculate user tier based on level
 */
function getTier(level) {
    if (level >= 50) return 'Diamond';
    if (level >= 30) return 'Platinum';
    if (level >= 15) return 'Gold';
    if (level >= 5) return 'Silver';
    return 'Bronze';
}

/**
 * Calculate credibility score (Balanced & Gamified)
 * Formula: (Designs * 2) + (Followers * 5) + (XP / 100) + (Streak * 5)
 * Capped at 100%
 */
function calculateCredibility(user) {
    const designs = user.designCount || 0;
    const followers = user.followers || 0;
    const xp = user.xp || 100;
    const streak = user.streak || 1; // Minimum 1 day if active

    let score = 0;
    score += designs * 2;       // 20 designs = 40 pts
    score += followers * 5;     // 10 followers = 50 pts
    score += xp / 100;          // 500 XP = 5 pts
    score += streak * 3;        // 7 day streak = 21 pts

    return Math.min(100, Math.floor(score));
}

/**
 * Helper to animate numbers
 */
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.textContent = Math.floor(progress * (end - start) + start) + "%";
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

/**
 * Display achievements based on user progress
 */
async function displayAchievements(user) {
    const container = document.getElementById('achievements-grid');
    if (!container) return;

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Get design count
    const designs = await getDesigns(currentUser.uid);
    const designCount = designs.length;

    // Check which achievements are unlocked
    const unlocked = [];

    // Design Milestones
    if (designCount >= 1) unlocked.push('first_design');
    if (designCount >= 10) unlocked.push('ten_designs');
    if (designCount >= 50) unlocked.push('fifty_designs');
    if (designCount >= 100) unlocked.push('hundred_designs');

    // Engagement Milestones
    unlocked.push('early_adopter'); // Everyone is an early adopter for now
    if ((user.streak || 0) >= 7) unlocked.push('active_creator');
    if ((user.followers || 0) >= 10) unlocked.push('social_butterfly');

    // Notify for new achievements (Simple check: local storage vs current)
    checkNewAchievements(unlocked);

    // Render achievements
    container.innerHTML = Object.entries(ACHIEVEMENTS).map(([key, achievement]) => {
        const isUnlocked = unlocked.includes(key);
        // Add specific class for unlocked
        const statusClass = isUnlocked ? 'unlocked' : 'locked';

        return `
            <div class="achievement-badge ${statusClass}" 
                 title="${achievement.description} (${achievement.requirement > 0 ? `Req: ${achievement.requirement}` : 'Special'})">
                <div class="badge-icon">${achievement.icon}</div>
                <div class="badge-name">${achievement.name}</div>
                ${isUnlocked ? '<div class="shine-effect"></div>' : ''}
            </div>
        `;
    }).join('');

    // Update achievement count
    const countEl = document.getElementById('achievement-count');
    if (countEl) {
        countEl.textContent = `${unlocked.length}/${Object.keys(ACHIEVEMENTS).length} Unlocked`;
    }
}

/**
 * Check and notify for newly unlocked achievements
 */
function checkNewAchievements(currentUnlocked) {
    const stored = localStorage.getItem('youngin_unlocked_achievements');
    const previous = stored ? JSON.parse(stored) : [];

    // Find difference
    const newBadges = currentUnlocked.filter(x => !previous.includes(x));

    if (newBadges.length > 0) {
        newBadges.forEach(key => {
            const badge = ACHIEVEMENTS[key];
            if (window.app && window.app.showToast) {
                setTimeout(() => {
                    window.app.showToast(`Achievement Unlocked: ${badge.name} ${badge.icon}`, 'success');
                }, 1000); // Small delay for effect
            }
        });

        // Update storage
        localStorage.setItem('youngin_unlocked_achievements', JSON.stringify(currentUnlocked));

        // Save to Firebase
        if (auth.currentUser) {
            import('./db_service.js').then(({ updateGamificationStats }) => {
                updateGamificationStats(auth.currentUser.uid, {
                    badges: currentUnlocked
                });
            });
        }
    }
}

/**
 * Persist computed stats (Credibility, Level) if they've changed
 */
async function saveComputedStats(user, credibility) {
    if (!auth.currentUser) return;

    // We only save if there's a meaningful change to avoid write spam, 
    // but for now, we'll save on profile load to ensure sync.
    // In a real app, check diff before saving.

    const { updateGamificationStats } = await import('./db_service.js');

    // Recalculate level just in case (e.g. 100 XP per level)
    const currentLevel = Math.floor((user.xp || 0) / 100) + 1;

    updateGamificationStats(auth.currentUser.uid, {
        credibility: credibility,
        level: currentLevel,
        // We ensure these exist
        xp: user.xp || 0,
        streak: user.streak || 0
    });
}

/**
 * Animate stat counters on page load
 */
function animateCounters() {
    const counters = document.querySelectorAll('[data-target]');

    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 1500;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };

        updateCounter();
    });
}

/**
 * Load and Display User Designs from Firebase
 * @param {Object} user - User object
 */
async function loadUserDesigns(user) {
    const historyContainer = document.getElementById('design-history');
    if (!historyContainer) return;

    // Show loading state
    historyContainer.innerHTML = '<div class="loading-designs">Loading your designs...</div>';

    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            historyContainer.innerHTML = '<div class="empty-state-text">Please log in to view your designs.</div>';
            return;
        }

        const designs = await getDesigns(currentUser.uid);

        if (!designs || designs.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state-premium">
                    <div class="empty-icon">🎨</div>
                    <h3>No Designs Yet</h3>
                    <p>Start creating your first masterpiece in the Studio!</p>
                    <button class="btn-primary gradient-btn" onclick="window.app.navigateTo('custom-design')">
                        Create Design
                    </button>
                </div>
            `;
            return;
        }

        // Render designs
        renderDesigns(designs, historyContainer);

    } catch (error) {
        console.error('Error loading designs:', error);
        historyContainer.innerHTML = '<div class="error-state">Failed to load designs. Please try again.</div>';
    }
}

/**
 * Render Designs with Premium Cards
 */
function renderDesigns(designs, container) {
    const renderImg = (design) => {
        if (design.image && (design.image.startsWith('data:') || design.image.startsWith('http'))) {
            return `<img src="${design.image}" alt="${design.name || 'Design'}">`;
        }
        if (design.preview && (design.preview.startsWith('data:') || design.preview.startsWith('http'))) {
            return `<img src="${design.preview}" alt="${design.name || 'Design'}">`;
        }
        const garmentEmojis = { 'tshirt': '👕', 'hoodie': '🧥', 'pants': '👖' };
        const emoji = garmentEmojis[design.garmentType || design.garment] || '👕';
        return `<span class="design-emoji">${emoji}</span>`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Recently';
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    container.innerHTML = designs.map(design => `
        <div class="design-card-premium glass-panel" data-design-id="${design.id}">
            <div class="design-thumbnail">
                ${renderImg(design)}
                <div class="design-overlay">
                    <button class="quick-action" onclick="editDesign('${design.id}')" title="Edit">
                        <span class="material-icons-round">edit</span>
                    </button>
                    <button class="quick-action" onclick="shareDesign('${design.id}')" title="Share">
                        <span class="material-icons-round">share</span>
                    </button>
                    <button class="quick-action delete-action" onclick="confirmDeleteDesign('${design.id}')" title="Delete">
                        <span class="material-icons-round">delete</span>
                    </button>
                </div>
                <div class="design-status-badge">Published</div>
            </div>
            <div class="design-info-premium">
                <h4>${design.name || 'Untitled Design'}</h4>
                <p class="design-date">${formatDate(design.createdAt)}</p>
                <div class="design-stats-mini">
                    <span><span class="material-icons-round">visibility</span> ${Math.floor(Math.random() * 50)}</span>
                    <span><span class="material-icons-round">favorite</span> ${Math.floor(Math.random() * 10)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Confirm and delete design
 */
window.confirmDeleteDesign = async function (designId) {
    if (!confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
        return;
    }

    const card = document.querySelector(`[data-design-id="${designId}"]`);
    if (card) {
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';
    }

    try {
        await deleteDesign(designId);

        // Animate removal
        if (card) {
            card.style.transform = 'scale(0.8)';
            card.style.opacity = '0';
            setTimeout(() => {
                card.remove();

                // Check if no designs left
                const container = document.getElementById('design-history');
                if (container && container.children.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state-premium">
                            <div class="empty-icon">🎨</div>
                            <h3>No Designs Yet</h3>
                            <p>Start creating your first masterpiece in the Studio!</p>
                            <button class="btn-primary gradient-btn" onclick="window.app.navigateTo('custom-design')">
                                Create Design
                            </button>
                        </div>
                    `;
                }
            }, 300);
        }

        // Show success message
        if (window.app && window.app.showToast) {
            window.app.showToast('Design deleted successfully');
        }

    } catch (error) {
        console.error('Error deleting design:', error);
        if (window.app && window.app.showToast) {
            window.app.showToast('Failed to delete design. Please try again.', 'error');
        }
        if (card) {
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
        }
    }
};

/**
 * Edit design (load into studio)
 */
window.editDesign = function (designId) {

    if (window.app && window.app.showToast) {
        window.app.showToast('Edit functionality coming soon!', 'info');
    }
};

/**
 * Share design
 */
window.shareDesign = function (designId) {
    const shareUrl = `${window.location.origin}${window.location.pathname}?design=${designId}`;

    if (navigator.share) {
        navigator.share({
            title: 'Check out my design on YOUNGIN',
            text: 'I created this custom design on YOUNGIN!',
            url: shareUrl
        }).catch(() => {
            // Fallback to copy
            copyToClipboard(shareUrl);
        });
    } else {
        copyToClipboard(shareUrl);
    }
};

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        if (window.app && window.app.showToast) {
            window.app.showToast('Link copied to clipboard!', 'success');
        }
    });
}
