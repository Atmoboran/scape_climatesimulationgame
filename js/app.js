// Klimasimulationsspiel – the four parts (header buttons, hash routes,
// poster kicker), the animation loop and start-up.
(() => {
  'use strict';
  const KS = window.KS;
  const t = window.t;
  const { $ } = KS;

  const PARTS = ['anleitung', 'modell', 'spiel', 'auswertung'];
  let current = 'anleitung';

  // "Weiter zu … →" at the end of each part
  document.querySelectorAll('.next-part [data-goto]').forEach(b => {
    b.textContent = t('nextPart', t('nav.' + b.dataset.goto));
  });

  KS.redrawCurrent = () => {
    if (current === 'modell') { KS.model.drawnK = -1; KS.renderModel(); }
    else if (current === 'spiel') KS.drawLiveField();
    else if (current === 'auswertung') KS.renderResults();
  };

  KS.showPart = (name, scroll) => {
    if (!PARTS.includes(name)) name = 'anleitung';
    if (name !== 'auswertung' && document.documentElement.classList.contains('beamer')) KS.setBeamer(false);
    current = name;
    PARTS.forEach(p => { $('part-' + p).hidden = p !== name; });
    document.querySelectorAll('#nav [data-part]').forEach(b => {
      if (b.dataset.part === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    // poster: kicker + lead per part; a slim band on every part but the first
    const n = PARTS.indexOf(name) + 1;
    $('poster-kicker').textContent = t('poster.kicker', n, PARTS.length, t('nav.' + name));
    $('poster-lead').textContent = t('poster.lead.' + name);
    $('poster').classList.toggle('small', name !== 'anleitung');
    if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
    window.dispatchEvent(new Event('resize'));   // the kit re-measures the header
    KS.redrawCurrent();
  };

  // ============ ANIMATION LOOP ============
  let lastT = 0;
  const frame = ts => {
    requestAnimationFrame(frame);
    const dt = lastT ? Math.min((ts - lastT) / 1000, 0.05) : 0;
    lastT = ts;
    if (current === 'modell') KS.tickModel(dt);
    if (current === 'spiel') KS.tickLive(dt);
    if (current === 'auswertung') KS.tickResults(dt);
  };

  // ============ INIT ============
  document.querySelectorAll('#nav [data-part], [data-goto]').forEach(b => {
    b.addEventListener('click', () => KS.showPart(b.dataset.part || b.dataset.goto, true));
  });
  // On a desktop there is room for the settings next to the board.
  if (window.SCAPE.view.get() === 'desktop') $('model-settings').open = true;
  KS.setupModel();
  KS.setupLive();
  KS.setupResults();
  KS.loadGame();
  KS.modelStart();
  KS.renderLive();
  KS.showPart((location.hash || '').slice(1) || 'anleitung');
  requestAnimationFrame(frame);

  // relayout: window size, phone/desktop toggle, fullscreen
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(KS.redrawCurrent, 80);
  });
  window.addEventListener('hashchange', () => KS.showPart(location.hash.slice(1)));
})();
