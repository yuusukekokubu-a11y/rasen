// バランス確認（開発用）：職業ごとの強さとダンジョンごとの難しさをまとめて出す
//   node tools/balance.js [回数]
const { loadGame } = require('./load.js');
const R = loadGame();
const n = Number(process.argv[2] || 80);
const jobs = Object.keys(R.DATA.jobs).filter(j => R.DATA.jobs[j].enabled);
const pct = (x) => (x * 100).toFixed(0) + '%';

// 1) 職業ごとの強さ：その職業が入った全パーティ（初期装備）の、洞窟クリア率の平均
const byJob = Object.fromEntries(jobs.map(j => [j, []]));
const combos = [];
for (let a = 0; a < jobs.length; a++) for (let b = a + 1; b < jobs.length; b++) for (let c = b + 1; c < jobs.length; c++) {
  const js = [jobs[a], jobs[b], jobs[c]];
  const r = R.Sim.runDungeons({ members: js.map(job => ({ job, gear: R.DATA.loadouts.starter[job] })), n, seed: 1 });
  combos.push([js.map(j => R.DATA.jobs[j].name).join('・'), r.clearRate]);
  for (const j of js) byJob[j].push(r.clearRate);
}
console.log(`■ 職業ごとの平均クリア率（岩窟の洞・初期装備・各${n}回）`);
for (const j of jobs) console.log(`  ${R.DATA.jobs[j].name.padEnd(5, '　')} ${pct(byJob[j].reduce((x, y) => x + y, 0) / byJob[j].length)}`);
combos.sort((x, y) => y[1] - x[1]);
console.log(`  最高 ${combos[0][0]} ${pct(combos[0][1])} ／ 最低 ${combos[combos.length - 1][0]} ${pct(combos[combos.length - 1][1])}`);

// 2) ダンジョンごとの難しさ
console.log(`■ ダンジョンのクリア率（各${n}回）`);
const rows = [['cave', 'starter', 1], ['forest', 'rank2_plain', 1], ['marsh', 'rank2_plain', 1], ['ruins', 'rank3_plain', 1], ['ruins', 'rank2_enchanted', 1],
  ['cave', 'rank4_plain', 3], ['forest', 'rank4_plain', 3], ['ruins', 'rank4_plain', 2],
  ['volcano', 'rank4_plain', 1], ['glacier', 'rank4_plain', 1], ['skygarden', 'rank4_plain', 1], ['skygarden', 'rank5_plain', 1],
  ['abyss', 'rank5_plain', 1], ['abyss', 'rank6_plain', 1], ['volcano', 'rank6_plain', 2]];
for (const [d, p, diff] of rows) {
  const r = R.Sim.runDungeons({ members: R.Sim.presetMembers(p), n, seed: 1, dungeonId: d, difficulty: diff });
  console.log(`  ${R.DATA.dungeons[d].name}（難易度${diff}）× ${R.DATA.loadouts.presets[p].name}：${pct(r.clearRate)}`);
}
