export default async function run(page, ui) {
  // モバイルビューポートを想定した確認（ブラウザ自体はデスクトップだが、レイアウトの崩れを見る）
  await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14 Pro相当
  await page.waitForTimeout(300);
  const navVisible = await page.evaluate(() => {
    const el = document.querySelector('.bottom-nav');
    if (!el) return { error: 'no .bottom-nav element' };
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    return {
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      viewportH: vh,
      height: Math.round(r.height),
      fullyVisible: r.bottom <= vh && r.top >= 0 && r.height > 0,
      display: getComputedStyle(el).display,
    };
  });
  // スクリーンショットも撮って目視確認
  await page.screenshot({ path: 'C:/Users/M3no_/Downloads/files (2)/mobile_nav.png', fullPage: false });
  return navVisible;
}
