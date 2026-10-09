// modules/paymentTerminal.js
// v2.0.0 — 2026-10-03
// Терминал теперь с фото (payment-terminal.png). Динамические надписи
// (сумма / обработка / успех) выводятся прямо поверх экрана на фото.
// По-прежнему ИМИТАЦИЯ: реального приёма карт нет, деньги не двигаются.
// API не изменился: openPaymentTerminal({ amount, orderNumber, lineItems, onComplete, onCancel })

let injected = false;

function injectStylesOnce() {
    if (injected) return;
    injected = true;
    const style = document.createElement('style');
    style.textContent = `
        .pt-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.93); z-index: 5000; overflow-y: auto; opacity: 0; transition: opacity 0.25s; font-family: 'Share Tech Mono', monospace; }
        .pt-overlay.pt-visible { opacity: 1; }
        .pt-inner { min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 0; gap: 14px; }
        .pt-device { position: relative; width: min(320px, 78vw); }
        .pt-device img { width: 100%; display: block; user-select: none; pointer-events: none; }
        .pt-screen {
            position: absolute; left: 33.5%; top: 32.2%; width: 33.4%; height: 18.4%;
            background: linear-gradient(#1b6ee8, #0a4fc4); color: #fff; text-align: center;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            cursor: pointer; overflow: hidden; border-radius: 2px;
            font-size: calc(min(320px, 78vw) * 0.03);
        }
        .pt-screen.pt-pulsing { animation: pt-pulse 1.2s ease-in-out infinite; }
        @keyframes pt-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,215,0,0.7); } 50% { box-shadow: 0 0 0 7px rgba(255,215,0,0); } }
        .pt-s-label { opacity: 0.85; letter-spacing: 1px; }
        .pt-s-amount { font-size: 2.1em; font-weight: 900; margin: 0.15em 0; }
        .pt-s-hint { font-size: 0.85em; opacity: 0.9; animation: pt-blink 1.2s infinite; }
        @keyframes pt-blink { 50% { opacity: 0.35; } }
        .pt-s-spinner { width: 1.9em; height: 1.9em; border-radius: 50%; border: 0.2em solid rgba(255,255,255,0.3); border-top-color: #fff; animation: pt-spin 0.8s linear infinite; margin-bottom: 0.4em; }
        @keyframes pt-spin { to { transform: rotate(360deg); } }
        .pt-s-check { font-size: 2.6em; line-height: 1; color: #7dff9a; }
        .pt-receipt { width: min(320px, 78vw); background: #F0EAD6; color: #1a1408; border-radius: 6px; padding: 14px; font-size: 11px; line-height: 1.6; }
        .pt-r-row { display: flex; justify-content: space-between; gap: 8px; }
        .pt-r-total { font-weight: 900; border-top: 1px solid #8a6f24; margin-top: 6px; padding-top: 6px; }
        .pt-btn { display: block; width: min(320px, 78vw); padding: 10px; background: #000; color: #FFD700; border: 1px solid #8a6f24; cursor: pointer; font-weight: 700; text-transform: uppercase; font-family: inherit; font-size: 11px; border-radius: 4px; }
        .pt-btn:hover { border-color: #FFD700; }
        .pt-btn.pt-primary { background: #FFD700; color: #000; border-color: #FFD700; }
        .pt-close { position: fixed; top: 14px; right: 20px; font-size: 28px; color: #FFD700; cursor: pointer; z-index: 5001; }
    `;
    document.head.appendChild(style);
}

