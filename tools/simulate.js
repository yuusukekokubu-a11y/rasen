// 自動対戦シミュレーター（コマンド版）
//
// 使い方：
//   node tools/simulate.js                         … 初期装備で全部の敵と100回ずつ
//   node tools/simulate.js --preset rank2_plain    … 装備セットを指定（data/loadouts.js の presets）
//   node tools/simulate.js --enc boss_golem --n 1000
//   node tools/simulate.js --hp 0.5                … HP半分から開始
//   node tools/simulate.js --dungeon               … ダンジョンを最初から最後まで自動で通す（--dungeon forest でダンジョン指定）
//   node tools/simulate.js --combos                … 全職業の組み合わせ（初期装備）でダンジョンを比べる
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
  console.log('ダンジョン（--dungeon）:');
  for (const [id, d] of Object.entries(R.DATA.dungeons)) console.log(`  ${id.padEnd(18)} ${d.name}`);
  console.log('敵（--enc）:');
  for (const [id, e] of Object.entries(R.DATA.encounters)) console.log(`  ${id.padEnd(18)} ${e.name}`);
  process.exit(0);
}

// 全職業の組み合わせ（初期装備）でダンジョンを回して比べる
if (arg('combos', false)) {
  const n = Number(arg('n', 100));
  const jobs = Object.keys(R.DATA.jobs).filter(j => R.DATA.jobs[j].enabled);
  const rows = [];
  for (let a = 0; a < jobs.length; a++) for (let b = a + 1; b < jobs.length; b++) for (let c = b + 1; c < jobs.length; c++) {
    const members = [jobs[a], jobs[b], jobs[c]].map(job => ({ job, gear: R.DATA.loadouts.starter[job] }));
    const r = R.Sim.runDungeons({ members, n, seed: 1 });
    const boss = R.Sim.runBattles({ members, enemies: R.DATA.encounters.boss_golem.enemies, n, seed: 1 });
    rows.push({ 'パーティ': members.map(m => R.DATA.jobs[m.job].name).join('・'), 'ダンジョンクリア率': (r.clearRate * 100).toFixed(1) + '%', 'ボス平均ターン(満タンから)': boss.avgTurns.toFixed(1), 'ボス被ダメ': boss.avgDamageTaken.toFixed(1) });
  }
  rows.sort((x, y) => parseFloat(y['ダンジョンクリア率']) - parseFloat(x['ダンジョンクリア率']));
  console.log(`初期装備・各${n}回`);
  console.table(rows);
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
  const did = arg('dungeon') === true ? 'cave' : arg('dungeon');
  if (!R.DATA.dungeons[did]) { console.error('不明なダンジョン: ' + did); process.exit(1); }
  const r = R.Sim.runDungeons({ members, n, seed, dungeonId: did });
  console.log(`${R.DATA.dungeons[did].name} ${n}回: クリア率 ${pct(r.clearRate)}`);
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
