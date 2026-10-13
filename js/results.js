// Klimasimulationsspiel – part 4 "Auswertung": all plots of the Python
// script for the live game or the model run, plus zonal means with a model
// ensemble band, PNG download and the projector (beamer) view.
(() => {
  'use strict';
  const KS = window.KS;
  const t = window.t;
  const { $, fmt, esc, gridMean, rowMean, statesOf, namesAt } = KS;
  const { INK, MUTED, ZONE_COL, GC } = KS.colors;

  const results = { source: null, k: 0, playing: false, acc: 0, sm: 'pos', ens: false, ensCache: null };
  KS.results = results;
  KS.resetEnsemble = () => { results.ensCache = null; };

  const resultsData = () => {
    const game = KS.getGame();
    if (results.source === 'game') {
      if (!game || !game.rounds.length) return null;
      return { label: t('results.game'), params: game.params, init: game.init, rounds: game.rounds, names: game.names };
    }
    const m = KS.model;
    if (!m.run) return null;
    return { label: t('results.modelLabel', m.seed), params: m.run.params, init: m.run.init, rounds: m.run.rounds, names: null };
  };

  const pct = (a, q) => {
    const s = a.slice().sort((x, y) => x - y);
    const i = (s.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i);
    return s[lo] + (s[hi] - s[lo]) * (i - lo);
  };

  // 100 model runs from the same start with the same greenhouse rounds:
  // the spread the rules alone produce, to hold a human game against.
  const ensemble = d => {
    const warmFlags = d.rounds.map(r => !!r.warm);
    const key = results.source + '|' + JSON.stringify(d.init) + '|' + warmFlags.join('') + '|' + JSON.stringify(d.params);
    if (results.ensCache && results.ensCache.key === key) return results.ensCache.data;
    const zones = [[], [], []];
    for (let n = 0; n < 100; n++) {
      const run = KS.runModel(d.params, d.init, KS.mulberry32(7919 * (n + 1)), warmFlags);
      statesOf(run).forEach((g, k) => {
        for (let i = 0; i < 3; i++) (zones[i][k] = zones[i][k] || []).push(rowMean(g, i));
      });
    }
    const out = zones.map(z => ({ lo: z.map(a => pct(a, 0.1)), hi: z.map(a => pct(a, 0.9)) }));
    results.ensCache = { key, data: out };
    return out;
  };

  const legendHTML = items => items.map(it =>
    '<span><i class="' + (it.cls || '') + '" style="color:' + it.color + '"></i>' + esc(it.label) + '</span>').join('');

  const drawResHeat = d => {
    const st = statesOf(d), k = results.k;
    const r = k ? d.rounds[k - 1] : null;
    KS.drawHeatmap($('res-heat'), st[k], namesAt(k, d.names), t('results.heatCaption', k, r && r.warm, fmt(gridMean(st[k]), 2)));
  };

  const renderSmallMultiples = (d, st, warmAt) => {
    const box = $('res-sm');
    const byPerson = results.sm === 'person';
    $('sm-sub').textContent = byPerson ? t('results.smSubPerson') : t('results.smSubPos');
    const cells = [];
    for (let n = 0; n < 9; n++) {
      const i = Math.floor(n / 3), j = n % 3;
      let data, title;
      if (byPerson) {
        data = st.map((g, k) => { const ps = KS.posOf(n, k); return g[ps[0]][ps[1]]; });
        title = (d.names && d.names[n]) || KS.defaultName(n);
      } else {
        data = st.map(g => g[i][j]);
        title = t('results.smCell', KS.rowName(i), j + 1);
      }
      cells.push({ data, title, color: ZONE_COL[i] });
    }
    const yr = KS.rangeOf(cells.map(c => c.data), KS.VMIN, KS.VMAX, 0);
    box.innerHTML = cells.map((c, n) => '<div class="sm-cell"><div class="sm-title">' + esc(c.title) + '</div><canvas id="sm-' + n + '"></canvas></div>').join('');
    cells.forEach((c, n) => {
      KS.lineChart($('sm-' + n), {
        xMax: st.length - 1, yMin: yr[0], yMax: yr[1], warmAt, compact: true,
        series: [{ label: c.title, tip: t('results.value'), data: c.data, color: c.color, width: 2 }]
      });
    });
  };

  KS.renderResults = () => {
    const game = KS.getGame();
    if (!results.source) results.source = game && game.rounds.length ? 'game' : 'model';
    document.querySelectorAll('#res-source [data-source]').forEach(b => {
      const on = b.getAttribute('data-source') === results.source;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    const d = resultsData();
    $('res-empty').hidden = !!d;
    $('res-body').hidden = !d;
    if (!d) {
      $('res-empty').innerHTML = results.source === 'game' ? t('results.emptyGame') : t('results.emptyModel');
      return;
    }
    const st = statesOf(d), n = st.length - 1;
    $('res-label').textContent = d.label;
    $('ro-n').textContent = n;
    $('ro-m0').textContent = fmt(gridMean(st[0]), 2);
    $('ro-m1').textContent = fmt(gridMean(st[n]), 2);
    $('ro-grad').textContent = fmt(rowMean(st[n], 1) - (rowMean(st[n], 0) + rowMean(st[n], 2)) / 2, 1);

    const slider = $('heat-k');
    slider.max = n;
    results.k = Math.min(results.k, n);
    slider.value = results.k;
    drawResHeat(d);

    const wIdx = d.rounds.findIndex(r => r.warm);
    const warmAt = wIdx >= 0 ? wIdx + 1 : null;

    // global mean
    const means = st.map(gridMean);
    const mSeries = [{ label: t('results.mean'), tip: t('results.mean'), data: means, color: INK, width: 2.5 }];
    const legend = [{ label: t('results.measured'), color: INK }];
    if (results.source === 'game') {
      const exp = [means[0]];
      d.rounds.forEach((r, k) => { exp.push(exp[k] + KS.expectedDelta(d.params, r.warm) / 9); });
      mSeries.unshift({ label: t('results.balanceShort'), tip: t('results.balance'), data: exp, color: GC.balance, width: 2, dash: [5, 4] });
      legend.push({ label: t('results.balance'), color: GC.balance, cls: 'dash' });
      const off = means.some((m, k) => Math.abs(m - exp[k]) > 1e-9);
      $('note-mean').textContent = off ? t('results.noteOff') : t('results.noteOn');
    } else {
      $('note-mean').textContent = t('results.noteModel');
    }
    $('leg-mean').innerHTML = legendHTML(legend);
    const yr = KS.rangeOf(mSeries.map(s => s.data), 0, 20, 1);
    KS.lineChart($('res-mean'), { xMax: n, yMin: yr[0], yMax: yr[1], warmAt, series: mSeries });

    // zonal means
    const zSeries = [0, 1, 2].map(i => ({ label: KS.rowName(i), data: st.map(g => rowMean(g, i)), color: ZONE_COL[i], width: 2.5 }));
    const zLegend = zSeries.map(s => ({ label: s.label, color: s.color }));
    let bands = [];
    if (results.ens) {
      const ens = ensemble(d);
      bands = [0, 1, 2].map(i => ({ lo: ens[i].lo, hi: ens[i].hi, color: ZONE_COL[i], tip: t('results.bandTip', KS.rowName(i)) }));
      zLegend.push({ label: t('results.band'), color: MUTED, cls: 'band' });
    }
    $('leg-zonal').innerHTML = legendHTML(zLegend);
    const zr = KS.rangeOf(zSeries.map(s => s.data).concat(bands.map(b => b.lo), bands.map(b => b.hi)), 0, 0, 3);
    KS.lineChart($('res-zonal'), { xMax: n, yMin: zr[0], yMax: zr[1], warmAt, series: zSeries, bands, direct: true });

    renderSmallMultiples(d, st, warmAt);
  };

  KS.tickResults = dt => {
    if (!results.playing) return;
    const d = resultsData();
    if (!d) { results.playing = false; return; }
    results.acc += dt;
    if (results.acc < 0.6) return;
    results.acc = 0;
    if (results.k >= d.rounds.length) {
      results.playing = false;
      $('heat-play').textContent = t('results.play');
      return;
    }
    results.k++;
    $('heat-k').value = results.k;
    drawResHeat(d);
  };

  const setBeamer = on => {
    document.documentElement.classList.toggle('beamer', on);
    $('res-beamer').textContent = on ? t('results.beamerOff') : t('results.beamer');
    requestAnimationFrame(() => KS.redrawCurrent());
  };
  KS.setBeamer = setBeamer;
  const toggleBeamer = () => {
    const on = !document.documentElement.classList.contains('beamer');
    setBeamer(on);
    try {
      if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
      if (!on && document.fullscreenElement) document.exitFullscreen();
    } catch (e) { /* no fullscreen API */ }
  };

  KS.setupResults = () => {
    $('res-source').addEventListener('click', e => {
      const b = e.target.closest('[data-source]');
      if (!b) return;
      results.source = b.getAttribute('data-source');
      results.k = 0;
      results.playing = false;
      $('heat-play').textContent = t('results.play');
      KS.renderResults();
    });
    $('heat-k').addEventListener('input', e => {
      results.k = +e.target.value;
      const d = resultsData();
      if (d) drawResHeat(d);
    });
    $('heat-play').addEventListener('click', e => {
      const d = resultsData();
      if (!d) return;
      results.playing = !results.playing;
      if (results.playing && results.k >= d.rounds.length) { results.k = 0; drawResHeat(d); $('heat-k').value = 0; }
      results.acc = 0;
      e.currentTarget.textContent = results.playing ? t('results.pause') : t('results.play');
    });
    $('res-ens').addEventListener('change', e => { results.ens = e.target.checked; KS.renderResults(); });
    $('sm-mode').addEventListener('click', e => {
      const b = e.target.closest('[data-sm]');
      if (!b) return;
      results.sm = b.getAttribute('data-sm');
      e.currentTarget.querySelectorAll('[data-sm]').forEach(x => { x.classList.toggle('active', x === b); });
      KS.renderResults();
    });
    document.querySelectorAll('[data-png]').forEach(b => {
      const cv = $(b.getAttribute('data-png'));
      b.setAttribute('aria-label', t('results.pngAria', cv.getAttribute('aria-label') || ''));
      b.addEventListener('click', () => {
        const src = results.source === 'game' ? t('files.game') : t('files.model');
        cv.toBlob(blob => { KS.download(t('files.prefix') + '-' + src + '-' + cv.id.replace('res-', '') + '.png', blob); });
      });
    });
    $('res-beamer').addEventListener('click', toggleBeamer);
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && document.documentElement.classList.contains('beamer')) setBeamer(false);
    });
  };
})();
