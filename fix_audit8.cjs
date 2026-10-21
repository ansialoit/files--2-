const fs = require('fs');
const p = 'c:/Users/M3no_/Downloads/files/index.html';
let t = fs.readFileSync(p, 'utf8');
let ok = true;
const results = [];

function addOnce(label, oldS, newS) {
  const count = t.split(oldS).length - 1;
  if (count === 1) { t = t.replace(oldS, () => newS); results.push('OK  ' + label); }
  else { results.push((count === 0 ? 'MISS: ' : 'MULTI(' + count + '): ') + label); ok = false; }
}

// ── FIX 1: 明示的な order フィールドで並び順を永続化 ──
addOnce('1a normalizeItem order',
  `  if(item.row===undefined) item.row = item.position.row;
  return item;`,
  `  if(item.row===undefined) item.row = item.position.row;
  if(item.order===undefined) item.order = item.position.order;
  return item;`);

addOnce('1b saveItems persist order',
  `    item.position.order=orderByShelfRow[key] || 0;
    orderByShelfRow[key]=(orderByShelfRow[key] || 0)+1;`,
  `    item.position.order=orderByShelfRow[key] || 0;
    item.order=item.position.order;
    orderByShelfRow[key]=(orderByShelfRow[key] || 0)+1;`);

addOnce('1c render sort by explicit order',
  `      .sort((a,b)=>(a.position?.order ?? 0)-(b.position?.order ?? 0));`,
  `      .sort((a,b)=>(a.order ?? a.position?.order ?? 0)-(b.order ?? b.position?.order ?? 0));`);

// ── FIX 2: openBook デバウンス（ダブルオープン防止） ──
addOnce('2 openBook debounce',
  `function openBook(id){
  var activeScreen = document.querySelector('.screen.active');`,
  `function openBook(id){
  const now=Date.now();
  if(openBook._last && openBook._last.id===id && now-openBook._last.at<500) return;
  openBook._last={id:id,at:now};
  var activeScreen = document.querySelector('.screen.active');`);

// ── FIX 3: localStorage JSON.parse を try/catch で保護 ──
addOnce('3a safeParse helper',
  `function getScopedStorageKey(baseKey){
  return \`\${baseKey}_\${encodeURIComponent(getCurrentUserId())}\`;
}`,
  `function getScopedStorageKey(baseKey){
  return \`\${baseKey}_\${encodeURIComponent(getCurrentUserId())}\`;
}
function safeParse(raw, fallback){
  try{ const v=JSON.parse(raw); return v===undefined?fallback:v; }catch(e){ return fallback; }
}`);

addOnce('3b authSession safeParse',
  `let authSession = JSON.parse(localStorage.getItem('photoshelf_auth_session') || 'null');`,
  `let authSession = safeParse(localStorage.getItem('photoshelf_auth_session') || 'null', null);`);

addOnce('3c items scoped safeParse',
  `  if (scopedRaw) return normalizeItems(JSON.parse(scopedRaw));`,
  `  if (scopedRaw) return normalizeItems(safeParse(scopedRaw, []));`);

addOnce('3d items legacy safeParse',
  `      const legacyItems = normalizeItems(JSON.parse(legacyRaw));`,
  `      const legacyItems = normalizeItems(safeParse(legacyRaw, []));`);

addOnce('3e categories scoped safeParse',
  `    return JSON.parse(scopedRaw).map(category => ({`,
  `    return safeParse(scopedRaw, []).map(category => ({`);

addOnce('3f categories legacy safeParse',
  `      const legacyCategories = JSON.parse(legacyRaw).map(category => ({`,
  `      const legacyCategories = safeParse(legacyRaw, []).map(category => ({`);

addOnce('3g share state safeParse',
  `const shareState = JSON.parse(localStorage.getItem('ps_share_state') || 'null') || {`,
  `const shareState = safeParse(localStorage.getItem('ps_share_state') || 'null', null) || {`);

