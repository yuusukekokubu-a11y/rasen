// 戦闘画面
(function (R) {
  const { h, clear, bar } = R.UI;

  // カード1枚の見た目（戦闘以外の画面でも使う）
  //   spec: { cardId, upgraded, enchants }  stats: 数値をステータス込みで表示したいとき
  function cardEl(spec, opts) {
    opts = opts || {};
    const def = R.Cards.getCardDef(spec.cardId, spec.upgraded);
    const cost = R.Cards.cardCost(def, spec.enchants);
    const d = R.Cards.describeCard(def, spec.enchants, opts.stats);
    const ownerCls = opts.owner !== undefined ? ' owner-' + opts.owner : '';
    return h('div', {
      class: 'card type-' + def.type + ownerCls + (opts.disabled ? ' disabled' : '') + (opts.selected ? ' selected' : '') + (opts.extraClass ? ' ' + opts.extraClass : ''),
      onclick: opts.onClick, title: opts.title
    },
      h('div', { class: 'card-top' },
        h('span', { class: 'card-cost' + (cost !== def.cost ? ' changed' : '') }, String(cost)),
        h('span', { class: 'card-name' }, def.displayName)),
      h('div', { class: 'card-type' }, (opts.ownerName ? opts.ownerName + '・' : '') + R.Cards.TYPE_NAMES[def.type]),
      h('div', { class: 'card-text' }, d.text),
      d.enchantText ? h('div', { class: 'card-ench' }, d.enchantText) : null);
  }

  function statusList(st) {
    const out = [];
    for (const k of ['weak', 'vulnerable', 'burn', 'freeze', 'shock']) {
      if (st[k] > 0) out.push(h('span', { class: 'chip status st-' + k }, `${R.Cards.STATUS_NAMES[k]}${st[k]}`));
    }
    return out;
  }

  // container に戦闘画面を描く。opts.onFinish(result) は戦闘終了後に「次へ」を押したとき
  function mountCombat(container, combat, opts) {
    opts = opts || {};
    let target = combat._firstAlive();
    let selection = [];
    let message = '';
    let showPile = null;

    function act(res) {
      message = res && !res.ok ? res.error : '';
      selection = [];
      if (!combat.enemies[target] || !combat.enemies[target].alive) target = combat._firstAlive();
      render();
    }

    function render() {
      clear(container);
      const root = h('div', { class: 'combat' });

      // 敵（上に行動予告、真ん中にドット絵、下にHP）
      root.appendChild(h('div', { class: 'enemies', style: { gridTemplateColumns: `repeat(${combat.enemies.length}, minmax(0, 1fr))` } }, combat.enemies.map(e => {
        const info = e.alive ? combat.intentInfo(e) : null;
        return h('button', {
          class: 'enemy' + (e.alive ? '' : ' dead') + (e.index === target && e.alive ? ' targeted' : '') + (e.boss ? ' boss' : ''),
          disabled: !e.alive, 'aria-label': `${e.name}を狙う`,
          onclick: () => { if (e.alive) { target = e.index; render(); } }
        },
          info ? h('div', { class: 'intent ' + info.kinds.map(k => 'in-' + k).join(' '), title: info.name }, info.text) : h('div', { class: 'intent' }, '撃破'),
          R.UI.sprite(e.id, e.boss ? 96 : 64, { extraClass: 'enemy-sprite' }),
          h('div', { class: 'enemy-name' }, e.name),
          bar(e.hp, e.maxHp, 'hp'),
          h('div', { class: 'chips' },
            e.block > 0 ? h('span', { class: 'chip block' }, `盾${e.block}`) : null,
            e.str > 0 ? h('span', { class: 'chip st-str' }, `攻+${e.str}`) : null,
            statusList(e.st)));
      })));

      // パーティ
      const incoming = combat.incomingDamage();
      root.appendChild(h('div', { class: 'party' },
        h('div', { class: 'party-hp' },
          bar(combat.party.hp, combat.party.maxHp, 'hp big'),
          h('div', { class: 'chips' },
            h('span', { class: 'chip block' }, `ブロック${combat.party.block}`),
            combat.party.ward > 0 ? h('span', { class: 'chip ward' }, `結界${combat.party.ward}`) : null,
            incoming > 0 ? h('span', { class: 'chip incoming' }, `被弾予定 ${Math.max(0, incoming - combat.party.block - combat.party.ward)}`) : null,
            combat.party.weak > 0 ? h('span', { class: 'chip status st-weak' }, `脱力${combat.party.weak}`) : null,
            combat.party.vulnerable > 0 ? h('span', { class: 'chip status st-vulnerable' }, `弱体${combat.party.vulnerable}`) : null)),
        h('div', { class: 'chars' }, combat.chars.map(c => {
          const st = combat.currentStats(c.index);
          const pws = combat.powers.filter(p => p.owner === c.index).map(p => R.DATA.powers[p.id].name);
          return h('div', { class: 'char owner-' + c.index, title: pws.length ? 'パワー：' + pws.join('・') : null },
            R.UI.sprite(c.job, 32),
            h('div', { class: 'char-body' },
              h('div', { class: 'char-name' }, c.name, pws.length ? h('span', { class: 'pw-dot' }, ` ◆${pws.length}`) : null),
              h('div', { class: 'char-stats' }, `攻${st.atk} 防${st.def} 魔${st.mag}`)));
        }))));

      // 情報行
      const pileBtn = (k, label, n) => h('button', { class: 'small' + (showPile === k ? ' on' : ''), onclick: () => { showPile = showPile === k ? null : k; render(); } }, `${label} ${n}`);
      root.appendChild(h('div', { class: 'infobar' },
        h('span', { class: 'energy', title: 'エネルギー' }, h('b', null, String(combat.energy)), `/${combat.cfg.energyPerTurn}`),
        h('span', { class: 'muted' }, `ターン${combat.turn}`),
        h('span', { class: 'spacer' }),
        pileBtn('draw', '山札', combat.draw.length),
        pileBtn('discard', '捨て札', combat.discard.length),
        pileBtn('exhaust', '廃棄', combat.exhaust.length)));

      if (showPile) {
        // 山札は順番がわかってしまうので並べ替えて表示
        let list = combat[showPile].slice();
        if (showPile === 'draw') list.sort((a, b) => a.cardId.localeCompare(b.cardId));
        root.appendChild(h('div', { class: 'pile' },
          h('div', { class: 'pile-title' }, { draw: '山札（順不同）', discard: '捨て札', exhaust: '廃棄' }[showPile]),
          h('div', { class: 'cards small' }, list.map(c => cardEl(c, { owner: c.owner, ownerName: combat.chars[c.owner].name })))));
      }

      // 持ち込みアイテム
      if (combat.items.length) {
        root.appendChild(h('div', { class: 'items-row' }, combat.items.map((it, i) => {
          const d = R.DATA.items[it.id];
          return h('button', { class: 'small item-btn', disabled: !!combat.result, title: d.desc,
            onclick: () => act(combat.useItem(i, target)) }, d.name + (it.quality && it.quality !== 'normal' ? `（${R.DATA.config.quality[it.quality].name}）` : ''));
        })));
      }

      // 選択待ち
      if (combat.pending) {
        const p = combat.pending;
        const pool = p.kind === 'scry' ? combat.draw : combat.hand;
        root.appendChild(h('div', { class: 'choice' },
          h('div', { class: 'choice-prompt' }, p.prompt),
          h('div', { class: 'cards scroll' }, p.options.map(iid => {
            const inst = pool.find(c => c.iid === iid);
            const order = selection.indexOf(iid);
            return h('div', { class: 'choice-card' },
              order >= 0 ? h('div', { class: 'order' }, p.kind === 'scry' ? `${order + 1}` : '✓') : null,
              cardEl(inst, {
                owner: inst.owner, ownerName: combat.chars[inst.owner].name, selected: order >= 0,
                stats: combat.currentStats(inst.owner),
                onClick: () => {
                  if (order >= 0) selection.splice(order, 1);
                  else if (p.kind === 'scry' || selection.length < p.count) selection.push(iid);
                  render();
                }
              }));
          })),
          h('button', { class: 'primary', onclick: () => act(combat.resolveChoice(selection)) }, '決定')));
      }

      // 手札（横にスクロール）
      root.appendChild(h('div', { class: 'hand cards scroll' }, combat.hand.map(inst => {
        const playable = combat.canPlay(inst);
        return cardEl(inst, {
          owner: inst.owner, ownerName: combat.chars[inst.owner].name,
          stats: combat.currentStats(inst.owner),
          disabled: !playable,
          onClick: () => { if (playable) act(combat.playCard(inst.iid, target)); else act({ ok: false, error: combat.pending ? '選択を先に済ませてください' : 'エネルギーが足りません' }); }
        });
      })));

      // 操作（画面下に固定）
      const ctrl = h('div', { class: 'action-bar' });
      if (message) ctrl.appendChild(h('div', { class: 'message' }, message));
      if (!combat.result) {
        ctrl.appendChild(h('div', { class: 'row' },
          h('button', { class: 'ghost', onclick: () => { R.AI.playTurn(combat); act({ ok: true }); } }, '自動で1ターン'),
          h('button', { class: 'primary grow', onclick: () => act(combat.endTurn()) }, 'ターン終了')));
      } else {
        const label = { win: '勝利！', lose: '全滅…', timeout: '時間切れ' }[combat.result];
        ctrl.appendChild(h('div', { class: 'row' },
          h('div', { class: 'result result-' + combat.result }, label),
          opts.onFinish ? h('button', { class: 'primary grow', onclick: () => opts.onFinish(combat.result) }, '次へ') : null));
      }

      // ログ（たたんでおける）
      const log = h('div', { class: 'log' }, combat.log.slice(-40).map(l => h('div', null, l)));
      root.appendChild(h('details', { class: 'log-box' }, h('summary', null, 'ログ'), log));
      root.appendChild(ctrl);
      container.appendChild(root);
      log.scrollTop = log.scrollHeight;
    }

    render();
    return { render };
  }

  Object.assign(R.UI, { cardEl, mountCombat });
})(globalThis.RASEN = globalThis.RASEN || {});
