// modules/imageTools.js
// v1.0.0 — 2026-10-17
// Подготовка картинки принта: уменьшение и автоматическое удаление однотонного фона.
// prepareImage(file, { maxDim, removeBg }) → Promise<Blob (PNG)>

const BG_REMOVE_THRESHOLD = 32;

function removeBackgroundFlood(imageData, threshold) {
    const { width, height, data } = imageData;
    const visited = new Uint8Array(width * height);
    const corners = [0, width - 1, (height - 1) * width, (height - 1) * width + width - 1];
    let br = 0, bg = 0, bb = 0;
    corners.forEach(idx => { br += data[idx * 4]; bg += data[idx * 4 + 1]; bb += data[idx * 4 + 2]; });
    br /= 4; bg /= 4; bb /= 4;

    const stack = [];
    for (let x = 0; x < width; x++) { stack.push(x); stack.push((height - 1) * width + x); }
    for (let y = 0; y < height; y++) { stack.push(y * width); stack.push(y * width + width - 1); }

    while (stack.length) {
        const idx = stack.pop();
        if (visited[idx]) continue;
        const r = data[idx * 4], g = data[idx * 4 + 1], b = data[idx * 4 + 2];
        const dist = Math.sqrt((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2);
        if (dist > threshold) continue;
        visited[idx] = 1;
        data[idx * 4 + 3] = 0;
        const x = idx % width, y = (idx / width) | 0;
        if (x > 0) stack.push(idx - 1);
        if (x < width - 1) stack.push(idx + 1);
        if (y > 0) stack.push(idx - width);
        if (y < height - 1) stack.push(idx + width);
    }
    return [br, bg, bb];
}

function featherAndDecontaminate(imageData, bgColor, radius) {
    const { width, height, data } = imageData;
    const [br, bg, bb] = bgColor;
    const n = width * height;
    let alpha = new Float32Array(n);
    for (let i = 0; i < n; i++) alpha[i] = data[i * 4 + 3];

    function boxBlurPass(src, horizontal) {
        const out = new Float32Array(n);
        const len = horizontal ? width : height;
        const stride = horizontal ? 1 : width;
        const lineCount = horizontal ? height : width;
        const lineStride = horizontal ? width : 1;
        for (let line = 0; line < lineCount; line++) {
            const base = line * lineStride;
            for (let p = 0; p < len; p++) {
                let sum = 0, count = 0;
                for (let d = -radius; d <= radius; d++) {
                    const q = p + d;
                    if (q >= 0 && q < len) { sum += src[base + q * stride]; count++; }
                }
                out[base + p * stride] = sum / count;
            }
        }
        return out;
    }
    alpha = boxBlurPass(alpha, true);
    alpha = boxBlurPass(alpha, false);

    for (let i = 0; i < n; i++) {
        const a = alpha[i] / 255;
        data[i * 4 + 3] = Math.round(alpha[i]);
        if (a > 0.02 && a < 0.98) {
            data[i * 4]     = Math.min(255, Math.max(0, Math.round((data[i * 4]     - (1 - a) * br) / a)));
            data[i * 4 + 1] = Math.min(255, Math.max(0, Math.round((data[i * 4 + 1] - (1 - a) * bg) / a)));
            data[i * 4 + 2] = Math.min(255, Math.max(0, Math.round((data[i * 4 + 2] - (1 - a) * bb) / a)));
        }
    }
    return imageData;
}

export function prepareImage(file, { maxDim = 1200, removeBg = true } = {}) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
        reader.onload = (ev) => {
            const img = new Image();
            img.onerror = () => reject(new Error('Файл не похож на изображение'));
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDim || height > maxDim) {
                    const r = Math.min(maxDim / width, maxDim / height);
                    width = Math.round(width * r);
                    height = Math.round(height * r);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                if (removeBg) {
                    try {
                        const imageData = ctx.getImageData(0, 0, width, height);
                        const d = imageData.data;
                        const corners = [0, (width - 1) * 4, (height - 1) * width * 4, ((height - 1) * width + width - 1) * 4];
                        const alreadyTransparent = corners.every(idx => d[idx + 3] < 15);
                        if (!alreadyTransparent) {
                            const bgColor = removeBackgroundFlood(imageData, BG_REMOVE_THRESHOLD);
                            featherAndDecontaminate(imageData, bgColor, 2);
                            ctx.putImageData(imageData, 0, 0);
                        }
                        // углы уже прозрачны — файл вырезан правильно, не трогаем
                    } catch (e) {
                        console.warn('[imageTools] Удаление фона не выполнено, используется исходное изображение.', e);
                    }
                }

                canvas.toBlob(
                    (blob) => blob ? resolve(blob) : reject(new Error('Не удалось сохранить изображение')),
                    'image/png'
                );
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
}
