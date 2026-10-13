// Klimasimulationsspiel – part 2 "Modell": the computer plays all nine
// roles on the animated field, phase by phase.
(() => {
  'use strict';
  const KS = window.KS;
  const t = window.t;
  const { $, fmt, gridMean, gridSum, lossOf, statesOf, namesAt } = KS;

  const model = {
    p: Object.assign({}, KS.DEFAULT_PARAMS), seed: KS.newSeed(), run: null,
    k: 0,            // completed rounds shown
    phase: -1,       // -1 = resting on state k, else the phase of round k+1
    t: 0, playing: false, held: false, stopAfter: false, speed: 1, drawnK: -1
  };
  KS.model = model;
  const PHASE_DUR = 1.1;   // seconds per phase at 1x
  let badge = null;
  const firstAction = () => { if (badge) badge.hide(); };

  const modelStart = () => {
    const rand = KS.mulberry32(model.seed);
    const init = KS.initialGrid(KS.randInt(rand, model.p.initMin, model.p.initMax),
      KS.randInt(rand, model.p.initMin, model.p.initMax), model.p.total);
    model.run = KS.runModel(model.p, init, rand);
    model.k = 0;
    model.phase = -1;
    model.t = 0;
    model.playing = false;
    model.held = false;
    model.drawnK = -1;
    if (KS.resetEnsemble) KS.resetEnsemble();
    $('mo-seed').value = model.seed;
    KS.renderModel();
  };
  KS.modelStart = modelStart;

  const modelNextPhase = () => {
    const R = model.run.rounds.length;
    model.held = false;
    model.t = 0;
    if (model.phase === 2) { model.k++; model.phase = -1; }
    if (model.k >= R) { model.playing = false; model.phase = -1; return false; }
    model.phase++;
    return true;
  };

  KS.tickModel = dt => {
    if (!model.playing) return;
    model.t += dt * model.speed / PHASE_DUR;
    if (model.t >= 1) {
      model.t = 1;
      if (model.stopAfter) {
        model.playing = false;
        model.stopAfter = false;
        model.held = true;
      } else {
        modelNextPhase();   // false at the end
      }
    }
    KS.renderModel();
  };

  const modelScene = () => {
    const run = model.run, st = statesOf(run), k = model.k;
    if (model.phase < 0) return { tokens: KS.staticTokens(st[k], namesAt(k)), grid: st[k] };
    return KS.phaseScene(model.phase, model.t, run.rounds[k], st[k], namesAt(k), namesAt(k + 1), run.params);
  };

  const drawModelMean = doneK => {
    const means = statesOf(model.run).slice(0, doneK + 1).map(gridMean);
    const all = statesOf(model.run).map(gridMean);
    const yr = KS.rangeOf([all], 0, 20, 1);
    const wIdx = model.run.rounds.findIndex(r => r.warm);
    KS.lineChart($('model-mean'), {
      xMax: model.run.rounds.length, yMin: yr[0], yMax: yr[1],
      warmAt: wIdx >= 0 ? wIdx + 1 : null,
      series: [{ label: t('results.mean'), data: means, color: KS.colors.INK, width: 2.5 }]
    });
  };

  KS.renderModel = () => {
    if (!model.run) return;
    const scene = modelScene();
    KS.drawField($('model-field'), scene);
    const R = model.run.rounds.length;
    const inRound = model.phase >= 0;
    const shownRound = inRound ? model.k + 1 : model.k;
    const r = model.run.rounds[Math.max(0, shownRound - 1)];
    $('mo-round').textContent = t('modell.roundOf', shownRound, R);
    $('mo-mean').textContent = fmt(gridMean(scene.grid), 2);
    $('mo-sum').textContent = fmt(Math.round(gridSum(scene.grid)), 0);
    const warmNow = shownRound > 0 && r.warm;
    $('mo-warm').textContent = t('modell.lossValue', lossOf(model.run.params, warmNow), warmNow);
    $('mo-warm').classList.toggle('warm-text', !!warmNow);
    const phases = t('modell.phases');
    $('model-caption').innerHTML = inRound
      ? t('modell.caption.inRound', model.k + 1, phases[model.phase])
      : (model.k === 0
        ? t('modell.caption.start', model.run.params.total)
        : (model.k >= R ? t('modell.caption.done', R) : t('modell.caption.roundDone', model.k)));

    const atEnd = model.k >= R;
    $('mo-play-label').textContent = model.playing ? t('modell.play.pause')
      : (atEnd ? t('modell.play.again') : (model.k || inRound ? t('modell.play.resume') : t('modell.play.start')));
    $('mo-play-sub').textContent = model.playing ? t('modell.play.subPause') : (atEnd ? t('modell.play.subAgain') : t('modell.play.subPlay'));
    $('mo-play-icon').innerHTML = model.playing
      ? '<path d="M8 4h3v16H8zM13 4h3v16h-3z" fill="currentColor"/>'
      : '<path d="M6 4l14 8-14 8V4z" fill="currentColor"/>';
    $('mo-step').disabled = atEnd;
    $('mo-end').disabled = atEnd;

    // The mean curve only needs redrawing when a state is completed.
    const doneK = model.phase === 2 && model.held ? model.k + 1 : model.k;
    if (doneK !== model.drawnK) {
      model.drawnK = doneK;
      drawModelMean(doneK);
    }
  };

  KS.setupModel = () => {
    KS.fillParams($('model-params'), 'mp-', model.p, KS.MODEL_FIELDS);
    $('mo-seed').value = model.seed;
    $('mo-speed-label').textContent = t('modell.speedValue', fmt(model.speed, 1));
    badge = window.SCAPE.badge($('model-frame'));
    badge.show(t('modell.badge'));
    $('model-frame').addEventListener('pointerdown', firstAction);

    $('mo-play').addEventListener('click', () => {
      firstAction();
      if (model.playing) { model.playing = false; KS.renderModel(); return; }
      if (model.k >= model.run.rounds.length) { model.k = 0; model.phase = -1; model.drawnK = -1; }
      if (model.phase < 0 || model.held) modelNextPhase();
      model.stopAfter = false;
      model.playing = true;
      KS.renderModel();
    });
    $('mo-step').addEventListener('click', () => {
      firstAction();
      if (model.playing) { model.stopAfter = true; return; }
      if (model.phase < 0 || model.held) { if (!modelNextPhase()) { KS.renderModel(); return; } }
      model.stopAfter = true;
      model.playing = true;
    });
    $('mo-end').addEventListener('click', () => {
      firstAction();
      model.k = model.run.rounds.length;
      model.phase = -1;
      model.playing = false;
      model.held = false;
      KS.renderModel();
    });
    $('mo-speed').addEventListener('input', e => {
      model.speed = parseFloat(e.target.value);
      $('mo-speed-label').textContent = t('modell.speedValue', fmt(model.speed, 1));
    });
    $('mo-new').addEventListener('click', () => { model.seed = KS.newSeed(); modelStart(); });
    $('mo-results').addEventListener('click', () => { KS.results.source = 'model'; KS.showPart('auswertung', true); });
    $('mo-reseed').addEventListener('click', () => { $('mo-seed').value = KS.newSeed(); });
    $('mo-defaults').addEventListener('click', () => {
      KS.fillParams($('model-params'), 'mp-', KS.DEFAULT_PARAMS, KS.MODEL_FIELDS);
    });
    $('mo-apply').addEventListener('click', () => {
      model.p = KS.readParams('mp-', KS.DEFAULT_PARAMS, KS.MODEL_FIELDS);
      const s = parseInt($('mo-seed').value, 10);
      model.seed = isFinite(s) ? s : KS.newSeed();
      KS.fillParams($('model-params'), 'mp-', model.p, KS.MODEL_FIELDS);
      modelStart();
    });
  };
})();
