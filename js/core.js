// Klimasimulationsspiel – shared helpers and the model itself (window.KS).
// The model is a faithful port of klimasimulationsspiel.py. The grid is
// three rows – 0 north, 1 tropics, 2 south – of three positions each. Values
// travel with the people who hold them, exactly like np.roll moves them.
(() => {
  'use strict';
  const KS = (window.KS = window.KS || {});
  const t = window.t;

  // ============ SMALL HELPERS ============
  KS.$ = id => document.getElementById(id);
  KS.clone = g => g.map(r => r.slice());
  KS.gridSum = g => g[0][0] + g[0][1] + g[0][2] + g[1][0] + g[1][1] + g[1][2] + g[2][0] + g[2][1] + g[2][2];
  KS.gridMean = g => KS.gridSum(g) / 9;
  KS.rowMean = (g, i) => (g[i][0] + g[i][1] + g[i][2]) / 3;
  KS.lerpGrid = (a, b, f) => a.map((r, i) => r.map((v, j) => v + (b[i][j] - v) * f));
  KS.ease = x => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

  // German number formatting: decimal comma, a real minus sign, and no
  // trailing zeros, so 15 reads "15" and 15.67 reads "15,67".
  KS.fmt = (v, d) => {
    if (v == null || !isFinite(v)) return '–';
    let s = Number(v).toFixed(d == null ? 1 : d);
    if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return s.replace('-', '−').replace('.', ',');
  };
  KS.signed = v => (v > 0 ? '+' : '') + KS.fmt(v, 0);
  KS.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  KS.download = (name, text, mime) => {
    const blob = text instanceof Blob ? text : new Blob([text], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  KS.today = () => new Date().toISOString().slice(0, 10);

  // Seeded random numbers, so a model run can be repeated exactly.
  KS.mulberry32 = a => () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let x = Math.imul(a ^ a >>> 15, 1 | a);
    x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x;
    return ((x ^ x >>> 14) >>> 0) / 4294967296;
  };
  KS.randInt = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
  KS.newSeed = () => Math.floor(Math.random() * 90000) + 10000;

  // ============ NAMES ============
  KS.rowName = i => t('rows.short')[i];
  KS.rowLong = i => t('rows.long')[i];
  KS.defaultName = id => t('names')[id];

  // ============ THE MODEL ============
  KS.DEFAULT_PARAMS = {
    rounds: 24,       // num_iterations = 25 in the script, including the start
    gain: 8,          // sun, per tropics position and round
    loss: 4,          // radiation to space, per hemisphere position and round
    lossWarm: 3,      // the same after the greenhouse twist
    warmRound: 15,    // timestep_globalwarming; 0 = never
    total: 135,       // the three tropics start values add up to this
    initMin: 25,
    initMax: 50
  };

  KS.initialGrid = (t1, t2, total) => [[0, 0, 0], [t1, t2, total - t1 - t2], [0, 0, 0]];

  // Step 1: jet streams push both hemispheres one place right, the trade
  // winds push the tropics one place left; the rows wrap around the globe.
  // Works for values and for player ids alike.
  KS.windShift = g => [
    [g[0][2], g[0][0], g[0][1]],
    [g[1][1], g[1][2], g[1][0]],
    [g[2][2], g[2][0], g[2][1]]
  ];

  // Step 2, the rule for one tropics position: give to the hemisphere with
  // the larger difference, at most half of it. Nothing flows if neither
  // neighbour is colder. On a tie `pole` is only a default; `tie` says the
  // player may choose.
  KS.exchangeRule = (g, j) => {
    const eq = g[1][j], dN = eq - g[0][j], dS = eq - g[2][j];
    const d = Math.max(dN, dS);
    if (d <= 0) return { pole: null, tie: false, dN, dS, max: 0 };
    return { pole: dN > dS ? 0 : 2, tie: dN === dS, dN, dS, max: Math.floor(d / 2) };
  };
  KS.maxFor = (g, j, pole) => {
    const d = g[1][j] - g[pole][j];
    return d > 0 ? Math.floor(d / 2) : 0;
  };
  KS.applyExchanges = (g, ex) => {
    const o = KS.clone(g);
    ex.forEach((e, j) => {
      if (e.pole === null || !e.amount) return;
      o[1][j] -= e.amount;
      o[e.pole][j] += e.amount;
    });
    return o;
  };

  // Step 3: sun in, radiation out.
  KS.lossOf = (p, warm) => (warm ? p.lossWarm : p.loss);
  KS.radiate = (g, p, warm) => {
    const o = KS.clone(g), loss = KS.lossOf(p, warm);
    for (let j = 0; j < 3; j++) { o[1][j] += p.gain; o[0][j] -= loss; o[2][j] -= loss; }
    return o;
  };
  // The exchange only moves points around, so the whole grid's sum changes
  // by exactly this much per round. That is the game master's energy check.
  KS.expectedDelta = (p, warm) => 3 * p.gain - 6 * KS.lossOf(p, warm);

  KS.modelRound = (prev, p, warm, rand) => {
    const aw = KS.windShift(prev);
    const ex = [];
    for (let j = 0; j < 3; j++) {
      const r = KS.exchangeRule(aw, j);
      if (r.pole === null) { ex.push({ pole: null, amount: 0 }); continue; }
      let pole = r.pole;
      if (r.tie) pole = rand() < 0.5 ? 0 : 2;   // the script always picks south here
      ex.push({ pole, amount: KS.randInt(rand, 0, r.max) });
    }
    const ae = KS.applyExchanges(aw, ex);
    return { mode: 'model', warm, afterWind: aw, exchanges: ex, afterExchange: ae, grid: KS.radiate(ae, p, warm) };
  };

  // warmFlags (optional) replays a given greenhouse schedule round by round,
  // which is how the ensemble mirrors a live game.
  KS.runModel = (p, init, rand, warmFlags) => {
    const rounds = [];
    let g = init;
    const n = warmFlags ? warmFlags.length : p.rounds;
    for (let k = 1; k <= n; k++) {
      const warm = warmFlags ? !!warmFlags[k - 1] : (p.warmRound > 0 && k >= p.warmRound);
      const r = KS.modelRound(g, p, warm, rand);
      rounds.push(r);
      g = r.grid;
    }
    return { params: p, init, rounds };
  };
  KS.statesOf = run => [run.init].concat(run.rounds.map(r => r.grid));

  // Who stands where after k rounds. The wind has period 3 in both rows.
  const ID_GRID = [[0, 1, 2], [3, 4, 5], [6, 7, 8]];
  KS.idsAt = k => {
    let g = ID_GRID;
    for (let i = 0; i < ((k % 3) + 3) % 3; i++) g = KS.windShift(g);
    return g;
  };
  KS.namesAt = (k, names) => KS.idsAt(k).map(r => r.map(id => (names && names[id]) || KS.defaultName(id)));
  KS.posOf = (id, k) => {
    const g = KS.idsAt(k);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (g[i][j] === id) return [i, j];
    return null;
  };

  // ============ RULE SETTINGS (model settings and "Spielregeln anpassen") ============
  // The numbers in the help texts (gradient ~3.7 x sun, settling after
  // 5-6 rounds) were measured over 300 runs per setting.
  KS.PARAM_FIELDS = [
    { key: 'gain', min: 0, max: 50 },
    { key: 'loss', min: 0, max: 50 },
    { key: 'lossWarm', min: 0, max: 50 },
    { key: 'total', min: 0, max: 999 },
    { key: 'initMin', min: -99, max: 999, help: 'rangeHelp' },
    { key: 'initMax', min: -99, max: 999, help: 'rangeHelp' }
  ];
  KS.MODEL_FIELDS = [
    { key: 'rounds', min: 1, max: 200 },
    { key: 'warmRound', min: 0, max: 200 }
  ].concat(KS.PARAM_FIELDS);

  KS.paramsHTML = (prefix, p, fields) => fields.map(f => {
    const id = prefix + f.key, hid = 'h-' + id;
    const label = t('params.' + f.key + '.label');
    const help = f.help ? t('params.' + f.help) : t('params.' + f.key + '.help');
    return '<div class="param"><div class="param-head"><label for="' + id + '">' + label + '<small>' + t('params.' + f.key + '.sub') + '</small></label>' +
      '<button type="button" class="info" aria-controls="' + hid + '" aria-label="' + KS.esc(t('params.infoAria', label)) + '"></button>' +
      '</div><input type="number" id="' + id + '" value="' + p[f.key] + '" min="' + f.min + '" max="' + f.max + '">' +
      '<div class="info-note" id="' + hid + '" hidden>' + help + '</div></div>';
  }).join('');

  // Fill a settings grid and wire its info buttons.
  KS.fillParams = (box, prefix, p, fields) => {
    box.innerHTML = KS.paramsHTML(prefix, p, fields);
    window.SCAPE.wireInfo(box);
  };

  KS.readParams = (prefix, base, fields) => {
    const p = Object.assign({}, base);
    fields.forEach(f => {
      const el = KS.$(prefix + f.key);
      if (!el) return;
      const v = parseInt(el.value, 10);
      if (isFinite(v)) p[f.key] = Math.max(f.min, Math.min(f.max, v));
    });
    if (p.initMax < p.initMin) { const x = p.initMin; p.initMin = p.initMax; p.initMax = x; }
    return p;
  };

  // An open explanation takes the full width of the settings grid so it
  // stays readable (the kit has already toggled the note at this point).
  document.addEventListener('click', e => {
    const b = e.target.closest('.param .info');
    if (b) b.closest('.param').classList.toggle('open', b.getAttribute('aria-expanded') === 'true');
  });
})();
