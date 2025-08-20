"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ⛔️ Hilangkan tanda 'webdriver' dari navigator
Object.defineProperty(navigator, 'webdriver', {
    get: () => false,
});
// ✅ Tambahkan properti `window.chrome` agar mirip Chrome sungguhan
window.chrome = {
    runtime: {},
    // kamu bisa tambahkan properti lain jika diperlukan
};
// ✅ Palsukan plugin agar tidak terdeteksi headless
Object.defineProperty(navigator, 'plugins', {
    get: () => [1, 2, 3, 4, 5], // dummy value
});
// ✅ Set bahasa agar sesuai Chrome biasa
Object.defineProperty(navigator, 'languages', {
    get: () => ['en-US', 'en'],
});
// ✅ Optional: spoof screen size jika dibutuhkan
Object.defineProperty(window.screen, 'availWidth', {
    get: () => 1920,
});
Object.defineProperty(window.screen, 'availHeight', {
    get: () => 1080,
});
//# sourceMappingURL=preload.js.map