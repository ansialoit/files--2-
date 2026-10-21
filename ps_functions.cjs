// index.html から抽出した純粋関数（DOMに依存しない並び替え・段クランプ）
// psReorderByIds: 配列(ids)内で srcId を tgtId の前/後に移動した新しい配列を返す（破壊しない）
function psReorderByIds(ids, srcId, tgtId, after) {
  const out = ids.filter(id => id !== srcId);
  let idx = out.indexOf(tgtId);
  if (idx < 0) idx = out.length - 1;
  out.splice(after ? idx + 1 : idx, 0, srcId);
  return out;
}
// psClampRows: row が maxRows を超えるアイテムを最終段に収めた新しい配列を返す（破壊しない）
function psClampRows(items, maxRows) {
  const max = Math.max(1, maxRows | 0);
  return items.map(it => it.row >= max ? { ...it, row: max - 1 } : it);
}
module.exports = { psReorderByIds, psClampRows };
