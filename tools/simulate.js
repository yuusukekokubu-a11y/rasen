// 自動対戦シミュレーター（コマンド版）
//
// 使い方：
//   node tools/simulate.js                         … 初期装備で全部の敵と100回ずつ
//   node tools/simulate.js --preset rank2_plain    … 装備セットを指定（data/loadouts.js の presets）
//   node tools/simulate.js --enc boss_golem --n 1000
//   node tools/simulate.js --hp 0.5                … HP半分から開始
//   node tools/simulate.js --dungeon               … ダンジョンを最初から最後まで自動で通す
//   node tools/simulate.js --list                  … 使える装備セットと敵の一覧
const { loadGame } = require('./load.js');
const R = loadGame();

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i < 0) return def;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
}

if (arg('list', false)) {
  console.log('装備セット（--preset）:');
  for (const [id, p] of Object.entries(R.DATA.loadouts.presets)) console.log(`  ${id.padEnd(18)} ${p.name}`);
  console.log('敵（--enc）:');
  for (const [id, e] of Object.entries(R.DATA.encounters)) console.log(`  ${id.padEnd(18)} ${e.name}`);
  process.exit(0);
}

const presetId = arg('preset', 'starter');
const n = Number(arg('n', 100));
const seed = Number(arg('seed', 12345));
const members = R.Sim.presetMembers(presetId);
const pct = (x) => (x * 100).toFixed(1) + '%';
const f1 = (x) => x.toFixed(1);

console.log(`装備セット: ${R.DATA.loadouts.presets[presetId].name}`);

if (arg('dungeon', false)) {
  if (!R.Sim.runDungeons) { console.log('ダンジョンのシミュレーションはまだありません'); process.exit(1); }
  const r = R.Sim.runDungeons({ members, n, seed });
  console.log(`ダンジョン ${n}回: クリア率 ${pct(r.clearRate)}`);
  console.log(`  平均到達戦闘数 ${f1(r.avgBattles)} / 平均クリア時HP ${f1(r.avgHpLeftOnClear)}`);
  console.log('  全滅した場所:');
  for (const [k, v] of Object.entries(r.deathsAt)) console.log(`    ${k}: ${v}回`);
  process.exit(0);
}

const encIds = arg('enc', 'all') === 'all' ? Object.keys(R.DATA.encounters) : String(arg('enc')).split(',');
const hpRatio = Number(arg('hp', 1));
const rows = [];
for (const id of encIds) {
  const enc = R.DATA.encounters[id];
  if (!enc) { console.error('不明な敵: ' + id); process.exit(1); }
  const r = R.Sim.runBattles({ members, enemies: enc.enemies, n, seed, startHpRatio: hpRatio });
  rows.push({
    '敵': enc.name,
    '勝率': pct(r.winRate),
    '平均ターン': f1(r.avgTurns),
    '最短-最長': `${r.minTurns}-${r.maxTurns}`,
    '平均被ダメ': f1(r.avgDamageTaken),
    '勝利時残HP': `${f1(r.avgHpLeft)}/${r.maxHp}`
  });
}
console.log(`各${n}回 / 開始HP ${pct(hpRatio)}`);
console.table(rows);
