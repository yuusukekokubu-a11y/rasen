// 装備画面（付け替え・比較・処分）
(function (R) {
  const { h, clear } = R.UI;
  const G = () => R.Game;
  const STAT_LABEL = { hp: 'HP', atk: '攻撃力', def: '防御力', mag: '魔力' };

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
      h('div', null, h('b', { class: base.unique ? 'unique-name' : null }, R.Gear.itemName(item)),
        h('span', { class: 'muted' }, `　${type.name}・R${base.rank}`),
        powerJob ? h('span', { class: 'muted' }, `・${R.DATA.jobs[powerJob].name}専用`) : null),
      h('div', null, fixedText),
      (item.slots || []).length ? h('div', { class: 'slot-line' }, item.slots.map(s => h('span', { class: 'slot-chip g' + (s.grade || 0) }, slotText(s)))) : null,
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

    // 変わるステータスだけを出す
    const statRows = R.Gear.STATS.filter(k => sAfter[k] !== sBefore[k]).map(k => {
      const d = sAfter[k] - sBefore[k];
      return h('div', { class: 'stat-change' }, R.UI.sprite({ hp: 'ico_hp', atk: 'ico_atk', def: 'ico_def', mag: 'ico_mag' }[k], 14),
        h('span', null, `${sBefore[k]} → ${sAfter[k]}`), h('b', { class: d > 0 ? 'good' : 'bad' }, d > 0 ? `+${d}` : String(d)));
    });

    // デッキの変化：外れるカード・入るカード
    const oldCards = gear[slot] ? R.Gear.itemCards(gear[slot]) : [];
    const newCards = R.Gear.itemCards(newItem);
    const key = (c) => `${c.cardId}|${c.upgraded}|${(c.enchants || []).map(e => e.id + (e.element || '')).sort().join(',')}`;
    const removed = oldCards.filter(c => !newCards.some(n => key(n) === key(c)));
    const added = newCards.filter(c => !oldCards.some(o => key(o) === key(c)));

    return h('div', { class: 'panel compare' },
      h('h2', null, `${R.DATA.jobs[job].name}の${R.DATA.equipment.slotNames[slot]}`),
      statRows.length ? h('div', { class: 'stat-changes' }, statRows) : null,
      inParty && partyAfter !== partyBefore ? h('div', { class: 'stat-change' }, 'パーティHP', h('span', null, `${partyBefore} → ${partyAfter}`)) : null,
      removed.length || added.length ? h('div', { class: 'row deck-diff' },
        removed.length ? h('div', null, h('div', { class: 'bad' }, '外れる'),
          h('div', { class: 'cards small' }, removed.map(c => R.UI.cardEl(c, { extraClass: 'removed', stats: sBefore })))) : null,
        added.length ? h('div', null, h('div', { class: 'good' }, '入る'),
          h('div', { class: 'cards small' }, added.map(c => R.UI.cardEl(c, { extraClass: 'added', stats: sAfter })))) : null) : null);
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
        h('div', { class: 'equip-stats' }, R.UI.sprite(job, 24), h('b', null, R.DATA.jobs[job].name), R.UI.statLine(st, ['hp', 'atk', 'def', 'mag'])),
        h('div', { class: 'row' }, R.Gear.SLOTS.map(sl => h('button', {
          class: sl === slot ? 'primary' : '', onclick: () => { slot = sl; candidate = null; render(); }
        }, `${R.DATA.equipment.slotNames[sl]}：${gear[sl] ? R.Gear.itemName(gear[sl]) : 'なし'}`)))));

      if (gear[slot]) el.appendChild(itemDetail(gear[slot]));

      // 候補
      const cands = G().state.items.filter(it => R.Gear.getBase(it).slot === slot && R.Gear.canEquip(job, it) && it.uid !== (gear[slot] && gear[slot].uid));
      el.appendChild(h('h2', null, `候補 ${cands.length}`));
      if (!cands.length) el.appendChild(h('div', { class: 'muted' }, 'なし'));
      el.appendChild(h('div', { class: 'row' }, cands.map(it => {
        const who = G().equippedBy(it.uid);
        return h('button', { class: candidate === it ? 'primary' : '', onclick: () => { candidate = it; message = ''; render(); } },
          R.Gear.itemName(it) + (who ? `（${R.DATA.jobs[who.job].name}）` : ''));
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
  R.UI.extraMenu.push({ label: '装備', icon: 'icon_equip', fn: () => R.UI.show(equipScreen), order: 20 });
  Object.assign(R.UI, { equipScreen, itemDetail, comparison, slotText });
})(globalThis.RASEN = globalThis.RASEN || {});
