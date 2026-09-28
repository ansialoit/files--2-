const fs = require('fs');
const p = 'c:/Users/M3no_/Downloads/files/index.html';
let t = fs.readFileSync(p, 'utf8');
const edits = [
  [
    `<div class="api-chip active" id="chip-openlibrary" onclick="toggleApiSource('openlibrary',this)">🟠 Open Library</div>`,
    `<div class="api-chip active" id="chip-openlibrary" onclick="toggleApiSource('openlibrary',this)">🟠 Open Library</div>
        <div class="api-chip" id="chip-rakuten" onclick="toggleApiSource('rakuten',this)">🔴 楽天</div>`,
  ],
  [
    `else{activeSources.add(src);el.classList.add('active')}`,
    `else{activeSources.add(src);el.classList.add('active'); if(src==='rakuten'&&!localStorage.getItem('rakutenAppId')){var id=prompt('楽天ブックス検索のアプリID(applicationId)を入力してください'); if(id&&id.trim())localStorage.setItem('rakutenAppId',id.trim());}}`,
  ],
  [
    `// ISBNバーコードからの直接照会（スキャン機能から呼ばれる）`,
    `// ─── 楽天ブックス API（server.cjs の /api/rakuten プロキシ経由）───
async function fetchRakuten(q){
  const appId=localStorage.getItem('rakutenAppId')||'';
  if(!appId) throw new Error('アプリIDが未設定です(楽天チップをクリックして入力)');
  const isIsbn=/^[0-9]{10,13}$/.test(q.replace(/-/g,''));
  const params=new URLSearchParams({applicationId:appId,hits:'8'});
  if(isIsbn) params.set('isbnjan',q.replace(/-/g,''));
  else params.set('title',q);
  const res=await fetch('/api/rakuten?'+params.toString());
  if(!res.ok){
    var msg='HTTP '+res.status;
    try{var e=await res.json(); if(e.error) msg+=' '+e.error;}catch{}
    throw new Error(msg);
  }
  const data=await res.json();
  if(data.error) throw new Error(data.error);
  return (data.Items||[]).map(x=>{
    const it=x.Item||x;
    const year=(String(it.salesDate||'').match(/\d{4}/)||[''])[0];
    return{
      title:it.title||'不明',author:it.author||'',
      publisher:it.publisherName||'',year,
      pages:0,isbn:it.isbn||it.jan||'',
      coverUrl:(it.largeImageUrl||it.mediumImageUrl||''),
      description:it.itemCaption||'',genre:'',source:'rakuten',
    };
  }).filter(b=>b.title&&b.title!=='不明');
}

// ISBNバーコードからの直接照会（スキャン機能から呼ばれる）`,
  ],
  [
    `if(activeSources.has('openlibrary')) f.push(fetchOpenLibrary(q).then(r=>all.push(...r)).catch(e=>errs.push('Open Library: '+e.message)));`,
    `if(activeSources.has('openlibrary')) f.push(fetchOpenLibrary(q).then(r=>all.push(...r)).catch(e=>errs.push('Open Library: '+e.message)));
  if(activeSources.has('rakuten')) f.push(fetchRakuten(q).then(r=>all.push(...r)).catch(e=>errs.push('楽天: '+e.message)));`,
  ],
  [
    `openbd:'<span class="api-badge source-openbd">OpenBD</span>'`,
    `openbd:'<span class="api-badge source-openbd">OpenBD</span>',rakuten:'<span class="api-badge source-rakuten">楽天</span>'`,
  ],
];
let ok = true;
for (const [oldS, newS] of edits) {
  if (t.includes(oldS)) t = t.replace(oldS, newS);
  else { console.log('MISS: ' + oldS.slice(0, 60)); ok = false; }
}
fs.writeFileSync(p, t, 'utf8');
console.log(ok ? 'ALL OK' : 'SOME MISSED');
