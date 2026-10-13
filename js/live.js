// Klimasimulationsspiel – part 3 "Spiel leiten": setup, guided or
// end-values-only rounds, energy check, protocol, autosave, JSON/CSV export.
(() => {
  'use strict';
  const KS = window.KS;
  const t = window.t;
  const { $, fmt, esc, gridSum, gridMean, windShift, exchangeRule, maxFor, applyExchanges, radiate, lossOf, namesAt } = KS;

  const STORE_KEY = 'scapeKlimaspiel.game';
  let game = null;
  const live = { anim: null, setupT: ['', ''] };
  KS.getGame = () => game;

  const validGame = g => g && g.params && Array.isArray(g.init) && g.init.length === 3 && Array.isArray(g.rounds) &&
    Array.isArray(g.names) && g.names.length === 9;
  const gameStates = () => [game.init].concat(game.rounds.map(r => r.grid));
  const lastState = () => { const st = gameStates(); return st[st.length - 1]; };

  const newDraft = () => {
    const aw = windShift(lastState());
    const ex = [];
    for (let j = 0; j < 3; j++) {
      const r = exchangeRule(aw, j);
      ex.push({ pole: r.tie ? (Math.random() < 0.5 ? 0 : 2) : r.pole, amount: '' });
    }
    return { step: 1, ex, final: null, manual: ['', '', '', '', '', '', '', '', ''] };
  };

  KS.loadGame = () => {
    try {
      const s = localStorage.getItem(STORE_KEY);
      if (s) { const g = JSON.parse(s); if (validGame(g)) game = g; }
    } catch (e) { /* storage blocked */ }
    if (game && !game.draft) game.draft = newDraft();
  };
  const saveGame = () => {
    try {
      if (game) localStorage.setItem(STORE_KEY, JSON.stringify(game));
      else localStorage.removeItem(STORE_KEY);
    } catch (e) { /* storage blocked */ }
  };

  const parseAmount = s => { const v = parseInt(s, 10); return isFinite(v) ? v : null; };
  const flatStrings = g => { const o = []; g.forEach(r => { r.forEach(v => { o.push(String(v)); }); }); return o; };

  // Everything the current round needs, derived from the saved state and
  // the draft – nothing derived is ever stored.
  const draftCalc = () => {
    const k = game.rounds.length + 1;
    const prev = lastState(), aw = windShift(prev);
    const ex = game.draft.ex.map(e => {
      const a = parseAmount(e.amount);
      return { pole: e.pole, amount: e.pole === null ? 0 : (a == null ? 0 : a) };
    });
    const ae = applyExchanges(aw, ex);
    const fin = radiate(ae, game.params, game.warm);
    return {
      k, prev, aw, ex, ae, fin,
      names0: namesAt(k - 1, game.names), names1: namesAt(k, game.names),
      round: { afterWind: aw, exchanges: ex, afterExchange: ae, grid: fin, warm: game.warm }
    };
  };

  const gridFromInputs = vals => {
    const g = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let n = 0; n < 9; n++) {
      const v = parseAmount(vals[n]);
      if (v == null) return null;
      g[Math.floor(n / 3)][n % 3] = v;
    }
    return g;
  };
  const gridFromPartial = (vals, fallback) => fallback.map((r, i) => r.map((v, j) => {
    const x = parseAmount(vals[i * 3 + j]);
    return x == null ? v : x;
  }));

  const energyCheckHTML = (prev, g) => {
    const exp = gridSum(prev) + KS.expectedDelta(game.params, game.warm);
    if (!g) return '<div class="check" id="energy-check">' + t('live.energy.pending', fmt(exp, 0), fmt(gridSum(prev), 0), KS.signed(KS.expectedDelta(game.params, game.warm))) + '</div>';
    const s = gridSum(g), d = s - exp;
    if (d === 0) return '<div class="check ok" id="energy-check">' + t('live.energy.ok', fmt(s, 0), fmt(exp, 0), fmt(s / 9, 2)) + '</div>';
    return '<div class="check bad" id="energy-check">' + t('live.energy.bad', fmt(s, 0), fmt(exp, 0), fmt(Math.abs(d), 0), d > 0) + '</div>';
  };

  const gridInputsHTML = (kind, vals, names, placeholders) => {
    let h = '<div class="gin">';
    for (let i = 0; i < 3; i++) {
      h += '<div class="gin-row r' + i + '"><span class="gin-lab">' + KS.rowName(i) + '</span>';
      for (let j = 0; j < 3; j++) {
        const n = i * 3 + j;
        h += '<label class="gin-cell"><small>' + esc(names[i][j]) + '</small><input type="number" step="1" data-in="' + kind +
          '" data-idx="' + n + '" value="' + esc(vals[n]) + '"' + (placeholders ? ' placeholder="' + placeholders[n] + '"' : '') +
          ' aria-label="' + esc(t('live.cellAria', KS.rowName(i), j + 1)) + '"></label>';
      }
      h += '</div>';
    }
    return h + '</div>';
  };

  // ============ SETUP ============
  const setupHTML = () => {
    const p = Object.assign({}, KS.DEFAULT_PARAMS);
    let h = '<p class="text setup-intro">' + t('live.setup.intro') + '</p>';
    h += '<div class="setup-grid"><div>';
    h += '<div class="section-label">' + t('live.setup.namesTitle') + '</div>';
    h += '<p class="note">' + t('live.setup.namesNote') + '</p>';
    h += '<div class="gin">';
    for (let i = 0; i < 3; i++) {
      h += '<div class="gin-row r' + i + '"><span class="gin-lab">' + KS.rowName(i) + '</span>';
      for (let j = 0; j < 3; j++) {
        const n = i * 3 + j;
        h += '<label class="gin-cell"><small>' + t('place', j + 1) + '</small><input type="text" maxlength="14" data-name="' + n + '" placeholder="' + esc(KS.defaultName(n)) + '"></label>';
      }
      h += '</div>';
    }
    h += '</div></div><div>';
    h += '<div class="section-label">' + t('live.setup.startTitle') + '</div>';
    h += '<p class="note" id="start-note">' + t('live.setup.startNote', p.initMin, p.initMax, p.total) + '</p>';
    h += '<div class="gin"><div class="gin-row r1"><span class="gin-lab">' + KS.rowName(1) + '</span>' +
      '<label class="gin-cell"><small>' + t('live.setup.t1') + '</small><input type="number" id="init-t1" value="' + esc(live.setupT[0]) + '"></label>' +
      '<label class="gin-cell"><small>' + t('live.setup.t2') + '</small><input type="number" id="init-t2" value="' + esc(live.setupT[1]) + '"></label>' +
      '<div class="gin-cell"><small>' + t('live.setup.t3') + '</small><output id="init-t3">–</output></div></div></div>';
    h += '<div class="check" id="init-check" hidden></div>';
    h += '<div class="btn-row"><button class="btn" type="button" data-act="roll-init">' + t('live.setup.roll') + '</button></div>';
    h += '<details class="topic"><summary>' + t('live.setup.rules') + '</summary><div class="topic-body">' +
      '<div class="params">' + KS.paramsHTML('lp-', p, KS.PARAM_FIELDS) + '</div>' +
      '<p class="note">' + t('live.setup.rulesNote') + '</p></div></details>';
    h += '<div class="btn-row setup-start">' +
      '<button class="btn" type="button" data-act="import">' + t('live.setup.load') + '</button>' +
      '<button class="btn big primary" type="button" data-act="start-game" id="start-btn" disabled>' + t('live.setup.start') + '</button></div>';
    return h + '</div></div>';
  };

  const setupParams = () => KS.readParams('lp-', KS.DEFAULT_PARAMS, KS.PARAM_FIELDS);

  const updateSetup = () => {
    const p = setupParams();
    $('start-note').innerHTML = t('live.setup.startNote', p.initMin, p.initMax, p.total);
    const a = parseAmount($('init-t1').value), b = parseAmount($('init-t2').value);
    live.setupT = [$('init-t1').value, $('init-t2').value];
    const chk = $('init-check');
    if (a == null || b == null) {
      $('init-t3').textContent = '–';
      chk.hidden = true;
      $('start-btn').disabled = true;
      return;
    }
    $('init-t3').textContent = fmt(p.total - a - b, 0);
    const out = [a, b].filter(v => v < p.initMin || v > p.initMax);
    chk.hidden = out.length === 0;
    chk.className = 'check bad';
    chk.textContent = t('live.setup.outOfRange', out, p.initMin, p.initMax);
    $('start-btn').disabled = false;
  };

  // ============ ONE ROUND ============
  const roundHeadHTML = calc => {
    const p = game.params;
    return '<div class="round-head"><h2>' + t('live.round.title', calc.k) + '</h2><span>' + t('live.round.meanSoFar', fmt(gridMean(calc.prev), 2)) + '</span></div>' +
      '<div class="row-label">' + t('live.round.lossLabel') + '</div>' +
      '<div class="seg">' +
      '<button class="btn' + (!game.warm ? ' active' : '') + '" type="button" data-act="warm-off" aria-pressed="' + !game.warm + '"><span>' + t('live.round.normal') + '<span class="sub">' + t('live.round.perRound', p.loss) + '</span></span></button>' +
      '<button class="btn warm' + (game.warm ? ' active' : '') + '" type="button" data-act="warm-on" aria-pressed="' + !!game.warm + '"><span>' + t('live.round.warm') + '<span class="sub">' + t('live.round.perRound', p.lossWarm) + '</span></span></button></div>' +
      '<div class="row-label">' + t('live.round.entryLabel') + '</div>' +
      '<div class="seg">' +
      '<button class="btn' + (game.entry !== 'manual' ? ' active' : '') + '" type="button" data-act="mode-guided"><span>' + t('live.round.guided') + '<span class="sub">' + t('live.round.guidedSub') + '</span></span></button>' +
      '<button class="btn' + (game.entry === 'manual' ? ' active' : '') + '" type="button" data-act="mode-manual"><span>' + t('live.round.manual') + '<span class="sub">' + t('live.round.manualSub') + '</span></span></button></div>';
  };

  const stepperHTML = step => '<ol class="stepper" aria-label="' + esc(t('live.round.stepsAria')) + '">' + t('live.round.steps').map((l, i) => {
    const n = i + 1;
    return '<li><button class="' + (n < step ? 'done' : '') + '" type="button" data-act="goto-step" data-step="' + n + '"' +
      (n === step ? ' aria-current="step"' : '') + (n > step ? ' disabled' : '') + '><b>' + n + '</b>' + l + '</button></li>';
  }).join('') + '</ol>';

  const poleName = pole => (pole === 0 ? t('live.xcard.north') : t('live.xcard.south'));

  const xcardHTML = (calc, j) => {
    const aw = calc.aw, nm = calc.names1, r = exchangeRule(aw, j), e = game.draft.ex[j];
    let h = '<div class="xcard" data-col="' + j + '">';
    h += '<div class="xhead"><span>' + t('live.xcard.head', j + 1) + '</span><b>' + esc(nm[1][j]) + ' · ' + fmt(aw[1][j], 0) + '</b></div>';
    h += '<div class="xnb"><div class="' + (r.pole !== null && e.pole === 0 ? 'hot' : '') + '">' + t('live.xcard.north') + ': ' + esc(nm[0][j]) + ' · ' + fmt(aw[0][j], 0) + '<small>' + t('live.xcard.diff', fmt(r.dN, 0)) + '</small></div>' +
      '<div class="' + (r.pole !== null && e.pole === 2 ? 'hot' : '') + '">' + t('live.xcard.south') + ': ' + esc(nm[2][j]) + ' · ' + fmt(aw[2][j], 0) + '<small>' + t('live.xcard.diff', fmt(r.dS, 0)) + '</small></div></div>';
    if (r.pole === null) return h + '<p class="xrule">' + t('live.xcard.none') + '</p></div>';
    h += '<p class="xrule">' + (r.tie ? t('live.xcard.tie') : t('live.xcard.rule', poleName(r.pole))) +
      t('live.xcard.allowed', '<span id="xmax-' + j + '">' + maxFor(aw, j, e.pole) + '</span>') + '</p>';
    h += '<div class="seg"><button class="btn' + (e.pole === 0 ? ' active' : '') + '" type="button" data-act="pole" data-col="' + j + '" data-pole="0">' + t('live.xcard.toNorth') + '</button>' +
      '<button class="btn' + (e.pole === 2 ? ' active' : '') + '" type="button" data-act="pole" data-col="' + j + '" data-pole="2">' + t('live.xcard.toSouth') + '</button></div>';
    h += '<div class="amount-row"><button type="button" data-act="amt-dec" data-col="' + j + '" aria-label="' + esc(t('live.xcard.less')) + '">−</button>' +
      '<input type="number" inputmode="numeric" min="0" data-in="amt" data-col="' + j + '" value="' + esc(e.amount) + '" placeholder="?" aria-label="' + esc(t('live.xcard.amountAria', j + 1)) + '">' +
      '<button type="button" data-act="amt-inc" data-col="' + j + '" aria-label="' + esc(t('live.xcard.more')) + '">+</button>' +
      '<button type="button" class="rand" data-act="amt-rand" data-col="' + j + '">' + t('live.xcard.random') + '</button></div>';
    h += '<div class="xwarn" id="xwarn-' + j + '"></div>';
    return h + '</div>';
  };

  const xWarning = (calc, j) => {
    const r = exchangeRule(calc.aw, j), e = game.draft.ex[j];
    if (r.pole === null) return '';
    const msgs = [];
    if (!r.tie && e.pole !== r.pole) msgs.push(t('live.warn.pole', poleName(r.pole)));
    const a = parseAmount(e.amount), m = maxFor(calc.aw, j, e.pole);
    if (a != null && a < 0) msgs.push(t('live.warn.negative'));
    else if (a != null && a > m) msgs.push(t('live.warn.tooMuch', m));
    return msgs.join(' ');
  };

  const step2Missing = () => {
    const calc = draftCalc();
    return game.draft.ex.filter((e, j) => exchangeRule(calc.aw, j).pole !== null && parseAmount(e.amount) == null).length;
  };

  const fieldHTML = () => '<div class="stage-frame square fit" id="live-frame"><canvas id="live-field" class="field" role="img" aria-label="' + esc(t('live.fieldAria')) + '"></canvas></div>';
  const sayHTML = (label, text) => '<div class="say"><div class="say-label">' + label + '</div><p>' + text + '</p></div>';
  const btn = (act, label, cls, extra) => '<button class="btn' + (cls ? ' ' + cls : '') + '" type="button" data-act="' + act + '"' + (extra || '') + '>' + label + '</button>';

  // A round renders as { board, ctrl }: the field with what to announce,
  // and everything the game master types or clicks. On a desktop the two
  // sit side by side.
  const guidedHTML = calc => {
    const d = game.draft, p = game.params;
    let h = '', say;
    if (d.step === 1) {
      say = sayHTML(t('live.say.label'), t('live.say.wind'));
      h += '<div class="btn-row">' + btn('replay', t('live.replay')) + btn('step-next', t('live.next'), 'primary') + '</div>';
    } else if (d.step === 2) {
      say = sayHTML(t('live.say.label'), t('live.say.exchange'));
      h += '<div class="xcards">' + [0, 1, 2].map(j => xcardHTML(calc, j)).join('') + '</div>';
      h += '<div class="btn-row small">' + btn('rand-all', t('live.randAll')) + '</div>';
      h += '<p class="note" id="step2-note"></p>';
      h += '<div class="btn-row">' + btn('step-back', t('live.back')) + btn('step-next', t('live.next'), 'primary', ' id="step2-next"') + '</div>';
    } else if (d.step === 3) {
      say = sayHTML(t('live.say.label'), t('live.say.radiation', p.gain, lossOf(p, game.warm), game.warm, p.loss));
      h += '<div class="btn-row">' + btn('step-back', t('live.back')) + btn('replay', t('live.replayShort')) + btn('step-next', t('live.next'), 'primary') + '</div>';
    } else {
      say = sayHTML(t('live.say.label'), t('live.say.note'));
      h += gridInputsHTML('final', d.final, calc.names1);
      h += energyCheckHTML(calc.prev, gridFromInputs(d.final));
      h += '<div class="btn-row">' + btn('step-back', t('live.back')) + btn('save-round', t('live.save'), 'primary', ' id="save-btn"') + '</div>';
    }
    return { board: fieldHTML() + say, ctrl: h };
  };

  const manualHTML = calc => {
    const d = game.draft;
    const say = sayHTML(t('live.say.flowLabel'), t('live.say.manual'));
    const ph = [];
    for (let n = 0; n < 9; n++) ph.push(fmt(calc.aw[Math.floor(n / 3)][n % 3], 0).replace('−', '-'));
    let h = gridInputsHTML('manual', d.manual, calc.names1, ph);
    h += energyCheckHTML(calc.prev, gridFromInputs(d.manual));
    h += '<div class="btn-row">' + btn('save-round', t('live.save'), 'primary', ' id="save-btn"') + '</div>';
    return { board: fieldHTML() + say, ctrl: h };
  };

  const protocolHTML = () => {
    const st = gameStates(), P = 'live.protocol.';
    let h = '<div class="protocol-wrap"><table class="protocol"><thead><tr><th>' + t(P + 'round') + '</th>' +
      [0, 1, 2].map(i => '<th>' + KS.rowName(i) + '</th>').join('') + '<th>' + t(P + 'mean') + '</th></tr></thead><tbody>';
    for (let k = st.length - 1; k >= 0; k--) {
      const g = st[k], r = k ? game.rounds[k - 1] : null;
      h += '<tr' + (k === st.length - 1 ? ' class="latest"' : '') + '><td' + (r && r.warm ? ' class="warm" title="' + esc(t(P + 'warm')) + '"' : '') + '>' +
        (k ? k + (r && r.warm ? '*' : '') : t(P + 'start')) + '</td>' +
        [0, 1, 2].map(i => '<td>' + g[i].map(v => fmt(v, 0)).join(' · ') + '</td>').join('') +
        '<td><b>' + fmt(gridMean(g), 2) + '</b></td></tr>';
    }
    return h + '</tbody></table></div>';
  };

  const renderLive = () => {
    const root = $('live-root');
    live.anim = null;
    if (!game) {
      root.innerHTML = setupHTML();
      window.SCAPE.wireInfo(root);
      updateSetup();
      return;
    }
    const calc = draftCalc();
    const parts = game.entry === 'manual' ? manualHTML(calc) : guidedHTML(calc);
    const has = game.rounds.length ? '' : ' disabled';
    let h = '<div class="lab"><div class="lab-pre">' + roundHeadHTML(calc) +
      (game.entry === 'manual' ? '' : stepperHTML(game.draft.step)) + '</div>' +
      '<div class="lab-stage">' + parts.board + '</div><div class="lab-post">' + parts.ctrl;
    h += '<div class="section-label with-tools"><span>' + t('live.protocol.title') + '</span><span class="small-label">' + t('live.protocol.legend') + '</span></div>';
    h += protocolHTML();
    h += '<div class="btn-row small">' + btn('undo', t('live.undo'), '', has) + btn('to-results', t('live.toResults'), '', has) + '</div>';
    h += '<div class="btn-row small">' + btn('export-json', t('live.json')) + btn('export-csv', t('live.csv')) +
      btn('import', t('live.load')) + btn('new-game', t('live.newGame')) + '</div>';
    h += '<p class="note">' + t('live.saveNote') + '</p>';
    root.innerHTML = h + '</div></div>';
    window.SCAPE.addFullscreen($('live-frame'));

    if (game.entry !== 'manual') {
      if (game.draft.step === 1) live.anim = { phase: 0, t: 0 };
      if (game.draft.step === 3) live.anim = { phase: 2, t: 0 };
    }
    updateLiveDerived();
  };
  KS.renderLive = renderLive;

  const liveScene = calc => {
    const d = game.draft;
    if (game.entry === 'manual') return { tokens: KS.staticTokens(gridFromPartial(d.manual, calc.aw), calc.names1) };
    if (d.step === 1) {
      if (live.anim) return KS.phaseScene(0, live.anim.t, calc.round, calc.prev, calc.names0, calc.names1, game.params);
      return { tokens: KS.staticTokens(calc.aw, calc.names1) };
    }
    if (d.step === 2) {
      const arrows = game.draft.ex.map((e, j) => {
        const ok = exchangeRule(calc.aw, j).pole !== null;
        return { col: j, pole: ok ? e.pole : null, amount: e.amount === '' ? '' : calc.ex[j].amount };
      });
      return { tokens: KS.staticTokens(calc.ae, calc.names1), arrows };
    }
    if (d.step === 3) return KS.phaseScene(2, live.anim ? live.anim.t : 1, calc.round, calc.prev, calc.names0, calc.names1, game.params);
    return { tokens: KS.staticTokens(gridFromPartial(d.final, calc.fin), calc.names1) };
  };

  KS.drawLiveField = () => {
    const cv = $('live-field');
    if (cv && game) KS.drawField(cv, liveScene(draftCalc()));
  };

  KS.tickLive = dt => {
    if (!live.anim || !game) return;
    live.anim.t = Math.min(1, live.anim.t + dt / 1.3);
    KS.drawLiveField();
    if (live.anim.t >= 1) live.anim = null;
  };

  // Refresh warnings, checks and the field after typing, without rebuilding
  // the inputs (which would steal the focus).
  function updateLiveDerived() {
    if (!game) return;
    const calc = draftCalc(), d = game.draft;
    if (game.entry !== 'manual' && d.step === 2) {
      for (let j = 0; j < 3; j++) {
        const w = $('xwarn-' + j);
        if (w) w.textContent = xWarning(calc, j);
        const mx = $('xmax-' + j);
        if (mx) mx.textContent = maxFor(calc.aw, j, d.ex[j].pole);
      }
      const miss = step2Missing();
      $('step2-note').textContent = miss ? t('live.open', miss) : '';
      $('step2-next').disabled = miss > 0;
    }
    const chk = $('energy-check');
    if (chk) {
      const vals = game.entry === 'manual' ? d.manual : d.final;
      const g = gridFromInputs(vals);
      chk.outerHTML = energyCheckHTML(calc.prev, g);
      $('save-btn').disabled = !g;
      if (game.entry !== 'manual') {
        document.querySelectorAll('[data-in="final"]').forEach(el => {
          const n = +el.getAttribute('data-idx');
          el.classList.toggle('changed', parseAmount(el.value) !== calc.fin[Math.floor(n / 3)][n % 3]);
        });
      }
    }
    KS.drawLiveField();
  }

  const saveRound = () => {
    const calc = draftCalc(), d = game.draft;
    let rec;
    if (game.entry === 'manual') {
      const gm = gridFromInputs(d.manual);
      if (!gm) return;
      rec = { mode: 'manual', warm: !!game.warm, afterWind: calc.aw, exchanges: null, afterExchange: null, grid: gm };
    } else {
      const gf = gridFromInputs(d.final);
      if (!gf) return;
      const edited = JSON.stringify(gf) !== JSON.stringify(calc.fin);
      rec = { mode: 'guided', warm: !!game.warm, afterWind: calc.aw, exchanges: calc.ex, afterExchange: calc.ae, grid: gf, edited };
    }
    game.rounds.push(rec);
    game.draft = newDraft();
    saveGame();
    renderLive();
    const head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--head-h')) || 0;
    window.scrollTo({ top: $('live-root').getBoundingClientRect().top + window.scrollY - head - 12, behavior: 'smooth' });
  };

  const startGame = () => {
    const p = setupParams();
    const a = parseAmount($('init-t1').value), b = parseAmount($('init-t2').value);
    if (a == null || b == null) return;
    const names = [];
    document.querySelectorAll('[data-name]').forEach(el => { names[+el.getAttribute('data-name')] = el.value.trim(); });
    game = {
      version: 1, created: new Date().toISOString(),
      params: p,
      names: names.map((n, i) => n || KS.defaultName(i)),
      init: KS.initialGrid(a, b, p.total), rounds: [], warm: false, entry: 'guided', draft: null
    };
    game.draft = newDraft();
    live.setupT = ['', ''];
    if (KS.resetEnsemble) KS.resetEnsemble();
    saveGame();
    renderLive();
  };

  const exportCSV = () => {
    const C = 'csv.';
    const head = [t(C + 'round'), t(C + 'warm')];
    [0, 1, 2].forEach(i => { for (let j = 1; j <= 3; j++) head.push(t(C + 'cell', KS.rowName(i), j)); });
    game.names.forEach(n => { head.push(t(C + 'person', n)); });
    head.push(t(C + 'mean'));
    const lines = [head.join(';')];
    gameStates().forEach((g, k) => {
      const row = [k === 0 ? t(C + 'start') : k, k === 0 ? '' : (game.rounds[k - 1].warm ? t(C + 'yes') : t(C + 'no'))];
      g.forEach(r => { r.forEach(v => { row.push(v); }); });
      for (let id = 0; id < 9; id++) { const ps = KS.posOf(id, k); row.push(g[ps[0]][ps[1]]); }
      row.push(fmt(gridMean(g), 3).replace('−', '-'));
      lines.push(row.join(';'));
    });
    KS.download(t('files.prefix') + '-' + KS.today() + '.csv', '﻿' + lines.join('\r\n'), 'text/csv');
  };

  KS.setupLive = () => {
    const root = $('live-root');
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b || b.disabled) return;
      const act = b.getAttribute('data-act'), d = game && game.draft;
      const col = +b.getAttribute('data-col');
      switch (act) {
        case 'roll-init': {
          const p = setupParams();
          $('init-t1').value = KS.randInt(Math.random, p.initMin, p.initMax);
          $('init-t2').value = KS.randInt(Math.random, p.initMin, p.initMax);
          updateSetup();
          break;
        }
        case 'start-game': startGame(); break;
        case 'import': $('import-file').click(); break;
        case 'warm-off': case 'warm-on':
          game.warm = act === 'warm-on';
          // The radiation changed, so the values to confirm must be recomputed.
          if (d.step === 4) d.final = flatStrings(draftCalc().fin);
          saveGame(); renderLive(); break;
        case 'mode-guided': case 'mode-manual':
          game.entry = act === 'mode-manual' ? 'manual' : 'guided';
          saveGame(); renderLive(); break;
        case 'goto-step':
          d.step = +b.getAttribute('data-step'); saveGame(); renderLive(); break;
        case 'step-back':
          d.step = Math.max(1, d.step - 1); saveGame(); renderLive(); break;
        case 'step-next':
          if (d.step === 2 && step2Missing()) return;
          d.step = Math.min(4, d.step + 1);
          if (d.step === 4) d.final = flatStrings(draftCalc().fin);
          saveGame(); renderLive(); break;
        case 'replay':
          live.anim = { phase: d.step === 1 ? 0 : 2, t: 0 }; break;
        case 'pole':
          d.ex[col].pole = +b.getAttribute('data-pole'); saveGame(); renderLive(); break;
        case 'amt-dec': case 'amt-inc': {
          let a = parseAmount(d.ex[col].amount);
          a = a == null ? 0 : a + (act === 'amt-inc' ? 1 : -1);
          d.ex[col].amount = String(Math.max(0, a));
          root.querySelector('[data-in="amt"][data-col="' + col + '"]').value = d.ex[col].amount;
          saveGame(); updateLiveDerived(); break;
        }
        case 'amt-rand': case 'rand-all': {
          const aw = draftCalc().aw;
          [0, 1, 2].forEach(j => {
            if (act === 'amt-rand' && j !== col) return;
            if (exchangeRule(aw, j).pole === null) return;
            if (act === 'rand-all' && parseAmount(d.ex[j].amount) != null) return;
            d.ex[j].amount = String(KS.randInt(Math.random, 0, maxFor(aw, j, d.ex[j].pole)));
            const inp = root.querySelector('[data-in="amt"][data-col="' + j + '"]');
            if (inp) inp.value = d.ex[j].amount;
          });
          saveGame(); updateLiveDerived(); break;
        }
        case 'save-round': saveRound(); break;
        case 'undo':
          if (!confirm(t('live.confirmUndo', game.rounds.length))) return;
          game.rounds.pop();
          game.draft = newDraft();
          saveGame(); renderLive(); break;
        case 'to-results': KS.results.source = 'game'; KS.showPart('auswertung', true); break;
        case 'export-json':
          KS.download(t('files.prefix') + '-' + KS.today() + '.json', JSON.stringify(game, null, 1), 'application/json');
          break;
        case 'export-csv': exportCSV(); break;
        case 'new-game':
          if (!confirm(t('live.confirmNew'))) return;
          game = null; saveGame(); renderLive(); break;
        default: break;
      }
    });

    root.addEventListener('input', e => {
      const el = e.target;
      if (el.id === 'init-t1' || el.id === 'init-t2' || (el.id && el.id.startsWith('lp-'))) { updateSetup(); return; }
      const kind = el.getAttribute('data-in');
      if (!kind || !game) return;
      if (kind === 'amt') game.draft.ex[+el.getAttribute('data-col')].amount = el.value;
      else if (kind === 'final') game.draft.final[+el.getAttribute('data-idx')] = el.value;
      else if (kind === 'manual') game.draft.manual[+el.getAttribute('data-idx')] = el.value;
      saveGame();
      updateLiveDerived();
    });

    $('import-file').addEventListener('change', e => {
      const input = e.target;
      const f = input.files && input.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const g = JSON.parse(reader.result);
          if (!validGame(g)) throw new Error('format');
          if (game && !confirm(t('live.confirmReplace'))) return;
          game = g;
          game.draft = newDraft();
          if (KS.resetEnsemble) KS.resetEnsemble();
          saveGame();
          renderLive();
        } catch (err) {
          alert(t('live.badFile'));
        }
      };
      reader.readAsText(f);
      input.value = '';
    });
  };
})();
