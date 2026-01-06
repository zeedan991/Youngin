// VIP Modal Functions
window.showVIPPlans = () => {
    const modal = document.getElementById('vip-modal');
    const overlay = document.getElementById('vip-modal-overlay');

    if (modal && overlay) {
        modal.classList.add('active');
        overlay.classList.add('active');
    }
};

window.closeVIPModal = () => {
    const modal = document.getElementById('vip-modal');
    const overlay = document.getElementById('vip-modal-overlay');

    if (modal && overlay) {
        modal.classList.remove('active');
        overlay.classList.remove('active');
    }
};

window.subscribeToPlan = (plan, price) => {
    if (window.app) window.app.showToast(`VIP Subscription Initiated for ${plan}!`, 'success');
    closeVIPModal();
};

// Initialize VIP modal close handlers
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('close-vip-modal');
    const overlay = document.getElementById('vip-modal-overlay');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeVIPModal);
    }

    if (overlay) {
        overlay.addEventListener('click', closeVIPModal);
    }
});
