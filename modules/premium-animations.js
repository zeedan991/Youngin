// Premium UI Animations - Counter and Scroll Effects

// Animated Counter Function
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Initialize counters when dashboard loads
function initDashboardCounters() {
    const statValues = document.querySelectorAll('.stat-value-dash[data-target]');

    statValues.forEach(element => {
        const target = parseInt(element.getAttribute('data-target'));
        // Delay animation slightly for stagger effect
        setTimeout(() => {
            animateCounter(element, target);
        }, 300);
    });

    // Handle nested spans (like rank)
    const nestedSpans = document.querySelectorAll('.stat-value-dash span[data-target]');
    nestedSpans.forEach(element => {
        const target = parseInt(element.getAttribute('data-target'));
        setTimeout(() => {
            animateCounter(element, target);
        }, 300);
    });
}

// Scroll Animation Observer
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');

                // Trigger counter animation for stats
                if (entry.target.classList.contains('stat-item-hero')) {
                    const numberElement = entry.target.querySelector('.stat-number-hero');
                    if (numberElement && !numberElement.classList.contains('counted')) {
                        numberElement.classList.add('counted');
                        const text = numberElement.textContent;
                        const number = parseInt(text.replace(/[^0-9]/g, ''));
                        if (!isNaN(number)) {
                            animateCounter(numberElement, number, 1500);
                        }
                    }
                }
            }
        });
    }, observerOptions);

    // Observe elements
    const animatedElements = document.querySelectorAll('.feature-card, .stat-item-hero, .step');
    animatedElements.forEach(el => observer.observe(el));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initScrollAnimations();
    });
} else {
    initScrollAnimations();
}

// Initialize dashboard counters when navigating to dashboard
document.addEventListener('sectionChanged', (e) => {
    if (e.detail === 'dashboard') {
        setTimeout(initDashboardCounters, 100);
    }
});

// Also init on page load if dashboard is active
window.addEventListener('load', () => {
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection && dashboardSection.classList.contains('active')) {
        initDashboardCounters();
    }
});