addOnce('3h shelf config scoped safeParse',
  `  if(scoped) return {...getDefaultShelfConfig(),...JSON.parse(scoped)};`,
  `  if(scoped) return {...getDefaultShelfConfig(),...safeParse(scoped,{})};`);

addOnce('3i shelf config legacy safeParse',
  `      const config={...getDefaultShelfConfig(),...JSON.parse(legacy)};`,
  `      const config={...getDefaultShelfConfig(),...safeParse(legacy,{})};`);

// ── FIX 4: hex バリデーション ──
addOnce('4a hexToPlankGradient guard',
  `function hexToPlankGradient(hex){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);`,
  `function hexToPlankGradient(hex){
  if(!/^#[0-9a-fA-F]{6}$/.test(hex)) hex='#D4A264';
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);`);

addOnce('4b hexToRGB guard',
  `function hexToRGB(hex){return{r:parseInt(hex.slice(1,3),16),g:parseInt(hex.slice(3,5),16),b:parseInt(hex.slice(5,7),16)}}`,
  `function hexToRGB(hex){ if(!/^#[0-9a-fA-F]{6}$/.test(hex)) hex='#D4A264'; return{r:parseInt(hex.slice(1,3),16),g:parseInt(hex.slice(3,5),16),b:parseInt(hex.slice(5,7),16)}}`);

// ── FIX 5: 純粋関数の抽出（テスト対象） ──
addOnce('5 pure functions',
  `function _reorder(src,tgt,after){
  // shelf/row は呼び出し元で設定済み
  const si=ITEMS.indexOf(src);ITEMS.splice(si,1);
  const ti=ITEMS.indexOf(tgt);ITEMS.splice(after?ti+1:ti,0,src);
  saveItems();renderShelfById(getCurrentShelfId());showToast('📚 並び替えました');
  if(editMode)document.querySelectorAll('.shelf-row').forEach(r=>r.classList.add('edit-mode'));
}`,
  `// 純粋関数：配列(ids)内で srcId を tgtId の前/後に移動した新しい配列を返す（破壊しない）
function psReorderByIds(ids,srcId,tgtId,after){
  const out=ids.filter(id=>id!==srcId);
  let idx=out.indexOf(tgtId);
  if(idx<0) idx=out.length-1;
  out.splice(after?idx+1:idx,0,srcId);
  return out;
}
// 純粋関数：row が maxRows を超えるアイテムを最終段に収めた新しい配列を返す（破壊しない）
function psClampRows(items,maxRows){
  const max=Math.max(1,maxRows|0);
  return items.map(it=>it.row>=max?{...it,row:max-1}:it);
}
function applyReorder(srcId,tgtId,after){
  const ids=ITEMS.map(b=>b.id);
  ITEMS=psReorderByIds(ids,srcId,tgtId,after).map(id=>ITEMS.find(b=>b.id===id));
  saveItems();renderShelfById(getCurrentShelfId());
  if(editMode)document.querySelectorAll('.shelf-row').forEach(r=>r.classList.add('edit-mode'));
}
function _reorder(src,tgt,after){
  applyReorder(src.id,tgt.id,after);
  showToast('📚 並び替えました');
}`);

// ── FIX 5+6: setShelfRows で psClampRows を使用 ──
addOnce('5b setShelfRows uses psClampRows',
  `  // 段数を超えているアイテムを最終段に収める
  ITEMS.filter(b=>b.shelf===id&&b.row>=value).forEach(b=>b.row=value-1);`,
  `  // 段数を超えているアイテムを最終段に収める（純粋関数 psClampRows の結果を反映）
  psClampRows(ITEMS.filter(b=>b.shelf===id), value).forEach(cl=>{
    const orig=ITEMS.find(x=>x.id===cl.id);
    if(orig && orig.row!==cl.row) orig.row=cl.row;
  });`);

