/**
 * Berlin Konuşuyor <> Antigravity OS Bridge
 * This module connects the app to the local orchestration server
 * providing real-time telemetry and error reporting.
 */

const SERVER_URL = 'http://localhost:8080/api/notify';

export function initBridge() {
    console.log('[Antigravity Bridge] Initializing connection to OS...');

    // 1. Heartbeat on Startup
    notifyOS('info', 'Uygulama Başlatıldı', 'Berlin Konuşuyor V4.0 sistemi başarıyla yüklendi.');

    // 2. Global Error Capture
    window.addEventListener('error', (event) => {
        const msg = `${event.message} at ${event.filename}:${event.lineno}`;
        notifyOS('error', 'Runtime Hatası', msg);
    });

    // 3. Unhandled Promise Rejections
    window.addEventListener('unhandledrejection', (event) => {
        notifyOS('warning', 'Ağ/Veri Hatası', event.reason);
    });
}

/**
 * Send a notification to the Antigravity OS Dashboard
 */
export async function notifyOS(type, title, message) {
    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, title, message })
        });

        // Update UI Indicator
        const indicator = document.getElementById('agConnectionIndicator');
        if (indicator) {
            indicator.style.borderColor = '#00ff88'; // Vibrant green when talking to server
            indicator.style.color = '#00ff88';
            const dot = indicator.querySelector('.ag-status-dot');
            if (dot) dot.style.background = '#00ff88';
        }
    } catch (e) {
        const indicator = document.getElementById('agConnectionIndicator');
        if (indicator) {
            indicator.style.borderColor = 'rgba(255, 0, 0, 0.2)';
            indicator.style.color = 'var(--text-muted)';
        }
    }
}

