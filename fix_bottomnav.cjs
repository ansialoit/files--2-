const fs = require('fs');
const p = 'c:/Users/M3no_/Downloads/files/index.html';
let t = fs.readFileSync(p, 'utf8');
let ok = true;

function addOnce(label, oldS, newS) {
  const count = t.split(oldS).length - 1;
  if (count === 1) t = t.replace(oldS, () => newS);
  else { console.log((count === 0 ? 'MISS: ' : 'MULTI(' + count + '): ') + label); ok = false; }
}

// 1. html,body の高さ計算を iOS Safari対応（100dvh無効環境向けフォールバック）
addOnce('html,body dvh fallback',
  `html,body{min-height:100vh;height:100dvh;overflow:hidden}`,
  `html,body{min-height:100vh;height:100vh;height:100dvh;overflow:hidden}`);

// 2. bodyの高さフォールバック
addOnce('body height fallback',
  `max-width:430px;margin:0 auto;\n  height:100dvh;overflow:hidden;\n}`,
  `max-width:430px;margin:0 auto;\n  height:100vh;height:100dvh;overflow:hidden;\n}`);

// 3. room-tabs に flex:none（親flexで縮まないように）
addOnce('room-tabs flex none',
  `.room-tabs{\n    display:flex;\n    gap:8px;`,
  `.room-tabs{\n    display:flex;\n    flex:none;\n    gap:8px;`);

// 4. topbar flex:none
addOnce('topbar flex none',
  `.topbar{height:var(--topbar-h);background:var(--shelf-bg);display:flex;align-items:center;justify-content:space-between;padding:0 14px;flex-shrink:0;z-index:100}`,
  `.topbar{height:var(--topbar-h);background:var(--shelf-bg);display:flex;align-items:center;justify-content:space-between;padding:0 14px;flex:none;z-index:100}`);

// 5. edit-mode-bar flex:none
addOnce('edit-mode-bar flex none',
  `.edit-mode-bar{display:none;background:var(--blue);color:var(--shelf-bg);text-align:center;font-size:12px;font-weight:600;padding:7px;flex-shrink:0}`,
  `.edit-mode-bar{display:none;background:var(--blue);color:var(--shelf-bg);text-align:center;font-size:12px;font-weight:600;padding:7px;flex:none}`);

// 6. モバイル時に .screen の高さを確保。100dvh未対応ブラウザのフォールバック
addOnce('screen min-height fallback',
  `.screen.active{display:flex;background:var(--cream)}`,
  `.screen.active{display:flex;background:var(--cream)}\n@supports not (height: 100dvh) {\n  .screen.active{height:calc(100vh - var(--topbar-h) - var(--nav-h))}\n}`);

if (ok) {
  fs.writeFileSync(p, t, 'utf8');
  console.log('ALL OK');
} else {
  console.log('SOME MISSED - file not written');
  process.exit(1);
}
