// modules/toAtelier.js
// v1.0.0 — 2026-10-30
// Передача готовой картинки в Ателье и «поделиться» (телефон: системное окно; компьютер: файл + Telegram).

const KEY = 'gygy_inbox_print';

function blobToDataUrl(blob) {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = () => rej(new Error('read failed'));
        r.readAsDataURL(blob);
    });
}

// Картинка уходит через sessionStorage; Ателье забирает её по ?inbox=1
export async function sendImageToAtelier(blob, from = 'space') {
    const dataUrl = await blobToDataUrl(blob);
    sessionStorage.setItem(KEY, JSON.stringify({ dataUrl, from, at: Date.now() }));   // бросит ошибку, если слишком большая
    window.location.href = 'atelier.html?inbox=1&from=' + encodeURIComponent(from);
}

export function downloadBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}

// Возвращает 'shared' | 'telegram' | 'cancelled'
export async function shareImage(blob, text, filename = 'gygy-print.png') {
    try {
        if (navigator.canShare && navigator.share) {
            const file = new File([blob], filename, { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], text });
                return 'shared';
            }
        }
    } catch (e) {
        if (e && e.name === 'AbortError') return 'cancelled';
    }
    // компьютер: картинку сохраняем (её прикрепляют вручную), Telegram открывается с текстом и ссылкой на клуб
    downloadBlob(blob, filename);
    const url = new URL('./', location.href).href;
    window.open('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text), '_blank', 'noopener');
    return 'telegram';
}
