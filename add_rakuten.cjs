const fs = require('fs');
const p = 'c:/Users/M3no_/Downloads/files/index.html';
let t = fs.readFileSync(p, 'utf8');
let ok = true;

function addOnce(label, oldS, newS) {
  const count = t.split(oldS).length - 1;
  if (count === 1) t = t.replace(oldS, () => newS);
  else { console.log((count === 0 ? 'MISS: ' : 'MULTI(' + count + '): ') + label); ok = false; }
}

// 1. chip button after openlibrary chip
addOnce('chip-rakuten',
  `<div class="api-chip active" id="chip-openlibrary" onclick="toggleApiSource('openlibrary',this)">🟠 Open Library</div>`,
  `<div class="api-chip active" id="chip-openlibrary" onclick="toggleApiSource('openlibrary',this)">🟠 Open Library</div>
        <div class="api-chip" id="chip-rakuten" onclick="toggleApiSource('rakuten',this)">🔴 楽天</div>`);

// 2. fetchRakuten before lookupByISBN
addOnce('fetchRakuten',
  `// ISBNバーコードからの直接照会（スキャン機能から呼ばれる）`,
  `// ─── 楽天ブックス API（server.cjs の /api/rakuten プロキシ経由）───
async function fetchRakuten(q){
  const normalized=q.replace(/-/g,'');
  const isIsbn=/^[0-9]{13}$/.test(normalized);
  const params=new URLSearchParams({hits:'8'});
  if(isIsbn) params.set('isbn',normalized);
  else params.set('title',q);
  const res=await fetch('/api/rakuten?'+params.toString());
  if(!res.ok){
    var msg='HTTP '+res.status;
    try{var e=await res.json(); if(e.error) msg+=' '+(e.error_description||e.error);}catch{}
    throw new Error(msg);
  }
  const data=await res.json();
  if(data.error) throw new Error(data.error);
  return (data.Items||data.items||[]).map(x=>{
    const it=x.Item||x;
    const year=(String(it.salesDate||'').match(/\\d{4}/)||[''])[0];
    return{
      title:it.title||it.itemName||'不明',author:it.author||'',
      publisher:it.publisherName||'',year,
      pages:0,isbn:it.isbn||it.jan||'',
      coverUrl:(it.largeImageUrl||it.mediumImageUrl||''),
      description:it.itemCaption||'',genre:'',source:'rakuten',
    };
  }).filter(b=>b.title&&b.title!=='不明');
}

// ISBNバーコードからの直接照会（スキャン機能から呼ばれる）`);

// 3. search dispatch
addOnce('dispatch rakuten',
  `if(activeSources.has('openlibrary')) f.push(fetchOpenLibrary(q).then(r=>all.push(...r)).catch(e=>errs.push('Open Library: '+e.message)));`,
  `if(activeSources.has('openlibrary')) f.push(fetchOpenLibrary(q).then(r=>all.push(...r)).catch(e=>errs.push('Open Library: '+e.message)));
  if(activeSources.has('rakuten')) f.push(fetchRakuten(q).then(r=>all.push(...r)).catch(e=>errs.push('楽天: '+e.message)));`);

// 4. badge map entry
addOnce('badge entry',
  `openbd:'<span class="api-badge source-openbd">OpenBD</span>'`,
  `openbd:'<span class="api-badge source-openbd">OpenBD</span>',rakuten:'<span class="api-badge source-rakuten">楽天</span>'`);

// 5. badge CSS
addOnce('badge css',
  `.api-badge.source-openbd{background:#E8F5E9;color:#1B5E20;border-color:#C8E6C9}`,
  `.api-badge.source-openbd{background:#E8F5E9;color:#1B5E20;border-color:#C8E6C9}
.api-badge.source-rakuten{background:#FFEBEE;color:#BF0000;border-color:#FFCDD2}`);

if (ok) {
  fs.writeFileSync(p, t, 'utf8');
  console.log('ALL OK');
} else {
  console.log('SOME MISSED - file not written');
  process.exit(1);
}