// ── FIX 6: onDragEnd を handleDropOnBook / handleDropOnRow に分割 ──
{
  const start = t.indexOf('function onDragEnd(e){');
  const end = t.indexOf('function _reorder(src,tgt,after){');
  const next = t.indexOf('function psReorderByIds');
  const blockEnd = (next !== -1 && next > start) ? next : end;
  if (start !== -1 && blockEnd > start) {
    const newBlock = `function onDragEnd(e){
  clearTimeout(drag.longPressTimer);_removeListeners();if(!drag.active)return;
  const{x,y}=getXY(e);
  if(drag.ghost){drag.ghost.remove();drag.ghost=null}
  var draggedBookEl=document.querySelector(\`.book[data-id="\${drag.bookId}"]\`);
  if(draggedBookEl) draggedBookEl.classList.remove('dragging');
  _clearHighlights();
  if(!drag.moved){drag.active=false;drag.bookId=null;return}
  const below=document.elementFromPoint(x,y);
  var tb = below ? below.closest('.book') : null;
  var ts = below ? below.closest('.shelf-row-wrap') : null;
  const src=ITEMS.find(b=>b.id===drag.bookId);
  if(src){
    if(tb&&tb.dataset.id!=drag.bookId){
      handleDropOnBook(src,tb,x);
    } else if(ts){
      handleDropOnRow(src,ts,x);
    }
  }
  drag.active=false;drag.bookId=null;
}
function handleDropOnBook(src,tb,x){
  const tgt=ITEMS.find(b=>b.id===parseInt(tb.dataset.id));
  if(!tgt) return;
  const r=tb.getBoundingClientRect();
  const after=x>r.left+r.width/2;
  src.categoryId=tgt.categoryId;
  src.shelf=tgt.categoryId;
  src.row=tgt.row;
  applyReorder(src.id,tgt.id,after);
  showToast('📚 並び替えました');
}
function handleDropOnRow(src,ts,x){
  const targetShelf=parseInt(ts.dataset.shelf)||src.shelf;
  var targetRow=src.row;
  if(ts.dataset && ts.dataset.row) targetRow=parseInt(ts.dataset.row);
  src.categoryId=targetShelf;
  src.shelf=targetShelf;
  src.row=targetRow;
  const rowBooks=Array.from(ts.querySelectorAll('.book'))
    .map(el=>ITEMS.find(item=>item.id===parseInt(el.dataset.id)))
    .filter(item=>item&&item.id!==src.id&&item.categoryId===targetShelf&&item.row===targetRow);
  if(rowBooks.length){
    const beforeTarget=rowBooks.find(item=>{
      const el=ts.querySelector(\`.book[data-id="\${item.id}"]\`);
      if(!el) return false;
      const rect=el.getBoundingClientRect();
      return x<rect.left+rect.width/2;
    });
    if(beforeTarget){ applyReorder(src.id,beforeTarget.id,false); }
    else { applyReorder(src.id,rowBooks[rowBooks.length-1].id,true); }
  } else {
    // 空き段：右端（末尾）へ
    const ids=ITEMS.map(b=>b.id).filter(id=>id!==src.id);
    ids.push(src.id);
    ITEMS=ids.map(id=>ITEMS.find(b=>b.id===id));
  }
  saveItems();renderShelfById(getCurrentShelfId());showToast('📚 段を移動しました');
}
`;
    t = t.slice(0, start) + newBlock + t.slice(blockEnd);
    results.push('OK  6 onDragEnd split');
  } else {
    results.push('MISS: 6 onDragEnd block (start=' + start + ' end=' + blockEnd + ')');
    ok = false;
  }
}

// ── FIX 7: カラーグリッド描画の共通化 ──
addOnce('7a renderColorGrid helper',
  `function setMaterial(idx,el){`,
  `function renderColorGrid(containerId, colors, selected, opts){
  const el=document.getElementById(containerId);
  if(!el) return null;
  const cls=(opts&&opts.cls)||'color-dot';
  const fn=(opts&&opts.fn)||'setPlankColor';
  const list=[...new Set([selected,...(colors||[])])].filter(Boolean);
  el.innerHTML=list.map(c=>\`<div class="\${cls}" data-color="\${c}" style="background:\${c}" onclick="\${fn}('\${c}',this)"></div>\`).join('');
  el.querySelectorAll('.'+cls).forEach(d=>{d.classList.remove('active');d.removeAttribute('data-selected');});
  const active=el.querySelector(\`[data-color="\${selected}"]\`);
  if(active){active.classList.add('active');active.dataset.selected='true';}
  return el;
}
function setMaterial(idx,el){`);

