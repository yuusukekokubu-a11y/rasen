// 戦闘画面
(function (R) {
  const { h, clear, bar } = R.UI;

  // カード1枚の見た目（戦闘以外の画面でも使う）
  //   spec: { cardId, upgraded, enchants }  stats: 数値をステータス込みで表示したいとき
  // カードの絵（モチーフ）を、効果と装備の種類から決める。def.art があればそれを使う
  function cardArt(def) {
    if (def.art) return def.art;
    if (def.type === 'power') return 'art_aura';
    const dmg = def.effects.find(e => e.t === 'dmg');
    if (dmg) {
      if (dmg.element === 'fire') return 'art_fire';
      if (dmg.element === 'ice') return 'art_ice';
      if (dmg.element === 'thunder') return 'art_bolt';
      const hits = dmg.hits || 1;
      switch (def.pool) {
        case 'sword': case 'heavy':
          return dmg.target === 'all' ? 'art_sweep' : hits > 1 ? 'art_slash2' : (def.cost >= 2 || def.pool === 'heavy') ? 'art_impact' : 'art_slash';
        case 'bow': return dmg.target === 'all' ? 'art_rain' : hits >= 3 ? 'art_arrows' : 'art_arrow';
        case 'staff': case 'robe': return 'art_orb';
        case 'starboard': return hits > 1 ? 'art_comet' : 'art_beam';
        case 'scepter': return 'art_holy';
        default: return 'art_dagger';
      }
    }
    const first = def.effects[0] ? def.effects[0].t : '';
    return {
      block: def.pool === 'light' ? 'art_wind' : 'art_shield', ward: 'art_ward', heal: 'art_heal',
      draw: 'art_cards', discard: 'art_cards', scry: 'art_eye', energy: 'art_gem', buff: 'art_up', exhaustChoice: 'art_purge'
    }[first] || 'ico_type_' + def.type;
  }

  function cardEl(spec, opts) {
    opts = opts || {};
    const def = R.Cards.getCardDef(spec.cardId, spec.upgraded);
    const cost = R.Cards.cardCost(def, spec.enchants);
    const d = R.Cards.describeCard(def, spec.enchants, opts.stats);
    const ownerCls = opts.owner !== undefined ? ' owner-' + opts.owner : '';
    // 枠：コストの宝石・名前・絵の窓（種類のアイコン＋持ち主）・説明の紙・種類
    return h('div', {
      class: 'card type-' + def.type + ownerCls + (opts.disabled ? ' disabled' : '') + (opts.selected ? ' selected' : '') + (opts.extraClass ? ' ' + opts.extraClass : ''),
      onclick: opts.onClick, title: opts.title, 'data-iid': spec.iid
    },
      h('span', { class: 'card-cost' + (cost !== def.cost ? ' changed' : '') }, String(cost)),
      h('div', { class: 'card-name' }, def.displayName),
      h('div', { class: 'card-art' },
        R.UI.sprite(cardArt(def), 34, { extraClass: 'type-ico' }),
        opts.ownerJob ? R.UI.sprite(opts.ownerJob, 16, { extraClass: 'own-ico' }) : null),
      h('div', { class: 'card-body' },
        h('div', { class: 'card-text' }, d.text),
        d.enchantText ? h('div', { class: 'card-ench' }, d.enchantText) : null),
      h('div', { class: 'card-type' }, (opts.ownerName ? opts.ownerName + '・' : '') + R.Cards.TYPE_NAMES[def.type]));
  }

  // カードを並べる列の数（縦向き：3〜5列で折り返す／横向き：基本1行）を CSS に渡す
  function handGrid(el) {
    const n = el.children.length;
    el.style.setProperty('--cols', String(n <= 6 ? 3 : n <= 8 ? 4 : 5));
    el.style.setProperty('--wide', String(n <= 7 ? Math.max(n, 5) : Math.ceil(n / 2)));
    return el;
  }

  function statusList(st) {
    const out = [];
    for (const k of ['weak', 'vulnerable', 'burn', 'freeze', 'shock']) {
      if (st[k] > 0) out.push(h('span', { class: 'chip status st-' + k }, `${R.Cards.STATUS_NAMES[k]}${st[k]}`));
    }
    return out;
  }

  // container に戦闘画面を描く。opts.onFinish(result) は戦闘終了後に「次へ」を押したとき
  //   opts.scene：背景の場所（data の dungeon ID など。scene.js の絵の名前）
  function mountCombat(container, combat, opts) {
    opts = opts || {};
    let target = combat._firstAlive();
    let selection = [];
    let message = '';
    let showPile = null;
    let fx = null;           // 直前の行動で起きたこと（数字を飛ばす・揺らす）
    let played = null;       // 直前に使ったカード（敵や味方へ飛ばす演出用）
    const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const HIT_GAP = 380;     // 別の敵の攻撃に移るときの間（ミリ秒）
    const MULTI_GAP = 180;   // 同じ敵の連続攻撃（×2回など）の間
    // 1発ずつの見せる時刻
    const hitTimes = (list) => { let t = 0; return list.map((x, k) => (k === 0 ? 0 : (t += list[k - 1].enemy === x.enemy ? MULTI_GAP : HIT_GAP))); };
    let banner = { text: '戦闘開始' };
    let lastTurn = combat.turn;
    const sceneKind = opts.scene && R.UI.BACKDROPS.includes(opts.scene) ? opts.scene : 'cave';

    // 行動の前後を比べて、ダメージ・回復・ブロックの増減を調べる
    function snapshot() {
      return {
        enemies: combat.enemies.map(e => ({ hp: e.hp, alive: e.alive })),
        hp: combat.party.hp, block: combat.party.block, ward: combat.party.ward,
        attackers: combat.enemies.filter(e => e.alive && e.intent && combat.intentInfo(e) && combat.intentInfo(e).kinds.includes('attack')).map(e => e.index)
      };
    }
    function act(res, before, endedTurn, hits) {
      message = res && !res.ok ? res.error : '';
      if (res && !res.ok) played = null;
      selection = [];
      if (before) {
        fx = { enemyDmg: {}, partyDmg: 0, heal: 0, block: 0, ward: 0, lunge: endedTurn ? before.attackers : [], hits: hits && hits.length ? hits : null, hpBefore: before.hp };
        combat.enemies.forEach((e, i) => { const d = before.enemies[i].hp - e.hp; if (d > 0) fx.enemyDmg[i] = d; });
        const dh = combat.party.hp - before.hp;
        if (dh < 0) fx.partyDmg = -dh; else if (dh > 0) fx.heal = dh;
        if (!endedTurn) { fx.block = Math.max(0, combat.party.block - before.block); fx.ward = Math.max(0, combat.party.ward - before.ward); }
      }
      if (combat.result) banner = { text: { win: '勝利', lose: '全滅', timeout: '時間切れ' }[combat.result], stay: true, lose: combat.result !== 'win' };
      else if (combat.turn !== lastTurn) banner = { text: `ターン ${combat.turn}` };
      lastTurn = combat.turn;
      if (!combat.enemies[target] || !combat.enemies[target].alive) target = combat._firstAlive();
      render();
    }
    // ターン終了のときは、敵の攻撃を1発ずつ記録して、あとで順番に見せる
    const doAct = (fn, endedTurn) => {
      const before = snapshot();
      if (endedTurn) combat.hitLog = [];
      const res = fn();
      const hits = combat.hitLog;
      combat.hitLog = null;
      act(res, before, endedTurn, hits);
    };

    // 数字を要素の上に飛ばす
    function floatText(host, text, cls) {
      if (!host) return;
      const f = h('div', { class: 'float ' + cls, style: { left: '50%', top: '30%' } }, text);
      host.appendChild(f);
      setTimeout(() => f.remove(), 950);
    }
    // 当たったところに絵（カードのモチーフ）をぱっと出す
    function burst(host, art, cls) {
      if (!host) return;
      const b = h('div', { class: 'fx-burst ' + (cls || '') }, R.UI.sprite(art, 68));
      host.appendChild(b);
      setTimeout(() => b.remove(), 600);
    }
    // 使ったカードを、手札の位置から行き先へ飛ばす
    function flyCard(p, dest, done) {
      if (reduceMotion || !p.rect || !dest || typeof document.body.animate !== 'function') { done(); return; }
      const el = p.el;
      el.classList.add('fly-card');
      Object.assign(el.style, { left: p.rect.left + 'px', top: p.rect.top + 'px', width: p.rect.width + 'px', height: p.rect.height + 'px' });
      document.body.appendChild(el);
      const d = dest.getBoundingClientRect();
      const dx = d.left + d.width / 2 - (p.rect.left + p.rect.width / 2);
      const dy = d.top + d.height * 0.45 - (p.rect.top + p.rect.height / 2);
      const anim = el.animate([
        { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx * 0.15}px, ${dy * 0.15 - 24}px) scale(1.08) rotate(-4deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${dx}px, ${dy}px) scale(.3) rotate(${p.attack ? 12 : 0}deg)`, opacity: 0.2 }
      ], { duration: 280, easing: 'ease-in' });
      anim.onfinish = () => { el.remove(); done(); };
    }

    function render() {
      clear(container);
      const root = h('div', { class: 'combat' });

      // 舞台：背景のドット絵の上に敵（上に行動予告、ドット絵、名前、HP）
      const enemyEls = [];
      const enemies = h('div', { class: 'enemies', style: { gridTemplateColumns: `repeat(${combat.enemies.length}, minmax(0, 1fr))` } }, combat.enemies.map(e => {
        const info = e.alive ? combat.intentInfo(e) : null;
        const el = h('button', {
          class: 'enemy e-' + e.id + (e.alive ? '' : ' dead') + (e.index === target && e.alive ? ' targeted' : '') + (e.boss ? ' boss' : ''),
          disabled: !e.alive, 'aria-label': `${e.name}を狙う`,
          onclick: () => { if (e.alive) { target = e.index; render(); } }
        },
          info ? h('div', { class: 'intent ' + info.kinds.map(k => 'in-' + k).join(' '), title: info.name }, info.text) : h('div', { class: 'intent' }, '撃破'),
          h('div', { class: 'target-mark' }, '▼'),
          R.UI.sprite(e.id, e.boss ? 104 : (combat.enemies.length >= 3 ? 64 : 76), { extraClass: 'enemy-sprite' }),
          h('div', { class: 'enemy-shadow' }),
          h('div', { class: 'enemy-name' }, e.name),
          bar(e.hp, e.maxHp, 'hp'),
          h('div', { class: 'enemy-hp' }, `${e.hp}/${e.maxHp}`),
          h('div', { class: 'chips' },
            e.block > 0 ? h('span', { class: 'chip block' }, R.UI.sprite('ico_block', 14), String(e.block)) : null,
            e.str > 0 ? h('span', { class: 'chip st-str' }, `攻+${e.str}`) : null,
            statusList(e.st)));
        enemyEls[e.index] = el;
        return el;
      }));
      const stageEl = R.UI.stage(sceneKind, 'battle-stage', enemies);
      root.appendChild(stageEl);

      // パーティ（ウィンドウ）
      const incoming = combat.incomingDamage();
      const after = Math.max(0, incoming - combat.party.block - combat.party.ward);
      const partyEl = h('div', { class: 'panel party' },
        h('div', { class: 'party-hp' },
          R.UI.sprite('ico_hp', 18),
          bar(combat.party.hp, combat.party.maxHp, 'hp big')),
        h('div', { class: 'chips' },
          h('span', { class: 'chip block' }, R.UI.sprite('ico_block', 14), String(combat.party.block)),
          combat.party.ward > 0 ? h('span', { class: 'chip ward' }, R.UI.sprite('ico_ward', 14), String(combat.party.ward)) : null,
          incoming > 0 ? h('span', { class: 'chip incoming' }, `被弾予定 ${after}`) : null,
          combat.party.weak > 0 ? h('span', { class: 'chip status st-weak' }, `脱力${combat.party.weak}`) : null,
          combat.party.vulnerable > 0 ? h('span', { class: 'chip status st-vulnerable' }, `弱体${combat.party.vulnerable}`) : null),
        h('div', { class: 'chars' }, combat.chars.map(c => {
          const st = combat.currentStats(c.index);
          const pws = combat.powers.filter(p => p.owner === c.index).map(p => R.DATA.powers[p.id].name);
          return h('div', { class: 'char owner-' + c.index, title: pws.length ? 'パワー：' + pws.join('・') : null },
            R.UI.sprite(c.job, 32),
            h('div', { class: 'char-body' },
              h('div', { class: 'char-name' }, c.name, pws.length ? h('span', { class: 'pw-dot' }, ` ◆${pws.length}`) : null),
              R.UI.statLine(st)));
        })));
      root.appendChild(partyEl);

      // 情報行：エネルギーの宝珠・ターン・山札など
      const pileBtn = (k, label, n) => h('button', { class: 'small' + (showPile === k ? ' on' : ''), onclick: () => { showPile = showPile === k ? null : k; render(); } }, `${label} ${n}`);
      // 横向きの画面では、エネルギー・山札・操作ボタンを手札の右に縦に並べる（縦向きでは CSS でばらして元の位置に置く）
      const side = h('div', { class: 'side' });
      root.appendChild(side);
      side.appendChild(h('div', { class: 'infobar' },
        h('span', { class: 'energy' + (combat.energy === 0 ? ' empty' : ''), title: 'エネルギー' }, h('b', null, String(combat.energy)), `/${combat.cfg.energyPerTurn}`),
        h('span', { class: 'turn-label' }, `T${combat.turn}`),
        h('span', { class: 'spacer' }),
        pileBtn('draw', '山札', combat.draw.length),
        pileBtn('discard', '捨札', combat.discard.length),
        pileBtn('exhaust', '廃棄', combat.exhaust.length)));

      if (showPile) {
        // 山札は順番がわかってしまうので並べ替えて表示
        let list = combat[showPile].slice();
        if (showPile === 'draw') list.sort((a, b) => a.cardId.localeCompare(b.cardId));
        root.appendChild(h('div', { class: 'panel pile' },
          h('div', { class: 'pile-title' }, { draw: '山札（順不同）', discard: '捨て札', exhaust: '廃棄' }[showPile]),
          h('div', { class: 'cards small' }, list.map(c => cardEl(c, { owner: c.owner, ownerJob: combat.chars[c.owner].job, ownerName: combat.chars[c.owner].name })))));
      }

      // 持ち込みアイテム
      if (combat.items.length) {
        root.appendChild(h('div', { class: 'items-row' }, combat.items.map((it, i) => {
          const d = R.DATA.items[it.id];
          return h('button', { class: 'small item-btn', disabled: !!combat.result, title: d.desc,
            onclick: () => doAct(() => combat.useItem(i, target)) }, d.name + (it.quality && it.quality !== 'normal' ? `（${R.DATA.config.quality[it.quality].name}）` : ''));
        })));
      }

      // 選択待ち
      if (combat.pending) {
        const p = combat.pending;
        const pool = p.kind === 'scry' ? combat.draw : combat.hand;
        root.appendChild(h('div', { class: 'panel choice' },
          h('div', { class: 'choice-prompt' }, p.prompt),
          handGrid(h('div', { class: 'cards hand-grid' }, p.options.map(iid => {
            const inst = pool.find(c => c.iid === iid);
            const order = selection.indexOf(iid);
            return h('div', { class: 'choice-card' },
              order >= 0 ? h('div', { class: 'order' }, p.kind === 'scry' ? `${order + 1}` : '✓') : null,
              cardEl(inst, {
                owner: inst.owner, ownerJob: combat.chars[inst.owner].job, ownerName: combat.chars[inst.owner].name, selected: order >= 0,
                stats: combat.currentStats(inst.owner),
                onClick: () => {
                  if (order >= 0) selection.splice(order, 1);
                  else if (p.kind === 'scry' || selection.length < p.count) selection.push(iid);
                  render();
                }
              }));
          }))),
          h('button', { class: 'primary', onclick: () => doAct(() => combat.resolveChoice(selection)) }, '決定')));
      }

      // 手札（スクロールなしで全部見えるように並べる）
      root.appendChild(handGrid(h('div', { class: 'hand cards hand-grid' }, combat.hand.map(inst => {
        const playable = combat.canPlay(inst);
        return cardEl(inst, {
          owner: inst.owner, ownerJob: combat.chars[inst.owner].job, ownerName: combat.chars[inst.owner].name,
          stats: combat.currentStats(inst.owner),
          disabled: !playable,
          onClick: (ev) => {
            if (playable) {
              const def = R.Cards.getCardDef(inst.cardId, inst.upgraded);
              played = {
                rect: ev && ev.currentTarget ? ev.currentTarget.getBoundingClientRect() : null,
                el: cardEl(inst, { owner: inst.owner, ownerJob: combat.chars[inst.owner].job, stats: combat.currentStats(inst.owner) }),
                art: cardArt(def), attack: def.type === 'attack', target
              };
              doAct(() => combat.playCard(inst.iid, target));
            } else act({ ok: false, error: combat.pending ? '選択を先に済ませてください' : 'エネルギーが足りません' });
          }
        });
      }))));

      // ログ（たたんでおける）
      const log = h('div', { class: 'log' }, combat.log.slice(-40).map(l => h('div', null, l)));
      root.appendChild(h('details', { class: 'log-box' }, h('summary', null, 'ログ'), log));

      // 操作（画面下に固定）
      const ctrl = h('div', { class: 'action-bar' });
      if (message) ctrl.appendChild(h('div', { class: 'message' }, message));
      if (!combat.result) {
        ctrl.appendChild(h('div', { class: 'row' },
          h('button', { class: 'ghost', onclick: () => doAct(() => { R.AI.playTurn(combat); return { ok: true }; }, true) }, 'おまかせ'),
          h('button', { class: 'primary grow', onclick: () => doAct(() => combat.endTurn(), true) }, 'ターン終了')));
      } else if (opts.onFinish) {
        ctrl.appendChild(h('button', { class: 'primary', onclick: () => opts.onFinish(combat.result) }, '次へ'));
      }
      side.appendChild(ctrl);
      container.appendChild(root);
      log.scrollTop = log.scrollHeight;

      // 敵の攻撃を1発ずつ：その敵が前に出る → パーティが揺れる → 数字 → HPの棒が減る
      function playHits(list, hpBefore) {
        const fill = partyEl.querySelector('.party-hp .bar-fill');
        const text = partyEl.querySelector('.party-hp .bar-text');
        const setHp = (v) => {
          if (fill) fill.style.width = Math.max(0, Math.min(100, v / combat.party.maxHp * 100)) + '%';
          if (text) text.textContent = `${v} / ${combat.party.maxHp}`;
        };
        setHp(hpBefore);
        const times = hitTimes(list);
        list.forEach((hit, k) => setTimeout(() => {
          if (!partyEl.isConnected) return;
          const en = enemyEls[hit.enemy];
          if (en && (k === 0 || list[k - 1].enemy !== hit.enemy)) { en.classList.remove('lunge'); void en.offsetWidth; en.classList.add('lunge'); }
          if (hit.dmg > 0) {
            partyEl.classList.remove('quake'); void partyEl.offsetWidth; partyEl.classList.add('quake');
            floatText(partyEl, `-${hit.dmg}`, 'party-dmg');
            burst(partyEl, 'art_slash2', 'on-party enemy-claw');
          } else floatText(partyEl, '防いだ', 'block-up');
          setHp(hit.hp);
        }, times[k]));
      }

      // 演出：帯・飛び出す数字・揺れ
      // 敵の攻撃を1発ずつ見せる間は、帯（ターン N・全滅など）を後に回す
      const seqMs = fx && fx.hits && !reduceMotion ? hitTimes(fx.hits).pop() + 400 : 0;
      if (banner) {
        const b = banner;
        const showBanner = () => stageEl.appendChild(h('div', { class: 'banner' + (b.stay ? ' stay' : '') + (b.lose ? ' lose' : '') }, b.text));
        if (seqMs) setTimeout(showBanner, seqMs); else showBanner();
        if (!banner.stay) banner = null;
      }
      if (fx) {
        const f = fx, p = played;
        fx = null; played = null;
        // 当たった瞬間の演出（ゆれ・数字・絵）
        const impact = () => {
          for (const [i, d] of Object.entries(f.enemyDmg)) {
            const el = enemyEls[i];
            if (!el) continue;
            el.classList.add('hit');
            floatText(el, String(d), 'dmg');
            if (p && p.attack) burst(el, p.art);
          }
          if (p && p.attack && !Object.keys(f.enemyDmg).length) burst(enemyEls[p.target], p.art);
          if (p && !p.attack) burst(partyEl, p.art, 'on-party');
          if (f.hits && !reduceMotion) playHits(f.hits, f.hpBefore);
          else {
            for (const i of f.lunge) if (enemyEls[i]) enemyEls[i].classList.add('lunge');
            if (f.partyDmg) {
              partyEl.classList.add('quake');
              floatText(partyEl, `-${f.partyDmg}`, 'party-dmg');
              if (f.lunge.length) burst(partyEl, 'art_slash2', 'on-party enemy-claw');
            }
          }
          if (f.heal) floatText(partyEl, `+${f.heal}`, 'heal');
          if (f.block) floatText(partyEl, `盾+${f.block}`, 'block-up');
          if (f.ward) floatText(partyEl, `結界+${f.ward}`, 'ward-up');
        };
        if (p && !combat.pending) {
          const dest = p.attack ? (enemyEls[p.target] || stageEl) : partyEl;
          flyCard(p, dest, impact);
        } else impact();
      }
    }

    render();
    return { render };
  }

  Object.assign(R.UI, { cardArt, cardEl, mountCombat });
})(globalThis.RASEN = globalThis.RASEN || {});
