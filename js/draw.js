// Klimasimulationsspiel – canvas drawing: the 3 × 3 field, line charts and
// the temperature field (heatmap). Colours come from THEME.game and the CD
// temperature scale THEME.tempColor; canvas text is never below 12 px.
(() => {
  'use strict';
  const KS = window.KS;
  const t = window.t;
  const { fmt, ease, lerpGrid, lossOf } = KS;

  // ============ COLOURS ============
  const GC = window.THEME.game;
  const INK = GC.ink, MUTED = GC.muted, GRID = GC.grid, WARM = GC.warm;
  const ZONE_COL = GC.zones;   // north, tropics, south
  const BAND = GC.bands;
  const FONT = window.THEME.font;
  const MIN = 12;               // smallest canvas text on screen (px)
  // the CD knows light, regular and medium: heavier weights become medium
  const font = (w, s) => (w >= 600 ? 500 : w) + ' ' + Math.max(MIN, s) + 'px ' + FONT;
  KS.colors = { INK, MUTED, WARM, ZONE_COL, GC };

  // Temperature colour on the CD scale (cold blue → grey → warm red) over the
  // script's range of −20 … 70 points, as rgb components for contrast.
  const VMIN = -20, VMAX = 70;
  KS.VMIN = VMIN; KS.VMAX = VMAX;
  const heat = v => {
    const css = window.THEME.tempColor(Math.max(0, Math.min(1, (v - VMIN) / (VMAX - VMIN))));
    return { css, rgb: css.match(/\d+/g).map(Number) };
  };
  const inkOn = c => ((0.299 * c.rgb[0] + 0.587 * c.rgb[1] + 0.114 * c.rgb[2]) / 255 < 0.5 ? GC.paper : INK);

  // ============ CANVAS ============
  // Canvas units are CSS pixels (scaled by the device pixel ratio), so a
  // font size here is the size on screen.
  const prep = canvas => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W: r.width, H: r.height };
  };
  // maxRight (optional) keeps the pill inside the grid
  const pill = (ctx, x, y, text, bg, fg, size, align, maxRight) => {
    ctx.font = font(800, size);
    const w = ctx.measureText(text).width + size * 0.9, h = size * 1.55;
    let x0 = align === 'right' ? x - w : (align === 'left' ? x : x - w / 2);
    if (maxRight != null) x0 = Math.min(x0, maxRight - w);
    ctx.fillStyle = bg;
    ctx.fillRect(x0, y - h / 2, w, h);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x0, y - h / 2, w, h);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x0 + w / 2, y + 0.5);
  };

  // ============ THE FIELD (people on the 3x3 grid) ============
  // A scene is a list of tokens at fractional grid positions plus optional
  // exchange arrows and radiation labels. Animations only build scenes;
  // drawing never needs to know which phase it is in.
  const fieldGeom = (W, H) => {
    const lab = Math.min(110, Math.max(84, W * 0.21));
    return { x0: lab, top: 6, cw: (W - lab - 6) / 3, ch: (H - 12) / 3 };
  };
  const tokenSize = G => Math.min(G.cw * 0.7, G.ch * 0.64);

  const drawToken = (ctx, G, tok) => {
    const s = tokenSize(G);
    const cx = G.x0 + (tok.x + 0.5) * G.cw, cy = G.top + (tok.y + 0.5) * G.ch;
    const col = heat(tok.v);
    ctx.globalAlpha = tok.alpha == null ? 1 : tok.alpha;
    ctx.fillStyle = col.css;
    ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
    ctx.lineWidth = tok.hl ? 4 : 2;
    ctx.strokeStyle = tok.hl ? WARM : INK;
    ctx.strokeRect(cx - s / 2, cy - s / 2, s, s);
    ctx.fillStyle = inkOn(col);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font(900, s * 0.36);
    ctx.fillText(fmt(Math.round(tok.v), 0), cx, cy + s * 0.1);
    ctx.font = font(700, s * 0.16);
    const name = tok.name.length > 10 ? tok.name.slice(0, 9) + '…' : tok.name;
    ctx.fillText(name, cx, cy - s * 0.3);
    ctx.globalAlpha = 1;
  };

  const drawArrow = (ctx, G, a) => {
    if (a.pole === null) return;
    const s = tokenSize(G);
    const cx = G.x0 + (a.col + 0.5) * G.cw;
    const yT = G.top + 1.5 * G.ch, yP = G.top + (a.pole + 0.5) * G.ch;
    const dir = a.pole === 0 ? -1 : 1;
    const y0 = yT + dir * s / 2, y1 = yP - dir * s / 2;
    const x = cx + s * 0.22;
    ctx.globalAlpha = a.alpha == null ? 1 : a.alpha;
    ctx.strokeStyle = a.amount > 0 ? GC.wind : MUTED;
    ctx.lineWidth = a.amount > 0 ? 4 : 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1 - dir * 1);
    ctx.moveTo(x - 6, y1 - dir * 7);
    ctx.lineTo(x, y1);
    ctx.lineTo(x + 6, y1 - dir * 7);
    ctx.stroke();
    const label = a.amount === '' || a.amount == null ? '?' : '+' + a.amount;
    // the last column puts its label left of the arrow, inside the grid
    const right = a.col < 2;
    pill(ctx, right ? x + 10 : x - 10, (y0 + y1) / 2, label, a.amount > 0 ? GC.sun : GC.paper, INK, 12, right ? 'left' : 'right');
    ctx.globalAlpha = 1;
  };

  const drawRadiation = (ctx, G, rad) => {
    const s = tokenSize(G);
    ctx.globalAlpha = rad.alpha;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const cx = G.x0 + (j + 0.5) * G.cw, cy = G.top + (i + 0.5) * G.ch;
        const edge = G.x0 + 3 * G.cw - 3;
        if (i === 1) pill(ctx, cx + s / 2, cy - s / 2, '☀ +' + rad.gain, GC.sun, INK, 12, 'center', edge);
        else pill(ctx, cx + s / 2, cy - s / 2, '−' + rad.loss, rad.warm ? WARM : GC.cool, GC.paper, 12, 'center', edge);
      }
    }
    ctx.globalAlpha = 1;
  };

  KS.drawField = (canvas, scene) => {
    const c = prep(canvas);
    if (!c) return;
    const { ctx, W, H } = c, G = fieldGeom(W, H);
    ctx.clearRect(0, 0, W, H);
    const wind = t('rows.wind');
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = BAND[i];
      ctx.fillRect(G.x0, G.top + i * G.ch, 3 * G.cw, G.ch);
      const ly = G.top + (i + 0.5) * G.ch;
      ctx.fillStyle = INK;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = font(800, W < 400 ? 12 : 14);
      ctx.fillText(KS.rowName(i).toUpperCase(), 8, ly - 9);
      ctx.font = font(400, 12);
      ctx.fillText(wind[i], 8, ly + 10);
    }

    // Tokens are clipped to the grid so a person walking off one edge
    // visibly re-enters from the other.
    ctx.save();
    ctx.beginPath();
    ctx.rect(G.x0, G.top, 3 * G.cw, 3 * G.ch);
    ctx.clip();
    scene.tokens.forEach(tok => drawToken(ctx, G, tok));
    ctx.restore();

    (scene.arrows || []).forEach(a => drawArrow(ctx, G, a));
    if (scene.rad) drawRadiation(ctx, G, scene.rad);

    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(G.x0, G.top, 3 * G.cw, 3 * G.ch);
    ctx.beginPath();
    for (let r = 1; r < 3; r++) {
      ctx.moveTo(G.x0, G.top + r * G.ch);
      ctx.lineTo(G.x0 + 3 * G.cw, G.top + r * G.ch);
    }
    ctx.stroke();
  };

  KS.staticTokens = (grid, names) => {
    const out = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) out.push({ x: j, y: i, v: grid[i][j], name: names[i][j] });
    return out;
  };
  // Wind: every token slides one column; the one leaving an edge is drawn
  // twice, once walking out and once walking back in from the far side.
  const windTokens = (grid, names, f) => {
    const out = [];
    for (let i = 0; i < 3; i++) {
      const dir = i === 1 ? -1 : 1;
      for (let j = 0; j < 3; j++) {
        const tok = { x: j + dir * f, y: i, v: grid[i][j], name: names[i][j] };
        out.push(tok);
        if (j + dir < 0 || j + dir > 2) out.push({ x: tok.x - dir * 3, y: i, v: tok.v, name: tok.name });
      }
    }
    return out;
  };
  // Round phases shared by the model animation and the guided live round.
  KS.phaseScene = (phase, f, r, before, names0, names1, p) => {
    if (phase === 0) return { tokens: windTokens(before, names0, ease(f)), grid: before };
    if (phase === 1) {
      const g1 = lerpGrid(r.afterWind, r.afterExchange, ease(Math.min(1, f * 1.4)));
      return {
        tokens: KS.staticTokens(g1, names1), grid: g1,
        arrows: r.exchanges.map((e, j) => ({ col: j, pole: e.pole, amount: e.amount, alpha: 1 }))
      };
    }
    const g2 = lerpGrid(r.afterExchange, r.grid, ease(Math.min(1, f * 1.4)));
    return {
      tokens: KS.staticTokens(g2, names1), grid: g2,
      rad: { alpha: Math.min(1, f * 3), gain: p.gain, loss: lossOf(p, r.warm), warm: r.warm }
    };
  };

  // ============ LINE CHARTS ============
  const niceStep = (range, target) => {
    const raw = range / Math.max(1, target);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  };

  const drawLineChart = canvas => {
    const cfg = canvas._cfg;
    const c = cfg && prep(canvas);
    if (!c) return;
    const { ctx, W, H } = c, cp = !!cfg.compact;
    const pad = { l: cp ? 30 : 40, r: cfg.direct ? 66 : (cp ? 6 : 12), t: cp ? 6 : 12, b: cp ? 18 : 26 };
    const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    const xMax = Math.max(1, cfg.xMax);
    const X = i => pad.l + i / xMax * pw;
    const Y = v => pad.t + (1 - (v - cfg.yMin) / (cfg.yMax - cfg.yMin)) * ph;

    ctx.fillStyle = GC.paper;
    ctx.fillRect(0, 0, W, H);

    // recessive grid
    const ys = niceStep(cfg.yMax - cfg.yMin, cp ? 3 : 5);
    ctx.font = font(400, 12);
    ctx.lineWidth = 1;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    for (let v = Math.ceil(cfg.yMin / ys) * ys; v <= cfg.yMax + 1e-9; v += ys) {
      ctx.strokeStyle = GRID;
      ctx.beginPath();
      ctx.moveTo(pad.l, Math.round(Y(v)) + 0.5);
      ctx.lineTo(pad.l + pw, Math.round(Y(v)) + 0.5);
      ctx.stroke();
      ctx.fillStyle = MUTED;
      ctx.fillText(fmt(v, 1), pad.l - 5, Y(v));
    }
    const xs = Math.max(1, Math.round(niceStep(xMax, cp ? 2 : 6)));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i <= xMax; i += xs) ctx.fillText(String(i), X(i), pad.t + ph + 4);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t + ph + 0.5);
    ctx.lineTo(pad.l + pw, pad.t + ph + 0.5);
    ctx.stroke();

    // greenhouse marker, between the last normal state and the first warm one
    if (cfg.warmAt != null) {
      const wx = X(cfg.warmAt - 0.5);
      ctx.strokeStyle = WARM;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(wx, pad.t);
      ctx.lineTo(wx, pad.t + ph);
      ctx.stroke();
      ctx.setLineDash([]);
      if (!cp) {
        ctx.fillStyle = WARM;
        ctx.font = font(500, 12);
        // Bottom corner: the line ends and their labels live at the top right.
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(t('chart.greenhouse'), wx - 4, pad.t + ph - 3);
      }
    }

    (cfg.bands || []).forEach(b => {
      ctx.fillStyle = b.color;
      ctx.globalAlpha = 0.16;
      ctx.beginPath();
      b.hi.forEach((v, k) => { if (k === 0) ctx.moveTo(X(k), Y(v)); else ctx.lineTo(X(k), Y(v)); });
      for (let k = b.lo.length - 1; k >= 0; k--) ctx.lineTo(X(k), Y(b.lo[k]));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    let maxLen = 0;
    cfg.series.forEach(s => {
      maxLen = Math.max(maxLen, s.data.length);
      if (!s.data.length) return;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width || 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.setLineDash(s.dash || []);
      ctx.beginPath();
      s.data.forEach((v, k) => { if (k === 0) ctx.moveTo(X(k), Y(v)); else ctx.lineTo(X(k), Y(v)); });
      ctx.stroke();
      ctx.setLineDash([]);
      if (s.data.length === 1) {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(X(0), Y(s.data[0]), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Direct labels at the line ends, nudged apart so they never overlap.
    if (cfg.direct) {
      const labs = cfg.series.filter(s => s.data.length && !s.noLabel)
        .map(s => ({ s, y: Y(s.data[s.data.length - 1]), x: X(s.data.length - 1) }))
        .sort((a, b) => a.y - b.y);
      for (let q = 1; q < labs.length; q++) if (labs[q].y - labs[q - 1].y < 15) labs[q].y = labs[q - 1].y + 15;
      ctx.font = font(500, 12);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      labs.forEach(l => {
        ctx.fillStyle = l.s.color;
        ctx.fillRect(l.x + 5, l.y - 1.5, 7, 3);
        ctx.fillStyle = INK;
        ctx.fillText(l.s.label, l.x + 15, l.y);
      });
    }

    // Crosshair + tooltip.
    if (canvas._hx != null && maxLen > 0) {
      let k = Math.round((canvas._hx - pad.l) / pw * xMax);
      k = Math.max(0, Math.min(maxLen - 1, k));
      const hx = X(k);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx + 0.5, pad.t);
      ctx.lineTo(hx + 0.5, pad.t + ph);
      ctx.stroke();
      const rows = [[k === 0 ? t('chart.start') : t('chart.round', k), null]];
      cfg.series.forEach(s => {
        if (k >= s.data.length) return;
        ctx.fillStyle = GC.paper;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hx, Y(s.data[k]), 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        rows.push([(s.tip || s.label) + ': ' + fmt(s.data[k], 1), s.color]);
      });
      (cfg.bands || []).forEach(b => {
        if (b.tip && k < b.lo.length) rows.push([b.tip + ': ' + fmt(b.lo[k], 1) + ' … ' + fmt(b.hi[k], 1), b.color]);
      });
      const fs = 12;
      ctx.font = font(500, fs);
      let tw = 0;
      rows.forEach(r => { tw = Math.max(tw, ctx.measureText(r[0]).width); });
      const bw = tw + (cp ? 18 : 26), bh = rows.length * (fs + 5) + 8;
      let bx = hx + 10 + bw > W ? hx - 10 - bw : hx + 10;
      bx = Math.max(2, bx);
      const by = pad.t + 2;
      ctx.fillStyle = GC.tooltip;
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      rows.forEach((r, n) => {
        const ty = by + 4 + (n + 0.5) * (fs + 5);
        let tx = bx + 6;
        if (r[1]) {
          ctx.fillStyle = r[1];
          ctx.fillRect(tx, ty - 1.5, cp ? 6 : 10, 3);
          tx += cp ? 9 : 14;
        }
        ctx.fillStyle = INK;
        ctx.font = font(n === 0 ? 500 : 400, fs);
        ctx.fillText(r[0], tx, ty);
      });
    }
  };

  // cfg: { xMax, yMin, yMax, series:[{label,data,color,width,dash}],
  //        bands:[{lo,hi,color}], warmAt, compact, direct }
  KS.lineChart = (canvas, cfg) => {
    canvas._cfg = cfg;
    if (!canvas._hover) {
      canvas._hover = true;
      const move = e => {
        const r = canvas.getBoundingClientRect();
        canvas._hx = e.clientX - r.left;
        drawLineChart(canvas);
      };
      canvas.addEventListener('pointermove', move);
      canvas.addEventListener('pointerdown', move);
      canvas.addEventListener('pointerleave', () => { canvas._hx = null; drawLineChart(canvas); });
    }
    drawLineChart(canvas);
  };

  KS.rangeOf = (arrays, minFloor, maxCeil, padding) => {
    let lo = Infinity, hi = -Infinity;
    arrays.forEach(a => { a.forEach(v => { if (v < lo) lo = v; if (v > hi) hi = v; }); });
    if (!isFinite(lo)) { lo = 0; hi = 1; }
    lo = Math.min(minFloor, Math.floor(lo - padding));
    hi = Math.max(maxCeil, Math.ceil(hi + padding));
    return [lo, hi];
  };

  // ============ HEATMAP (the script's imshow) ============
  // The colour bar uses the same scale as the cells, so it is the legend.
  KS.drawHeatmap = (canvas, grid, names, caption) => {
    const c = prep(canvas);
    if (!c) return;
    const { ctx, W, H } = c;
    ctx.fillStyle = GC.paper;
    ctx.fillRect(0, 0, W, H);
    const narrow = W < 420;
    const lab = narrow ? 56 : 112, cb = narrow ? 46 : 58, top = 28, bot = 24;
    const gw = W - lab - cb - 8, cellW = gw / 3, cellH = (H - top - bot) / 3;

    ctx.fillStyle = INK;
    ctx.font = font(500, narrow ? 12 : 14);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(caption, lab, 13);

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const x = lab + j * cellW, y = top + i * cellH;
        const col = heat(grid[i][j]);
        ctx.fillStyle = col.css;
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        ctx.fillStyle = inkOn(col);
        ctx.textAlign = 'center';
        ctx.font = font(300, Math.min(cellW, cellH) * 0.3);
        ctx.fillText(fmt(grid[i][j], 0), x + cellW / 2, y + cellH / 2 + cellH * 0.08);
        if (names) {
          ctx.font = font(500, Math.min(cellW, cellH) * 0.12);
          const n = names[i][j];
          ctx.fillText(n.length > 12 ? n.slice(0, 11) + '…' : n, x + cellW / 2, y + cellH * 0.2);
        }
      }
      ctx.fillStyle = INK;
      ctx.textAlign = 'right';
      ctx.font = font(500, narrow ? 12 : 13);
      ctx.fillText(narrow ? KS.rowName(i) : KS.rowLong(i), lab - 8, top + (i + 0.5) * cellH);
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(lab, top, gw, 3 * cellH);
    ctx.font = font(400, 12);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = MUTED;
    for (let j = 0; j < 3; j++) ctx.fillText(t('place', j + 1), lab + (j + 0.5) * cellW, top + 3 * cellH + 5);

    // colour bar, same range as the script
    const bx = W - cb + 6, bw = 12, by0 = top, by1 = top + 3 * cellH;
    for (let py = by0; py < by1; py++) {
      const v = VMAX - (py - by0) / (by1 - by0) * (VMAX - VMIN);
      ctx.fillStyle = heat(v).css;
      ctx.fillRect(bx, py, bw, 1.5);
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by0, bw, by1 - by0);
    ctx.fillStyle = INK;
    ctx.font = font(400, 12);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let v = VMIN; v <= VMAX; v += 10) {
      if ((narrow || by1 - by0 < 220) && (v - VMIN) % 30) continue;
      const ty = by1 - (v - VMIN) / (VMAX - VMIN) * (by1 - by0);
      ctx.fillText(fmt(v, 0), bx + bw + 4, ty);
    }
  };
})();