addOnce('7b setPlankColor uses helper',
  `function setPlankColor(hex,el){
  shelfConfig.plankColor=hex;saveShelfConfig();applyShelfConfig();updatePreview();
  document.querySelectorAll('#plank-color-grid .color-dot').forEach(function(d){d.classList.remove('active');d.removeAttribute('data-selected');});
  if(el){el.classList.add('active');el.dataset.selected='true';}
}`,
  `function setPlankColor(hex,el){
  shelfConfig.plankColor=hex;saveShelfConfig();applyShelfConfig();updatePreview();
  renderColorGrid('plank-color-grid', PLANK_COLORS, hex, {cls:'color-dot', fn:'setPlankColor'});
}`);

addOnce('7c setBgColor uses helper',
  `function setBgColor(hex,el){
  shelfConfig.bgColor=hex;saveShelfConfig();applyShelfConfig();updatePreview();
  document.querySelectorAll('#bg-color-grid .bg-swatch').forEach(function(d){d.classList.remove('active');d.removeAttribute('data-selected');});
  if(el){el.classList.add('active');el.dataset.selected='true';}
}`,
  `function setBgColor(hex,el){
  shelfConfig.bgColor=hex;saveShelfConfig();applyShelfConfig();updatePreview();
  renderColorGrid('bg-color-grid', BG_COLORS, hex, {cls:'bg-swatch', fn:'setBgColor'});
}`);

addOnce('7d initShelfConfigUI grids use helper',
  `  // plank colors
  const pg=document.getElementById('plank-color-grid');
  const plankColors=[...new Set([shelfConfig.plankColor,...PLANK_COLORS])];
  if(pg){
    pg.innerHTML=plankColors.map(c=>\`<div class="color-dot" data-color="\${c}" style="background:\${c}" onclick="setPlankColor('\${c}',this)"></div>\`).join('');
    pg.querySelectorAll('.color-dot').forEach(el=>el.classList.remove('active'));
    const activePlank=pg.querySelector(\`[data-color="\${shelfConfig.plankColor}"]\`);
    if(activePlank){activePlank.classList.add('active');activePlank.dataset.selected='true';}
  }
  // bg colors
  const bg=document.getElementById('bg-color-grid');
  const bgColors=[...new Set([shelfConfig.bgColor,...BG_COLORS])];
  if(bg){
    bg.innerHTML=bgColors.map(c=>\`<div class="bg-swatch" data-color="\${c}" style="background:\${c}" onclick="setBgColor('\${c}',this)"></div>\`).join('');
    bg.querySelectorAll('.bg-swatch').forEach(el=>el.classList.remove('active'));
    const activeBg=bg.querySelector(\`[data-color="\${shelfConfig.bgColor}"]\`);
    if(activeBg){activeBg.classList.add('active');activeBg.dataset.selected='true';}
  }`,
  `  // plank colors / bg colors（共通ヘルパー renderColorGrid で描画）
  renderColorGrid('plank-color-grid', PLANK_COLORS, shelfConfig.plankColor, {cls:'color-dot', fn:'setPlankColor'});
  renderColorGrid('bg-color-grid', BG_COLORS, shelfConfig.bgColor, {cls:'bg-swatch', fn:'setBgColor'});`);

// ── FIX 8: 死んでいるラッパー変数を削除 ──
addOnce('8 remove dead wrapper',
  `// updateShelfIndicator に rowsLabel更新を追加
const _origUpdateShelfIndicator = updateShelfIndicator;
`,
  ``);

if (ok) {
  fs.writeFileSync(p, t, 'utf8');
  console.log(results.join('\n'));
  console.log('ALL OK');
} else {
  console.log(results.join('\n'));
  console.log('SOME MISSED - file not written');
  process.exit(1);
}
