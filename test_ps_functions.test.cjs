// 純粋関数のテスト（vitest不要の軽量ランナー）
// 実行: node test_ps_functions.cjs
const { psReorderByIds, psClampRows } = require('./ps_functions.cjs');

let passed = 0, failed = 0;
function assert(name, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { passed++; console.log('PASS ' + name); }
  else { failed++; console.log('FAIL ' + name + ' | got: ' + a + ' | want: ' + e); }
}

// ── psReorderByIds ──
// drop-after: srcをtgtの後に移動
assert('reorder after', psReorderByIds([1, 2, 3, 4], 2, 4, true), [1, 3, 4, 2]);
// drop-before: srcをtgtの前に移動
assert('reorder before', psReorderByIds([1, 2, 3, 4], 4, 2, false), [1, 4, 2, 3]);
// srcが既にtgtの直前でも正しく動く
assert('reorder adjacent', psReorderByIds([1, 2, 3], 1, 2, true), [2, 1, 3]);
// 存在しないtgtId → 末尾へ
assert('reorder missing tgt', psReorderByIds([1, 2, 3], 1, 99, true), [2, 3, 1]);
// 元配列を破壊しない
const orig = [1, 2, 3];
psReorderByIds(orig, 1, 3, true);
assert('no mutation', orig, [1, 2, 3]);

// ── psClampRows ──
// row >= max のアイテムを最終段に収める
assert('clamp rows', psClampRows([{ id: 1, row: 0 }, { id: 2, row: 4 }, { id: 3, row: 7 }], 3), [{ id: 1, row: 0 }, { id: 2, row: 2 }, { id: 3, row: 2 }]);
// 全て範囲内なら変化なし
assert('clamp no-op', psClampRows([{ id: 1, row: 0 }, { id: 2, row: 2 }], 3), [{ id: 1, row: 0 }, { id: 2, row: 2 }]);
// max=1 → 全員0段目
assert('clamp to one row', psClampRows([{ id: 1, row: 2 }, { id: 2, row: 5 }], 1), [{ id: 1, row: 0 }, { id: 2, row: 0 }]);
// 元配列を破壊しない
const items = [{ id: 1, row: 5 }];
psClampRows(items, 2);
assert('clamp no mutation', items, [{ id: 1, row: 5 }]);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