function buildReceiptCanvas({ orderNumber, lineItems, total, date }) {
    const width = 380, lineHeight = 20;
    const height = 140 + lineItems.length * lineHeight + 60;
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#F0EAD6'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#1a1408';
    ctx.font = '900 16px monospace'; ctx.textAlign = 'center';
    ctx.fillText('GY-GY CLUB', width / 2, 30);
    ctx.font = '11px monospace';
    ctx.fillText('Receipt', width / 2, 48);
    ctx.textAlign = 'left';
    ctx.fillText(`Order: ${orderNumber}`, 20, 72);
    ctx.fillText(`Date: ${date}`, 20, 90);
    ctx.strokeStyle = '#8a6f24';
    ctx.beginPath(); ctx.moveTo(20, 102); ctx.lineTo(width - 20, 102); ctx.stroke();
    let y = 122;
    lineItems.forEach(([label, value]) => {
        ctx.textAlign = 'left'; ctx.fillText(label, 20, y);
        ctx.textAlign = 'right'; ctx.fillText(value, width - 20, y);
        y += lineHeight;
    });
    ctx.beginPath(); ctx.moveTo(20, y + 4); ctx.lineTo(width - 20, y + 4); ctx.stroke();
    ctx.font = '900 14px monospace';
    ctx.textAlign = 'left'; ctx.fillText('TOTAL', 20, y + 26);
    ctx.textAlign = 'right'; ctx.fillText(total, width - 20, y + 26);
    return canvas;
}

export function openPaymentTerminal({ amount, orderNumber, lineItems = [], onComplete, onCancel }) {
    injectStylesOnce();
    const overlay = document.createElement('div');
    overlay.className = 'pt-overlay';
    overlay.innerHTML = `
        <span class="pt-close" id="pt-x">&times;</span>
        <div class="pt-inner">
            <div class="pt-device">
                <img src="payment-terminal.png" alt="Payment terminal">
                <div class="pt-screen pt-pulsing" id="pt-screen"></div>
            </div>
            <div id="pt-extra" style="display:flex; flex-direction:column; align-items:center; gap:8px;"></div>
        </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('pt-visible'));

    const screen = overlay.querySelector('#pt-screen');
    const extra = overlay.querySelector('#pt-extra');
    let finished = false;

    function close(cancelled) {
        overlay.classList.remove('pt-visible');
        setTimeout(() => overlay.remove(), 250);
        if (cancelled && onCancel) onCancel();
    }
    overlay.querySelector('#pt-x').addEventListener('click', () => { if (!finished) close(true); else close(false); });

    function showTap() {
        screen.innerHTML = `<div class="pt-s-label">AMOUNT</div><div class="pt-s-amount">€${amount.toFixed(2)}</div><div class="pt-s-hint">TAP TO PAY</div>`;
        screen.addEventListener('click', showProcessing, { once: true });
    }
    function showProcessing() {
        screen.classList.remove('pt-pulsing');
        screen.innerHTML = `<div class="pt-s-spinner"></div><div class="pt-s-label">PROCESSING</div>`;
        setTimeout(showSuccess, 1400);
    }
    function showSuccess() {
        finished = true;
        const date = new Date().toLocaleString();
        screen.style.cursor = 'default';
        screen.innerHTML = `<div class="pt-s-check">✓</div><div class="pt-s-label">APPROVED</div>`;
        extra.innerHTML = `
            <div class="pt-receipt">
                <div class="pt-r-row"><span>Order</span><span>${orderNumber}</span></div>
                <div class="pt-r-row"><span>Date</span><span>${date}</span></div>
                <div style="border-top:1px solid #8a6f24; margin:8px 0;"></div>
                ${lineItems.map(([l, v]) => `<div class="pt-r-row"><span>${l}</span><span>${v}</span></div>`).join('')}
                <div class="pt-r-row pt-r-total"><span>TOTAL</span><span>€${amount.toFixed(2)}</span></div>
            </div>
            <button class="pt-btn" id="pt-save">💾 Save receipt</button>
            <button class="pt-btn pt-primary" id="pt-done">DONE</button>`;
        extra.querySelector('#pt-save').addEventListener('click', () => {
            buildReceiptCanvas({ orderNumber, lineItems, total: `€${amount.toFixed(2)}`, date }).toBlob((blob) => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `receipt-${orderNumber}.png`;
                a.click();
            });
        });
        extra.querySelector('#pt-done').addEventListener('click', () => { close(false); if (onComplete) onComplete(); });
    }

    showTap();
}
