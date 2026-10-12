// 生産画面
(function (R) {
  const { h, clear } = R.UI;
  const G = () => R.Game;

  function matReqView(mats) {
    const s = G().state;
    return Object.entries(mats).map(([m, n]) => {
      const have = s.materials[m] || 0;
      return h('span', { class: have >= n ? '' : 'bad' }, `${R.DATA.materials[m].name} ${have}/${n}　`);
    });
  }

  function craftScreen(el) {
    let life = 'smith';
    let accJob = G().state.party[0];
    let accPower = null;

    function render() {
      const s = G().state;
      clear(el);
      el.appendChild(R.UI.header('生産', () => R.UI.show(R.UI.homeScreen)));
      el.appendChild(h('div', { class: 'row' }, Object.entries(R.DATA.crafting.lives).map(([k, L]) =>
        h('button', { class: k === life ? 'primary' : '', onclick: () => { life = k; render(); } }, `${L.name} Lv${s.life[k].lv}`))));
      const L = R.DATA.crafting.lives[life];
      const typeNames = L.types.filter(t => R.DATA.equipment.types[t]).map(t => R.DATA.equipment.types[t].name);
      el.appendChild(h('div', { class: 'muted' }, `作れる物：${typeNames.join('・')}${L.tools ? '・採集道具' : ''}${L.items ? '・持ち込みアイテム' : ''}`));
      el.appendChild(h('div', { class: 'muted' }, '生産Lvが難易度より高いほど、ランダム枠に良い物が出やすく、ミニゲームも進みやすくなります。'));

      // アクセサリー：乗せるパワーを選ぶ
      if (life === 'jeweler') {
        const jobs = Object.keys(R.DATA.jobs).filter(j => R.DATA.jobs[j].enabled);
        if (!jobs.includes(accJob)) accJob = jobs[0];
        const powers = R.Craft.unlockedPowers(accJob, s.life.jeweler.lv);
        if (!powers.includes(accPower)) accPower = powers[0];
        const nextLv = R.DATA.config.life.powerUnlockLvs.find(lv => lv > s.life.jeweler.lv);
        el.appendChild(h('div', { class: 'panel' },
          h('div', null, 'アクセサリーに乗せるパワー（その職業専用になります）'),
          h('div', { class: 'row' }, '職業：', h('select', { onchange: (e) => { accJob = e.target.value; accPower = null; render(); } },
            jobs.map(j => h('option', { value: j, selected: j === accJob }, R.DATA.jobs[j].name)))),
          h('div', { class: 'row' }, 'パワー：', h('select', { onchange: (e) => { accPower = e.target.value; render(); } },
            powers.map(p => h('option', { value: p, selected: p === accPower }, `${R.DATA.cards[p].name}：${R.DATA.powers[R.DATA.cards[p].effects[0].id].desc}`)))),
          h('div', { class: 'muted' }, `解禁済み ${powers.length}/${R.DATA.jobs[accJob].powers.length}` + (nextLv ? `（細工Lv${nextLv}で次のパワーが解禁）` : ''))));
      }

      const lv = s.life[life].lv;
      const rows = R.Craft.recipesFor(life).map(rc => {
        const ok = G().hasMaterials(rc.mats);
        const owned = rc.kind === 'tool' && s.tools.includes(rc.id);
        let info = '';
        if (rc.kind === 'equip') {
          const ch = R.Craft.gradeChances(lv, rc.difficulty);
          info = `${R.DATA.equipment.types[rc.base.type].name}・${R.DATA.equipment.slotNames[rc.base.slot]}・ランク${rc.base.rank}／枠の良さ 並${Math.round(ch[0] * 100)}% 良${Math.round(ch[1] * 100)}% 極${Math.round(ch[2] * 100)}%`;
        } else if (rc.kind === 'tool') {
          info = `採集道具（強さ${rc.tool.power}）` + (owned ? '・所持済み' : '');
        } else {
          info = `持ち込みアイテム：${rc.item.desc}`;
        }
        return h('tr', null,
          h('td', null, h('b', null, rc.name), h('div', { class: 'muted' }, info)),
          h('td', null, String(rc.difficulty)),
          h('td', null, matReqView(rc.mats)),
          h('td', null, h('button', { disabled: !ok || owned, onclick: () => startCraft(rc) }, '作る')));
      });
      el.appendChild(h('table', null, h('tr', null, h('th', null, '品物'), h('th', null, '難易度'), h('th', null, '素材（所持/必要）'), h('th')), rows));
    }

    function startCraft(rc) {
      const s = G().state;
      if (!G().hasMaterials(rc.mats)) return;
      if (rc.kind === 'tool') {
        G().removeMaterials(rc.mats);
        if (!s.tools.includes(rc.id)) s.tools.push(rc.id);
        const ups = R.Life.addExp(s.life[life], R.Craft.expFor(rc));
        G().save();
        R.UI.modal(h('div', null, `${rc.name}を作った！`, ups ? h('div', { class: 'good' }, `${R.Life.LIVES[life]}Lvが上がった！`) : null),
          [{ label: 'OK', primary: true, onClick: render }]);
        return;
      }
      // 品質ミニゲーム
      const lv = s.life[life].lv;
      const params = R.Craft.gameParams(lv, rc.difficulty);
      const qh = R.DATA.crafting.game.qualityHits;
      const zm = R.DATA.crafting.game.zoneMult;
      let progress = 0;
      let hitCount = 0;
      clear(el);
      el.appendChild(R.UI.header(`生産：${rc.name}`));
      el.appendChild(h('div', { class: 'muted' }, `早く仕上げるほど品質が上がります：${qh.best}回以内＝最高（固定カードが強化版）／${qh.fine}回以内＝上質／それ以上＝ふつう`));
      const box = h('div');
      el.appendChild(box);
      R.UI.mountTimingGame(box, {
        title: `${rc.name}（難易度${rc.difficulty}・${R.Life.LIVES[life]}Lv${lv}）`,
        goodWidth: params.goodWidth, greatWidth: params.greatWidth, actionLabel: '作業する',
        onHit: (kind, count) => {
          hitCount = count;
          progress = Math.min(100, progress + params.perHit * zm[kind]);
          const q = R.DATA.config.quality[R.Craft.qualityFromHits(count)].name;
          return { progress, done: progress >= 100, text: progress >= 100 ? `完成！（${count}回・${q}）` : `${count}回目（今終われば${q}）` };
        },
        onDone: () => complete(rc, R.Craft.qualityFromHits(hitCount), lv)
      });
    }

    function complete(rc, quality, lv) {
      const s = G().state;
      // 素材は完成したときに使う（途中で画面を閉じても素材は減らない）
      if (!G().hasMaterials(rc.mats)) { render(); return; }
      G().removeMaterials(rc.mats);
      let made;
      if (rc.kind === 'equip') {
        const item = R.Craft.makeEquipment(rc.id, { lv, quality, power: rc.base.slot === 'accessory' ? accPower : undefined });
        made = G().addItem(item);
      } else {
        made = { uid: s.nextUid++, id: rc.id, quality };
        s.consumables.push(made);
      }
      const ups = R.Life.addExp(s.life[life], R.Craft.expFor(rc, quality));
      G().save();
      clear(el);
      el.appendChild(R.UI.header(`生産：${rc.name}`));
      el.appendChild(h('div', { class: 'result result-win' }, `完成！ 品質：${R.DATA.config.quality[quality].name}`));
      if (ups) el.appendChild(h('div', { class: 'good' }, `${R.Life.LIVES[life]}Lvが上がった！（Lv${s.life[life].lv}）`));
      if (rc.kind === 'equip') {
        el.appendChild(R.UI.itemDetail(made));
        // 装備できるキャラの今の装備と比較
        const slot = R.Gear.getBase(made).slot;
        const job = s.party.find(j => R.Gear.canEquip(j, made)) || Object.keys(R.DATA.jobs).find(j => R.DATA.jobs[j].enabled && R.Gear.canEquip(j, made));
        if (job) {
          el.appendChild(R.UI.comparison(job, slot, made));
          el.appendChild(h('button', { class: 'primary', onclick: () => { G().equip(job, slot, made.uid); G().save(); render(); } }, `${R.DATA.jobs[job].name}に装備する`));
        }
      } else {
        el.appendChild(h('div', { class: 'panel' }, `${rc.name}（${R.DATA.config.quality[quality].name}）：${rc.item.desc}`));
      }
      el.appendChild(h('button', { onclick: render }, '生産画面に戻る'));
    }

    render();
  }

  R.UI.extraMenu = R.UI.extraMenu || [];
  R.UI.extraMenu.push({ label: '生産', desc: '鍛冶・大工・裁縫・細工で装備や道具を作る', fn: () => R.UI.show(craftScreen), order: 30 });
  R.UI.craftScreen = craftScreen;
})(globalThis.RASEN = globalThis.RASEN || {});
