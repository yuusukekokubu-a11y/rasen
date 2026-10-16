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
        let skills = null;
        if (rc.kind === 'equip') {
          info = `${R.DATA.equipment.types[rc.base.type].name}・R${rc.base.rank}`;
          skills = R.Craft.craftSkills(lv, rc.difficulty);
        } else if (rc.kind === 'tool') {
          info = owned ? '所持' : `強さ${rc.tool.power}`;
        } else {
          info = rc.item.desc;
        }
        return h('div', { class: 'recipe' + (ok && !owned ? '' : ' unavailable') },
          h('div', { class: 'recipe-main' },
            h('div', null, h('b', { class: rc.base && rc.base.unique ? 'unique-name' : null }, rc.name), h('span', { class: 'muted' }, `　難${rc.difficulty}`),
              skills && skills.appraise ? h('span', { class: 'skill-chip' }, `極${Math.round(R.Craft.gradeChances(lv, rc.difficulty)[2] * 100)}%`) : null,
              skills && skills.cardChoice ? h('span', { class: 'skill-chip' }, 'カード2択') : null,
              skills && skills.slotChoice ? h('span', { class: 'skill-chip' }, '枠2択') : null,
              skills && skills.reforge ? h('span', { class: 'skill-chip' }, '再鍛錬') : null),
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
        el.appendChild(R.UI.header(rc.name));
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
          h('div', { class: 'row' },
            h('span', { class: 'energy', title: '手数' }, h('b', null, String(st.turns)), '手'),
            h('span', { class: 'q-chip best' + (st.turns <= st.thresholds.best ? '' : ' off') }, `最高 ${st.thresholds.best}`),
            h('span', { class: 'q-chip fine' + (st.turns <= st.thresholds.fine ? '' : ' off') }, `上質 ${st.thresholds.fine}`)),
          boardEl,
          st.done
            ? h('div', { class: 'row' },
              h('span', { class: 'result result-win' }, `完成！（${R.DATA.config.quality[q].name}）`),
              h('button', { class: 'primary', onclick: () => complete(rc, q, lv) }, '完成品を見る'))
            : h('div', { class: 'puzzle-hand' },
              st.hand.map((p, i) => h('button', { class: 'piece-btn' + (i === st.sel ? ' selected' : ''), 'aria-label': `ピース${i + 1}`, onclick: () => { R.Craft.puzzleSelect(st, i); renderPuzzle(); } },
                pieceView(p, i === st.sel ? st.rot : 0))),
              h('button', { title: 'R キー', onclick: () => { R.Craft.puzzleRotate(st); renderPuzzle(); } }, '回転'),
              h('button', { onclick: () => { R.Craft.puzzleDiscard(st); renderPuzzle(); } },
                st.freeDiscards > 0 ? `捨てる（無料${st.freeDiscards}）` : '捨てる（+1手）'))));
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
      el.appendChild(R.UI.header(rc.name));
      el.appendChild(h('div', { class: 'result result-win' }, `完成！ ${R.DATA.config.quality[quality].name}`));
      if (ups) el.appendChild(h('div', { class: 'good' }, `${R.Life.LIVES[life]}Lvが上がった！（Lv${s.life[life].lv}）`));
      if (rc.kind === 'equip') {
        // 固有スキル（Lv差で発動）：ランダムカード・ランダム枠を2択から選べる。選び直すと詳細と比較だけ描き直す
        const skills = R.Craft.craftSkills(lv, rc.difficulty);
        const choices = R.Craft.equipmentChoices(made, lv, skills);
        let drawSlots = () => {};
        const detail = h('div');
        const drawDetail = () => {
          clear(detail);
          detail.appendChild(R.UI.itemDetail(made));
          // 装備できるキャラの今の装備と比較
          const slot = R.Gear.getBase(made).slot;
          const job = s.party.find(j => R.Gear.canEquip(j, made)) || Object.keys(R.DATA.jobs).find(j => R.DATA.jobs[j].enabled && R.Gear.canEquip(j, made));
          if (job) {
            detail.appendChild(R.UI.comparison(job, slot, made));
            detail.appendChild(h('button', { class: 'primary', onclick: () => { G().equip(job, slot, made.uid); G().save(); render(); } }, `${R.DATA.jobs[job].name}に装備する`));
          }
        };
        if (choices.cards) {
          const row = h('div', { class: 'choice-row' });
          const drawCards = () => {
            clear(row);
            for (const id of choices.cards) {
              row.appendChild(R.UI.cardEl({ cardId: id, upgraded: false, enchants: [] }, {
                selected: made.randomCard === id,
                onClick: () => { made.randomCard = id; G().save(); drawCards(); drawDetail(); }
              }));
            }
          };
          drawCards();
          el.appendChild(h('div', { class: 'panel pick-panel' }, h('div', { class: 'pick-title' }, 'カード'), row));
        }
        if (choices.slots) {
          const row = h('div', { class: 'choice-row slots' });
          drawSlots = () => {
            clear(row);
            for (const set of choices.slots) {
              row.appendChild(h('button', { class: made.slots === set ? 'primary' : '', onclick: () => { made.slots = set; G().save(); drawSlots(); drawDetail(); } },
                set.map(x => h('div', null, R.UI.slotText(x)))));
            }
          };
          drawSlots();
          el.appendChild(h('div', { class: 'panel pick-panel' }, h('div', { class: 'pick-title' }, 'ランダム枠'), row));
        }
        if (skills.reforge) {
          // 再鍛錬：今のランダム枠から1つ選んで引き直す（1回だけ）
          const row = h('div', { class: 'choice-row slots' });
          let used = false;
          const drawReforge = () => {
            clear(row);
            made.slots.forEach((x, i) => row.appendChild(h('button', {
              disabled: used,
              onclick: () => { used = true; R.Craft.reforgeSlot(made, i, lv); G().save(); drawReforge(); drawSlots(); drawDetail(); }
            }, (used ? '' : '↻ ') + R.UI.slotText(x))));
          };
          drawReforge();
          el.appendChild(h('div', { class: 'panel pick-panel' }, h('div', { class: 'pick-title' }, '再鍛錬'), row));
        }
        el.appendChild(detail);
        drawDetail();
      } else {
        el.appendChild(h('div', { class: 'panel' }, `${rc.name}（${R.DATA.config.quality[quality].name}）：${rc.item.desc}`));
      }
      el.appendChild(h('button', { onclick: render }, 'もどる'));
    }

    render();
  }

  R.UI.extraMenu = R.UI.extraMenu || [];
  R.UI.extraMenu.push({ label: '生産', icon: 'icon_craft', fn: () => R.UI.show(craftScreen), order: 30 });
  R.UI.craftScreen = craftScreen;
})(globalThis.RASEN = globalThis.RASEN || {});
