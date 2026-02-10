/**
 * AI Sizing Module 
 *
 */

export function initAiSizing() {
    console.log('AI Sizing Module: Not loaded in MVP mode.');
    const btn = document.getElementById('start-scan-btn');
    if (btn) {
        btn.onclick = () => alert("AI Scanning is disabled in this MVP demo version.");
    }
}
