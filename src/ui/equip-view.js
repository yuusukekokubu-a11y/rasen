// 装備画面（付け替え・比較・処分）
(function (R) {
  const { h, clear } = R.UI;
  const G = () => R.Game;
  const STAT_LABEL = { hp: 'HP', atk: '攻撃力', def: '防御力', mag: '魔力' };
  const GRADE_LABEL = ['並', '良', '極'];

  function slotText(slot) {
    if (slot.kind === 'stat') return `${STAT_LABEL[slot.stat]}+${slot.value}`;
    const d = R.DATA.enchants.list[slot.id];
    const el = slot.element ? `（${R.Cards.ELEMENT_NAMES[slot.element]}）` : '';
    return `付与：${d.name}${el}`;
  }

  // 装備1つの詳しい表示
  function itemDetail(item, opts) {
    opts = opts || {};
    const base = R.Gear.getBase(item);
    const type = R.DATA.equipment.types[base.type];
    const fixed = R.Gear.fixedStats(item);
    const fixedText = R.Gear.STATS.filter(k => fixed[k]).map(k => `${STAT_LABEL[k]}${fixed[k]}`).join(' ') || 'なし';
    const powerJob = item.power ? Object.keys(R.DATA.jobs).find(j => R.DATA.jobs[j].powers.includes(item.power)) : null;
    return h('div', { class: 'panel item-detail' },
      h('div', null, h('b', null, R.Gear.itemName(item)),
        h('span', { class: 'muted' }, `　${type.name}・${R.DATA.equipment.slotNames[base.slot]}・ランク${base.rank}`),
        powerJob ? h('span', { class: 'muted' }, `・${R.DATA.jobs[powerJob].name}専用`) : null),
      h('div', null, `固定：${fixedText}`),
      h('div', null, 'ランダム枠：' + ((item.slots || []).length ? item.slots.map(s => slotText(s) + (s.grade !== undefined ? `［${GRADE_LABEL[s.grade]}］` : '')).join('／') : 'なし')),
      opts.cards === false ? null : h('div', { class: 'cards small' }, R.Gear.itemCards(item).map(c => R.UI.cardEl(c, {
        extraClass: c.source === 'power' ? 'power-src' : '', title: { fixed: '固定カード', random: 'ランダムカード', power: 'パワーカード' }[c.source]
      }))));
  }

  // 付け替え前後の比較
  function comparison(job, slot, newItem) {
    const gear = G().gearOf(job);
    const after = Object.assign({}, gear, { [slot]: newItem });
    const sBefore = R.Gear.charStats(job, gear);
    const sAfter = R.Gear.charStats(job, after);
    const partyBefore = R.Gear.buildParty(G().currentMembers()).maxHp;
    const partyAfter = partyBefore - sBefore.hp + sAfter.hp;
    const inParty = G().state.party.includes(job);

    const statRows = R.Gear.STATS.map(k => {
      const d = sAfter[k] - sBefore[k];
      return h('tr', null, h('td', null, STAT_LABEL[k]), h('td', null, String(sBefore[k])), h('td', null, '→'),
        h('td', null, String(sAfter[k])), h('td', { class: d > 0 ? 'good' : d < 0 ? 'bad' : 'muted' }, d > 0 ? `+${d}` : d < 0 ? String(d) : '±0'));
    });

    // デッキの変化：外れるカード・入るカード
    const oldCards = gear[slot] ? R.Gear.itemCards(gear[slot]) : [];
    const newCards = R.Gear.itemCards(newItem);
    const key = (c) => `${c.cardId}|${c.upgraded}|${(c.enchants || []).map(e => e.id + (e.element || '')).sort().join(',')}`;
    const removed = oldCards.filter(c => !newCards.some(n => key(n) === key(c)));
    const added = newCards.filter(c => !oldCards.some(o => key(o) === key(c)));

    return h('div', { class: 'panel compare' },
      h('h2', null, `比較：${R.DATA.jobs[job].name}の${R.DATA.equipment.slotNames[slot]}`),
      h('div', { class: 'row' },
        h('div', null, h('div', { class: 'muted' }, '今の装備'), gear[slot] ? itemDetail(gear[slot], { cards: false }) : h('div', null, 'なし')),
        h('div', null, h('div', { class: 'muted' }, '付け替え後'), itemDetail(newItem, { cards: false }))),
      h('table', { class: 'stat-compare' }, h('tr', null, h('th', null, 'ステータス'), h('th', null, '今'), h('th'), h('th', null, '後'), h('th', null, '増減')), statRows),
      inParty ? h('div', null, `パーティHP：${partyBefore} → ${partyAfter}`) : h('div', { class: 'muted' }, '（パーティ外）'),
      h('div', { class: 'row deck-diff' },
        h('div', null, h('div', { class: 'bad' }, `デッキから外れるカード（${removed.length}）`),
          h('div', { class: 'cards small' }, removed.length ? removed.map(c => R.UI.cardEl(c, { extraClass: 'removed', stats: sBefore })) : h('span', { class: 'muted' }, 'なし'))),
        h('div', null, h('div', { class: 'good' }, `デッキに入るカード（${added.length}）`),
          h('div', { class: 'cards small' }, added.length ? added.map(c => R.UI.cardEl(c, { extraClass: 'added', stats: sAfter })) : h('span', { class: 'muted' }, 'なし')))));
  }

  function equipScreen(el) {
    const jobs = Object.keys(R.DATA.jobs).filter(j => R.DATA.jobs[j].enabled);
    let job = G().state.party[0] || jobs[0];
    let slot = 'weapon';
    let candidate = null;
    let message = '';

    function render() {
      clear(el);
      el.appendChild(R.UI.header('装備', () => R.UI.show(R.UI.homeScreen)));
      el.appendChild(h('div', { class: 'row' }, jobs.map(j =>
        h('button', { class: 'job-btn' + (j === job ? ' primary' : ''), onclick: () => { job = j; candidate = null; render(); } },
          R.UI.sprite(j, 24), R.DATA.jobs[j].name + (G().state.party.includes(j) ? '★' : '')))));

      const gear = G().gearOf(job);
      const st = R.Gear.charStats(job, gear);
      el.appendChild(h('div', { class: 'panel' },
        h('div', null, `${R.DATA.jobs[job].name}：HP${st.hp} 攻撃力${st.atk} 防御力${st.def} 魔力${st.mag}`),
        h('div', { class: 'row' }, R.Gear.SLOTS.map(sl => h('button', {
          class: sl === slot ? 'primary' : '', onclick: () => { slot = sl; candidate = null; render(); }
        }, `${R.DATA.equipment.slotNames[sl]}：${gear[sl] ? R.Gear.itemName(gear[sl]) : 'なし'}`)))));

      if (gear[slot]) el.appendChild(itemDetail(gear[slot]));

      // 候補
      const cands = G().state.items.filter(it => R.Gear.getBase(it).slot === slot && R.Gear.canEquip(job, it) && it.uid !== (gear[slot] && gear[slot].uid));
      el.appendChild(h('h2', null, `付け替え候補（${cands.length}）`));
      if (!cands.length) el.appendChild(h('div', { class: 'muted' }, 'なし'));
      el.appendChild(h('div', { class: 'row' }, cands.map(it => {
        const who = G().equippedBy(it.uid);
        return h('button', { class: candidate === it ? 'primary' : '', onclick: () => { candidate = it; message = ''; render(); } },
          R.Gear.itemName(it) + (who ? `（${R.DATA.jobs[who.job].name}が装備中）` : ''));
      })));
      if (candidate) {
        el.appendChild(comparison(job, slot, candidate));
        el.appendChild(h('div', { class: 'row' },
          h('button', { class: 'primary', onclick: () => {
            const r = G().equip(job, slot, candidate.uid);
            message = r.ok ? '装備しました' : r.error;
            if (r.ok) { candidate = null; G().save(); }
            render();
          } }, '装備する'),
          h('button', { class: 'danger', disabled: !!G().equippedBy(candidate.uid), onclick: () => {
            const it = candidate;
            R.UI.modal(h('div', null, `${R.Gear.itemName(it)}を捨てますか？（元に戻せません）`), [
              { label: 'やめる' },
              { label: '捨てる', onClick: () => { G().state.items = G().state.items.filter(x => x !== it); candidate = null; G().save(); render(); } }
            ]);
          } }, '捨てる')));
      }
      if (message) el.appendChild(h('div', { class: 'message' }, message));
    }
    render();
  }

  R.UI.extraMenu = R.UI.extraMenu || [];
  R.UI.extraMenu.push({ label: '装備', icon: 'icon_equip', desc: '付け替え（ステータスとデッキの変化を比較）', fn: () => R.UI.show(equipScreen), order: 20 });
  Object.assign(R.UI, { equipScreen, itemDetail, comparison, slotText });
})(globalThis.RASEN = globalThis.RASEN || {});
