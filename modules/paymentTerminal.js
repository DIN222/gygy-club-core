// modules/paymentTerminal.js
// v1.0.0 — 2026-10-02
// Визуальный платёжный терминал — честно отмечаю: это НЕ настоящий
// приём оплаты (реального эквайринга/платёжного шлюза в проекте нет),
// это полноценная имитация опыта супермаркетного терминала: сумма →
// "приложите карту" → обработка → успех → чек с сохранением.
// Встраивается одним вызовом openPaymentTerminal(...) из любой
// страницы — сам инжектит стили и DOM при первом вызове.

let injected = false;

function injectStylesOnce() {
    if (injected) return;
    injected = true;
    const style = document.createElement('style');
    style.textContent = `
        .pt-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 5000;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Share Tech Mono', monospace; opacity: 0; transition: opacity 0.25s;
        }
        .pt-overlay.pt-visible { opacity: 1; }
        .pt-card { width: 320px; background: #0a0a0a; border: 1px solid #FFD700; border-radius: 10px; padding: 24px; text-align: center; color: #FFD700; position: relative; }
        .pt-amount { font-size: 34px; font-weight: 900; margin: 10px 0 18px; }
        .pt-sub { font-size: 11px; color: #F0EAD6; opacity: 0.8; margin-bottom: 18px; }
        .pt-tap-zone {
            width: 140px; height: 140px; margin: 0 auto 18px; border-radius: 50%;
            border: 2px dashed #8a6f24; display: flex; align-items: center; justify-content: center;
            font-size: 40px; cursor: pointer; transition: border-color 0.2s, transform 0.2s; user-select: none;
        }
        .pt-tap-zone:hover { border-color: #FFD700; transform: scale(1.04); }
        .pt-tap-zone.pt-pulsing { animation: pt-pulse 1.1s ease-in-out infinite; }
        @keyframes pt-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,215,0,0.5); } 50% { box-shadow: 0 0 0 14px rgba(255,215,0,0); } }
        .pt-spinner { width: 46px; height: 46px; margin: 10px auto 18px; border-radius: 50%; border: 3px solid #333; border-top-color: #FFD700; animation: pt-spin 0.8s linear infinite; }
        @keyframes pt-spin { to { transform: rotate(360deg); } }
        .pt-check { width: 60px; height: 60px; margin: 6px auto 14px; border-radius: 50%; background: #1b5e20; display: flex; align-items: center; justify-content: center; font-size: 30px; color: #fff; }
        .pt-receipt { background: #F0EAD6; color: #1a1408; border-radius: 6px; padding: 14px; text-align: left; font-size: 11px; line-height: 1.6; margin: 14px 0; max-height: 220px; overflow-y: auto; }
        .pt-receipt .pt-r-row { display: flex; justify-content: space-between; }
        .pt-receipt .pt-r-total { font-weight: 900; border-top: 1px solid #8a6f24; margin-top: 6px; padding-top: 6px; }
        .pt-btn { display: block; width: 100%; padding: 10px; margin-top: 8px; background: #000; color: #FFD700; border: 1px solid #8a6f24; cursor: pointer; font-weight: 700; text-transform: uppercase; font-family: inherit; font-size: 11px; border-radius: 4px; }
        .pt-btn:hover { border-color: #FFD700; }
        .pt-btn.pt-primary { background: #FFD700; color: #000; border-color: #FFD700; }
        .pt-close { position: absolute; top: 10px; right: 14px; font-size: 20px; color: #8a6f24; cursor: pointer; }
    `;
    document.head.appendChild(style);
}

function buildReceiptCanvas({ orderNumber, lineItems, total, date }) {
    const width = 380;
    const lineHeight = 20;
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

// amount: number. orderNumber: string. lineItems: [[label, valueString], ...].
// onComplete(): вызывается, когда покупатель нажал DONE после успешной "оплаты".
// onCancel(): вызывается, если закрыли крестиком до оплаты.
export function openPaymentTerminal({ amount, orderNumber, lineItems = [], onComplete, onCancel }) {
    injectStylesOnce();
    const overlay = document.createElement('div');
    overlay.className = 'pt-overlay';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('pt-visible'));

    function close(cancelled) {
        overlay.classList.remove('pt-visible');
        setTimeout(() => overlay.remove(), 250);
        if (cancelled && onCancel) onCancel();
    }

    function renderTapScreen() {
        overlay.innerHTML = `
            <div class="pt-card">
                <span class="pt-close" data-cancel>&times;</span>
                <div class="pt-sub">AMOUNT DUE</div>
                <div class="pt-amount">€${amount.toFixed(2)}</div>
                <div class="pt-tap-zone pt-pulsing" id="pt-tap">💳</div>
                <div class="pt-sub">Tap or click the card to pay</div>
            </div>`;
        overlay.querySelector('[data-cancel]').addEventListener('click', () => close(true));
        overlay.querySelector('#pt-tap').addEventListener('click', renderProcessing);
    }

    function renderProcessing() {
        overlay.innerHTML = `
            <div class="pt-card">
                <div class="pt-sub">PROCESSING</div>
                <div class="pt-spinner"></div>
                <div class="pt-sub">Please wait...</div>
            </div>`;
        setTimeout(renderSuccess, 1400);
    }

    function renderSuccess() {
        const date = new Date().toLocaleString();
        overlay.innerHTML = `
            <div class="pt-card">
                <div class="pt-check">✓</div>
                <div class="pt-sub" style="color:#6fd48a; font-weight:700;">PAYMENT SUCCESSFUL</div>
                <div class="pt-receipt">
                    <div class="pt-r-row"><span>Order</span><span>${orderNumber}</span></div>
                    <div class="pt-r-row"><span>Date</span><span>${date}</span></div>
                    <div style="border-top:1px solid #8a6f24; margin:8px 0;"></div>
                    ${lineItems.map(([label, value]) => `<div class="pt-r-row"><span>${label}</span><span>${value}</span></div>`).join('')}
                    <div class="pt-r-row pt-r-total"><span>TOTAL</span><span>€${amount.toFixed(2)}</span></div>
                </div>
                <button class="pt-btn" id="pt-save">💾 Save receipt</button>
                <button class="pt-btn pt-primary" id="pt-done">DONE</button>
            </div>`;
        overlay.querySelector('#pt-save').addEventListener('click', () => {
            const canvas = buildReceiptCanvas({ orderNumber, lineItems, total: `€${amount.toFixed(2)}`, date });
            canvas.toBlob((blob) => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `receipt-${orderNumber}.png`;
                a.click();
            });
        });
        overlay.querySelector('#pt-done').addEventListener('click', () => {
            close(false);
            if (onComplete) onComplete();
        });
    }

    renderTapScreen();
}
