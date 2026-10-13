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
      if (st[k] > 0) out.push(h('span', { class: 'status st-' + k }, `${R.Cards.STATUS_NAMES[k]}${st[k]}`));
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

      // 敵
      root.appendChild(h('div', { class: 'enemies' }, combat.enemies.map(e => {
        const info = e.alive ? combat.intentInfo(e) : null;
        return h('div', {
          class: 'enemy' + (e.alive ? '' : ' dead') + (e.index === target && e.alive ? ' targeted' : '') + (e.boss ? ' boss' : ''),
          onclick: () => { if (e.alive) { target = e.index; render(); } }
        },
          h('div', { class: 'enemy-name' }, e.name),
          info ? h('div', { class: 'intent ' + info.kinds.map(k => 'in-' + k).join(' ') }, `次：${info.name}（${info.text}）`) : h('div', { class: 'intent' }, '撃破'),
          bar(e.hp, e.maxHp, 'hp'),
          h('div', { class: 'enemy-sub' },
            e.block > 0 ? h('span', { class: 'block' }, `ブロック${e.block}`) : null,
            e.str > 0 ? h('span', { class: 'status st-str' }, `攻撃+${e.str}`) : null,
            statusList(e.st)));
      })));

      // パーティ
      const incoming = combat.incomingDamage();
      root.appendChild(h('div', { class: 'party' },
        h('div', { class: 'party-hp' },
          h('div', null, 'パーティHP'),
          bar(combat.party.hp, combat.party.maxHp, 'hp'),
          h('div', { class: 'party-sub' },
            h('span', { class: 'block' }, `ブロック${combat.party.block}`),
            combat.party.ward > 0 ? h('span', { class: 'ward' }, `結界${combat.party.ward}`) : null,
            incoming > 0 ? h('span', { class: 'incoming' }, `敵の攻撃予定 ${incoming}`) : null,
            combat.party.weak > 0 ? h('span', { class: 'status st-weak' }, `脱力${combat.party.weak}`) : null,
            combat.party.vulnerable > 0 ? h('span', { class: 'status st-vulnerable' }, `弱体${combat.party.vulnerable}`) : null)),
        h('div', { class: 'chars' }, combat.chars.map(c => {
          const s = combat.currentStats(c.index);
          const pws = combat.powers.filter(p => p.owner === c.index).map(p => R.DATA.powers[p.id].name);
          return h('div', { class: 'char owner-' + c.index },
            h('div', { class: 'char-name' }, c.name),
            h('div', { class: 'char-stats' }, `攻${s.atk} 防${s.def} 魔${s.mag}`),
            pws.length ? h('div', { class: 'char-powers' }, 'パワー：' + pws.join('・')) : null);
        }))));

      // 情報行
      root.appendChild(h('div', { class: 'infobar' },
        h('span', { class: 'energy' }, `エネルギー ${combat.energy}/${combat.cfg.energyPerTurn}`),
        h('span', null, `ターン${combat.turn}`),
        h('button', { class: 'small', onclick: () => { showPile = showPile === 'draw' ? null : 'draw'; render(); } }, `山札 ${combat.draw.length}`),
        h('button', { class: 'small', onclick: () => { showPile = showPile === 'discard' ? null : 'discard'; render(); } }, `捨て札 ${combat.discard.length}`),
        h('button', { class: 'small', onclick: () => { showPile = showPile === 'exhaust' ? null : 'exhaust'; render(); } }, `廃棄 ${combat.exhaust.length}`)));

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
        root.appendChild(h('div', { class: 'items-row' }, '持ち込み：', combat.items.map((it, i) => {
          const d = R.DATA.items[it.id];
          return h('button', { class: 'small', disabled: !!combat.result, title: d.desc,
            onclick: () => act(combat.useItem(i, target)) }, d.name + (it.quality && it.quality !== 'normal' ? `（${R.DATA.config.quality[it.quality].name}）` : ''));
        })));
      }

      // 選択待ち
      if (combat.pending) {
        const p = combat.pending;
        const pool = p.kind === 'scry' ? combat.draw : combat.hand;
        root.appendChild(h('div', { class: 'choice' },
          h('div', { class: 'choice-prompt' }, p.prompt + (p.kind === 'scry' ? '（クリックした順に上から置かれます）' : '')),
          h('div', { class: 'cards' }, p.options.map(iid => {
            const inst = pool.find(c => c.iid === iid);
            const order = selection.indexOf(iid);
            return h('div', { class: 'choice-card' },
              order >= 0 ? h('div', { class: 'order' }, p.kind === 'scry' ? `${order + 1}番目` : '選択中') : null,
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

      // 手札
      root.appendChild(h('div', { class: 'hand cards' }, combat.hand.map(inst => {
        const playable = combat.canPlay(inst);
        return cardEl(inst, {
          owner: inst.owner, ownerName: combat.chars[inst.owner].name,
          stats: combat.currentStats(inst.owner),
          disabled: !playable,
          onClick: () => { if (playable) act(combat.playCard(inst.iid, target)); else act({ ok: false, error: combat.pending ? '選択を先に済ませてください' : 'エネルギーが足りません' }); }
        });
      })));

      // 操作
      const ctrl = h('div', { class: 'controls' });
      if (!combat.result) {
        ctrl.appendChild(h('button', { class: 'primary', onclick: () => act(combat.endTurn()) }, 'ターン終了'));
        ctrl.appendChild(h('button', { onclick: () => { R.AI.playTurn(combat); act({ ok: true }); } }, '自動で1ターン'));
      } else {
        const label = { win: '勝利！', lose: '全滅…', timeout: '時間切れ' }[combat.result];
        ctrl.appendChild(h('div', { class: 'result result-' + combat.result }, label));
        if (opts.onFinish) ctrl.appendChild(h('button', { class: 'primary', onclick: () => opts.onFinish(combat.result) }, '次へ'));
      }
      if (message) ctrl.appendChild(h('span', { class: 'message' }, message));
      root.appendChild(ctrl);

      // ログ
      const log = h('div', { class: 'log' }, combat.log.slice(-40).map(l => h('div', null, l)));
      root.appendChild(log);
      container.appendChild(root);
      log.scrollTop = log.scrollHeight;
    }

    render();
    return { render };
  }

  Object.assign(R.UI, { cardEl, mountCombat });
})(globalThis.RASEN = globalThis.RASEN || {});
