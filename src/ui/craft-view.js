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

  // 倍率を「+12%」「−10%」のように表示
  function pct(m) {
    const v = Math.round((m - 1) * 100);
    return v > 0 ? `+${v}%` : v < 0 ? `−${-v}%` : '±0%';
  }
  // レベルの恩恵の表示（レベル差がプラスなら緑、マイナスなら赤）
  function lvBonusLine(diff, parts) {
    return h('div', { class: 'lv-bonus ' + (diff > 0 ? 'good' : diff < 0 ? 'bad' : 'muted') },
      `Lv差${diff > 0 ? '+' : ''}${diff}：` + parts.join('・'));
  }

  function craftScreen(el) {
    let life = 'smith';

    function render() {
      const s = G().state;
      clear(el);
      el.appendChild(R.UI.header('生産', () => R.UI.show(R.UI.homeScreen)));
      el.appendChild(R.UI.stage('workshop', 'craft-head',
        h('div', { class: 'life-tabs' }, Object.entries(R.DATA.crafting.lives).map(([k, L]) =>
          h('button', { class: k === life ? 'primary' : '', onclick: () => { life = k; render(); } }, L.name, h('small', null, `Lv${s.life[k].lv}`))))));
      const L = R.DATA.crafting.lives[life];

      const lv = s.life[life].lv;
      const rows = R.Craft.recipesFor(life).map(rc => {
        const ok = G().hasMaterials(rc.mats);
        const owned = rc.kind === 'tool' && s.tools.includes(rc.id);
        let info = '';
        if (rc.kind === 'equip') {
          const ch = R.Craft.gradeChances(lv, rc.difficulty);
          info = `${R.DATA.equipment.types[rc.base.type].name}・${R.DATA.equipment.slotNames[rc.base.slot]}・R${rc.base.rank}　枠 並${Math.round(ch[0] * 100)} 良${Math.round(ch[1] * 100)} 極${Math.round(ch[2] * 100)}`;
        } else if (rc.kind === 'tool') {
          info = `採集道具・強さ${rc.tool.power}` + (owned ? '・所持済み' : '');
        } else {
          info = rc.item.desc;
        }
        return h('div', { class: 'recipe' + (ok && !owned ? '' : ' unavailable') },
          h('div', { class: 'recipe-main' },
            h('div', null, h('b', null, rc.name), h('span', { class: 'muted' }, `　難${rc.difficulty}`)),
            h('div', { class: 'muted recipe-info' }, info),
            h('div', { class: 'recipe-mats' }, matReqView(rc.mats))),
          h('button', { class: ok && !owned ? 'primary' : '', disabled: !ok || owned, onclick: () => startCraft(rc) }, '作る'));
      });
      el.appendChild(h('div', { class: 'recipes' }, rows));
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
      // 品質ミニゲーム「設計図はめ込み」
      const lv = s.life[life].lv;
      const params = R.Craft.puzzleParams(lv, rc.difficulty);
      const bp = R.Craft.blueprintFor(rc.kind, rc.base && rc.base.slot, rc.base ? rc.base.rank : 1);
      const st = R.Craft.puzzleStart(bp, params, R.createRng());
      let hover = null;

      const onKey = (e) => {
        if (!document.body.contains(boardEl)) { window.removeEventListener('keydown', onKey); return; }
        if (e.key === 'r' || e.key === 'R') { R.Craft.puzzleRotate(st); renderPuzzle(); }
      };
      window.addEventListener('keydown', onKey);
      let boardEl = null;

      // ピースの小さな絵
      function pieceView(pieceId, rot) {
        const cells = R.Craft.pieceCells(pieceId, rot);
        const h = Math.max(...cells.map(c => c[0])) + 1, w = Math.max(...cells.map(c => c[1])) + 1;
        const set = new Set(cells.map(([r, c]) => r * w + c));
        return h2('div', { class: 'piece', style: { gridTemplateColumns: `repeat(${w}, 1fr)` } },
          [...Array(w * h).keys()].map(i => h2('div', { class: set.has(i) ? 'pc on' : 'pc' })));
      }
      const h2 = h;

      function renderPuzzle() {
        clear(el);
        el.appendChild(R.UI.header(`生産：${rc.name}`));
        const q = R.Craft.puzzleQuality(st);
        // 置く場所のプレビュー：盤面は作り直さず、マスの色だけ変える（作り直すとマウスの出入りが無限に続くため）
        const cellEls = [];
        const showGhost = (r, c) => {
          for (const x of cellEls) if (x) x.classList.remove('ghost', 'ghost-bad');
          if (r === null) return;
          const idx = R.Craft.placement(st, r, c);
          if (idx) for (const i of idx) cellEls[i] && cellEls[i].classList.add('ghost');
          else if (cellEls[r * st.w + c]) cellEls[r * st.w + c].classList.add('ghost-bad');
        };
        boardEl = h('div', { class: 'bp-board', style: { gridTemplateColumns: `repeat(${st.w}, 1fr)` }, onmouseleave: () => { hover = null; showGhost(null); } },
          st.cells.map((cell, i) => {
            const r = Math.floor(i / st.w), c = i % st.w;
            if (!cell.need) return h('div', { class: 'bp-cell void' });
            if (cell.filled) return h('div', { class: 'bp-cell filled' });
            const b = h('button', {
              class: 'bp-cell open', disabled: st.done, 'aria-label': `${r + 1}行${c + 1}列`,
              onmouseenter: () => { hover = [r, c]; showGhost(r, c); },
              onclick: () => { R.Craft.puzzlePlace(st, r, c); renderPuzzle(); }
            });
            cellEls[i] = b;
            return b;
          }));
        if (hover) setTimeout(() => showGhost(hover[0], hover[1]), 0);
        el.appendChild(h('div', { class: 'panel puzzle' },
          h('div', null, h('b', null, rc.name), h('span', { class: 'muted' }, `（難易度${rc.difficulty}・${R.Life.LIVES[life]}Lv${lv}）`)),
          lvBonusLine(params.diff, [`手持ち${params.hand}`, `無料捨て${params.freeDiscards}`]),
          h('div', { class: 'row' },
            h('span', { class: 'energy' }, `${st.turns}手`),
            h('span', { class: 'muted' }, `最高：${st.thresholds.best}手以内／上質：${st.thresholds.fine}手以内`),
            h('span', null, `${st.filledCount}/${st.total}マス`)),
          boardEl,
          st.done
            ? h('div', { class: 'row' },
              h('span', { class: 'result result-win' }, `完成！（${R.DATA.config.quality[q].name}）`),
              h('button', { class: 'primary', onclick: () => complete(rc, q, lv) }, '完成品を見る'))
            : h('div', { class: 'puzzle-hand' },
              st.hand.map((p, i) => h('button', { class: 'piece-btn' + (i === st.sel ? ' selected' : ''), 'aria-label': `ピース${i + 1}`, onclick: () => { R.Craft.puzzleSelect(st, i); renderPuzzle(); } },
                pieceView(p, i === st.sel ? st.rot : 0))),
              h('button', { onclick: () => { R.Craft.puzzleRotate(st); renderPuzzle(); } }, '回転（R）'),
              h('button', { onclick: () => { R.Craft.puzzleDiscard(st); renderPuzzle(); } },
                st.freeDiscards > 0 ? `捨てる（無料あと${st.freeDiscards}）` : '捨てる（+1手）'))));
      }
      renderPuzzle();
    }

    function complete(rc, quality, lv) {
      const s = G().state;
      // 素材は完成したときに使う（途中で画面を閉じても素材は減らない）
      if (!G().hasMaterials(rc.mats)) { render(); return; }
      G().removeMaterials(rc.mats);
      let made;
      if (rc.kind === 'equip') {
        // アクセサリーのパワーはランダム（付いたパワーの職業だけが装備できる）
        const item = R.Craft.makeEquipment(rc.id, { lv, quality });
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
  R.UI.extraMenu.push({ label: '生産', icon: 'icon_craft', desc: '装備・道具を作る', fn: () => R.UI.show(craftScreen), order: 30 });
  R.UI.craftScreen = craftScreen;
})(globalThis.RASEN = globalThis.RASEN || {});
