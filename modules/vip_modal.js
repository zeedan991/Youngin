// VIP Modal Functions
export const showVIPPlans = () => {
    const modal = document.getElementById('vip-modal');
    const overlay = document.getElementById('vip-modal-overlay');

    if (modal && overlay) {
        modal.classList.add('active');
        overlay.classList.add('active');
    }
};

export const closeVIPModal = () => {
    const modal = document.getElementById('vip-modal');
    const overlay = document.getElementById('vip-modal-overlay');

    if (modal && overlay) {
        modal.classList.remove('active');
        overlay.classList.remove('active');
    }
};

export const subscribeToPlan = (plan, price) => {
    if (window.app) window.app.showToast(`VIP Subscription Initiated for ${plan}!`, 'success');
    closeVIPModal();
};

export function initVipModal() {
    const closeBtn = document.getElementById('close-vip-modal');
    const overlay = document.getElementById('vip-modal-overlay');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeVIPModal);
    }

    if (overlay) {
        overlay.addEventListener('click', closeVIPModal);
    }

    // Attach to window for inline HTML handlers
    window.showVIPPlans = showVIPPlans;
    window.closeVIPModal = closeVIPModal;
    window.subscribeToPlan = subscribeToPlan;
}
