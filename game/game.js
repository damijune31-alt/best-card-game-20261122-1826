// RUNE CLASH — a duel card game. You (Rune Warden) vs Morgath (Ash Herald).
// Static files only, no network. Mouse + keyboard. Scenes via ?scene=title|game|win|loss.
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var MAX_HP = 30, MAX_MANA = 10, HAND_MAX = 7;

  // Seeded RNG (mulberry32) so screenshot scenes are reproducible.
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rand) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // Card: kind strike (deal atk) / guard (gain shield) / mend (restore life).
  function C(name, suit, cls, kind, value, cost, text) {
    return { name: name, suit: suit, cls: cls, kind: kind, value: value, cost: cost, text: text };
  }
  function buildDeck(seed) {
    var d = [
      C('Ember Strike', '♥', 'fire', 'strike', 6, 2, 'Deal 6 damage'),
      C('Ember Strike', '♥', 'fire', 'strike', 4, 1, 'Deal 4 damage'),
      C('Ember Strike', '♥', 'fire', 'strike', 8, 3, 'Deal 8 damage'),
      C('Ember Strike', '♥', 'fire', 'strike', 5, 2, 'Deal 5 damage'),
      C('Ember Strike', '♥', 'fire', 'strike', 9, 4, 'Deal 9 damage'),
      C('Ember Strike', '♥', 'fire', 'strike', 7, 3, 'Deal 7 damage'),
      C('Frost Bite', '♦', 'frost', 'strike', 5, 2, 'Deal 5 damage'),
      C('Frost Bite', '♦', 'frost', 'strike', 3, 1, 'Deal 3 damage'),
      C('Frost Bite', '♦', 'frost', 'strike', 7, 3, 'Deal 7 damage'),
      C('Frost Bite', '♦', 'frost', 'strike', 6, 2, 'Deal 6 damage'),
      C('Frost Bite', '♦', 'frost', 'strike', 8, 3, 'Deal 8 damage'),
      C('Frost Bite', '♦', 'frost', 'strike', 4, 1, 'Deal 4 damage'),
      C('Thorn Lash', '♣', 'thorn', 'strike', 6, 2, 'Deal 6 damage'),
      C('Thorn Lash', '♣', 'thorn', 'strike', 4, 1, 'Deal 4 damage'),
      C('Thorn Lash', '♣', 'thorn', 'strike', 9, 4, 'Deal 9 damage'),
      C('Thorn Lash', '♣', 'thorn', 'strike', 5, 2, 'Deal 5 damage'),
      C('Thorn Lash', '♣', 'thorn', 'strike', 8, 3, 'Deal 8 damage'),
      C('Thorn Lash', '♣', 'thorn', 'strike', 7, 3, 'Deal 7 damage'),
      C('Storm Slash', '♠', 'storm', 'strike', 5, 2, 'Deal 5 damage'),
      C('Storm Slash', '♠', 'storm', 'strike', 7, 3, 'Deal 7 damage'),
      C('Storm Slash', '♠', 'storm', 'strike', 3, 1, 'Deal 3 damage'),
      C('Storm Slash', '♠', 'storm', 'strike', 6, 2, 'Deal 6 damage'),
      C('Storm Slash', '♠', 'storm', 'strike', 8, 3, 'Deal 8 damage'),
      C('Storm Slash', '♠', 'storm', 'strike', 4, 1, 'Deal 4 damage'),
      C('Frost Guard', '♦', 'frost', 'guard', 5, 2, 'Gain 5 shield'),
      C('Thorn Guard', '♣', 'thorn', 'guard', 5, 2, 'Gain 5 shield'),
      C('Storm Guard', '♠', 'storm', 'guard', 5, 2, 'Gain 5 shield'),
      C('Thorn Mend', '♣', 'thorn', 'mend', 6, 3, 'Restore 6 life'),
      C('Ember Mend', '♥', 'fire', 'mend', 6, 3, 'Restore 6 life'),
      C('Frost Mend', '♦', 'frost', 'mend', 6, 3, 'Restore 6 life')
    ];
    return shuffle(d, rng(seed));
  }

  var S = null; // game state

  function newGame(seed) {
    var youDeck = buildDeck(seed), oppDeck = buildDeck(seed + 77);
    S = {
      you: { hp: MAX_HP, shield: 0, mana: 3, maxMana: 3, hand: [], deck: youDeck, discard: [] },
      opp: { hp: MAX_HP, shield: 0, mana: 3, maxMana: 3, hand: [], deck: oppDeck, discard: [] },
      turn: 'you', over: false, score: 0, lastPlayed: null, aiBusy: false
    };
    for (var i = 0; i < 5; i++) { draw(S.you); draw(S.opp); }
    log('The duel begins. Your move, Warden.');
  }
  function draw(who) {
    if (who.deck.length === 0 || who.hand.length >= HAND_MAX) return;
    who.hand.push(who.deck.shift());
  }
  function log(msg) { $('log').textContent = msg; }

  function cardEl(card, playable) {
    var el = document.createElement('div');
    el.className = 'card ' + card.cls + (playable === true ? ' playable' : playable === false ? ' too-costly' : '');
    el.innerHTML =
      '<div class="cost">' + card.cost + '</div>' +
      '<div class="rank">' + card.value + '</div>' +
      '<div class="suit">' + card.suit + '</div>' +
      '<div class="cname">' + card.name + '</div>' +
      '<div class="ctext">' + card.text + '</div>';
    return el;
  }

  function render() {
    // HP bars + numbers
    $('youHpFill').style.width = Math.max(0, S.you.hp) / MAX_HP * 100 + '%';
    $('oppHpFill').style.width = Math.max(0, S.opp.hp) / MAX_HP * 100 + '%';
    $('youHpText').textContent = Math.max(0, S.you.hp) + ' / ' + MAX_HP;
    $('oppHpText').textContent = Math.max(0, S.opp.hp) + ' / ' + MAX_HP;
    $('youShield').textContent = S.you.shield;
    $('oppShield').textContent = S.opp.shield;
    $('youMana').textContent = S.you.mana;
    $('oppMana').textContent = S.opp.mana;
    $('deckCount').textContent = S.you.deck.length;
    $('score').textContent = S.score;
    // Turn banner
    var b = $('turnBanner');
    if (S.turn === 'you') { b.textContent = 'YOUR TURN'; b.className = 'turn-banner'; }
    else { b.textContent = "MORGATH'S TURN"; b.className = 'turn-banner enemy'; }
    $('endBtn').disabled = S.turn !== 'you' || S.over;
    // Opponent hand: face-down backs, count = real hand size
    var oh = $('oppHand'); oh.innerHTML = '';
    for (var i = 0; i < S.opp.hand.length; i++) {
      oh.appendChild(document.createElement('div')).className = 'card back';
    }
    // Player hand
    var ph = $('playerHand'); ph.innerHTML = '';
    S.you.hand.forEach(function (card, idx) {
      var afford = card.cost <= S.you.mana && S.turn === 'you' && !S.over;
      var el = cardEl(card, S.turn === 'you' && !S.over ? afford : null);
      el.title = card.name + ' — cost ' + card.cost + ' mana (key ' + (idx + 1) + ')';
      el.addEventListener('click', function () { playCard(idx); });
      ph.appendChild(el);
    });
    // Last played slot
    var slot = $('lastPlayed');
    slot.innerHTML = S.lastPlayed ? '' : '<span class="slot-label">LAST PLAYED</span>';
    if (S.lastPlayed) slot.appendChild(cardEl(S.lastPlayed, null));
  }

  function dealDamage(target, amount) {
    var absorbed = Math.min(target.shield, amount);
    target.shield -= absorbed;
    var rest = amount - absorbed;
    target.hp = Math.max(0, target.hp - rest);
    return { absorbed: absorbed, hp: rest };
  }

  function playCard(idx, byAI) {
    if (S.over) return;
    var me = byAI ? S.opp : S.you, foe = byAI ? S.you : S.opp;
    if (!byAI && S.turn !== 'you') return;
    var card = me.hand[idx];
    if (!card || card.cost > me.mana) {
      if (!byAI) log('Not enough mana for ' + (card ? card.name : 'that card') + '.');
      return;
    }
    me.mana -= card.cost;
    me.hand.splice(idx, 1);
    me.discard.push(card);
    S.lastPlayed = card;
    var who = byAI ? 'Morgath' : 'You';
    if (card.kind === 'strike') {
      var r = dealDamage(foe, card.value);
      if (!byAI) S.score += card.value;
      log(who + ' played ' + card.name + ' for ' + card.value + ' damage' +
        (r.absorbed ? ' (' + r.absorbed + ' absorbed by shield)' : '') + '.');
    } else if (card.kind === 'guard') {
      me.shield += card.value;
      log(who + ' raised ' + card.name + ' — +' + card.value + ' shield.');
    } else {
      me.hp = Math.min(MAX_HP, me.hp + card.value);
      log(who + ' cast ' + card.name + ' — restored ' + card.value + ' life.');
    }
    render();
    checkEnd();
  }

  function checkEnd() {
    if (S.over) return;
    if (S.opp.hp <= 0) return endGame(true);
    if (S.you.hp <= 0) return endGame(false);
  }

  var endTimer = null;
  function endGame(won) {
    S.over = true;
    render();
    var ov = $('endOverlay');
    ov.className = 'screen ' + (won ? 'win' : 'loss');
    $('endTitle').textContent = won ? 'VICTORY' : 'DEFEAT';
    $('endSub').textContent = won ? 'Morgath falls. The runes are yours.' : 'The Ash Herald prevails. The runes fade.';
    $('endStats').innerHTML =
      'Damage dealt: <b>' + S.score + '</b> &nbsp;·&nbsp; Your life: <b>' + Math.max(0, S.you.hp) + ' / ' + MAX_HP + '</b>' +
      ' &nbsp;·&nbsp; Morgath&rsquo;s life: <b>' + Math.max(0, S.opp.hp) + ' / ' + MAX_HP + '</b>';
    if (endTimer !== null) clearTimeout(endTimer);
    endTimer = setTimeout(function () { endTimer = null; ov.classList.remove('hidden'); }, 450);
  }

  function endTurn() {
    if (S.over || S.turn !== 'you' || S.aiBusy) return;
    S.turn = 'opp';
    S.aiBusy = true;
    render();
    aiStep(0);
  }

  function aiPick() {
    var h = S.opp.hand, m = S.opp.mana;
    var afford = h.map(function (c, i) { return { c: c, i: i }; }).filter(function (x) { return x.c.cost <= m; });
    if (!afford.length) return -1;
    // Heal when hurt, guard when pressured, else biggest strike.
    var mend = afford.filter(function (x) { return x.c.kind === 'mend'; });
    if (S.opp.hp <= 12 && mend.length) return mend[0].i;
    var guard = afford.filter(function (x) { return x.c.kind === 'guard'; });
    if (S.opp.hp <= 15 && guard.length) return guard[0].i;
    var strikes = afford.filter(function (x) { return x.c.kind === 'strike'; })
      .sort(function (a, b) { return b.c.value - a.c.value; });
    if (strikes.length) return strikes[0].i;
    return afford[0].i;
  }

  function aiStep(n) {
    if (S.over) { S.aiBusy = false; return; }
    if (n >= 6) return aiFinish();
    var idx = aiPick();
    if (idx < 0) return aiFinish();
    playCard(idx, true);
    if (S.over) { S.aiBusy = false; return; }
    setTimeout(function () { aiStep(n + 1); }, 620);
  }

  function aiFinish() {
    S.opp.maxMana = Math.min(MAX_MANA, S.opp.maxMana + 1);
    S.opp.mana = S.opp.maxMana;
    draw(S.opp);
    S.you.maxMana = Math.min(MAX_MANA, S.you.maxMana + 1);
    S.you.mana = S.you.maxMana;
    draw(S.you);
    S.turn = 'you';
    S.aiBusy = false;
    log('Morgath ends his turn. Your move, Warden.');
    render();
  }

  function showGame() {
    $('title').classList.add('hidden');
    $('endOverlay').classList.add('hidden');
    $('game').classList.remove('hidden');
  }
  function showTitle() {
    $('game').classList.add('hidden');
    $('endOverlay').classList.add('hidden');
    $('title').classList.remove('hidden');
  }
  function startDuel(seed) {
    if (endTimer !== null) { clearTimeout(endTimer); endTimer = null; }
    newGame(seed == null ? (Date.now() % 2147483647) : seed);
    showGame();
    render();
  }

  // Fixed mid-game table for screenshots (?scene=game|win|loss).
  function presetMidGame() {
    newGame(20261123);
    S.you.hp = 18; S.you.shield = 4; S.you.mana = 6; S.you.maxMana = 6;
    S.opp.hp = 24; S.opp.shield = 2; S.opp.mana = 5; S.opp.maxMana = 6;
    S.score = 27;
    S.you.hand = [
      C('Ember Strike', '♥', 'fire', 'strike', 8, 3, 'Deal 8 damage'),
      C('Frost Guard', '♦', 'frost', 'guard', 5, 2, 'Gain 5 shield'),
      C('Thorn Lash', '♣', 'thorn', 'strike', 6, 2, 'Deal 6 damage'),
      C('Storm Slash', '♠', 'storm', 'strike', 7, 3, 'Deal 7 damage'),
      C('Thorn Mend', '♣', 'thorn', 'mend', 6, 3, 'Restore 6 life')
    ];
    S.opp.hand = [0, 0, 0, 0].map(function () { return C('Ember Strike', '♥', 'fire', 'strike', 5, 2, 'Deal 5 damage'); });
    S.lastPlayed = C('Ember Strike', '♥', 'fire', 'strike', 6, 2, 'Deal 6 damage');
    log('Morgath played Ember Strike for 6 damage. Your move, Warden.');
    showGame();
    render();
  }

  // Buttons + keyboard.
  $('startBtn').addEventListener('click', function () { startDuel(); });
  $('endBtn').addEventListener('click', endTurn);
  $('againBtn').addEventListener('click', function () { startDuel(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { showTitle(); return; }
    if (e.key === 'r' || e.key === 'R') { if (!$('game').classList.contains('hidden')) startDuel(); return; }
    if ($('game').classList.contains('hidden')) {
      if (e.key === 'Enter') startDuel();
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); endTurn(); return; }
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 5) playCard(n - 1);
  });

  // Scene routing.
  var scene = 'title';
  try { scene = new URLSearchParams(window.location.search).get('scene') || 'title'; } catch (err) { scene = 'title'; }
  if (scene === 'game') { presetMidGame(); }
  else if (scene === 'win') { presetMidGame(); S.opp.hp = 0; endGame(true); $('endOverlay').classList.remove('hidden'); }
  else if (scene === 'loss') { presetMidGame(); S.you.hp = 0; endGame(false); $('endOverlay').classList.remove('hidden'); }
  else { showTitle(); }
})();
