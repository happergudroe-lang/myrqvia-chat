/*!
 * MYRQVIA Chat 2.0 — message recall dissolve
 * ---------------------------------------------------------------------------
 * Classic-script IIFE. No modules, no external libraries.
 *
 * Public API (do not change):
 *   window.MYRQVIA = window.MYRQVIA || {};
 *   MYRQVIA.recall = {
 *     play(bubbleEl, opts = {}) -> Promise,
 *     supports: boolean
 *   };
 *
 * opts:
 *   host          optional scroll-content element; canvas is mounted inside it
 *   reduceMotion  boolean; true => 200ms quiet opacity fade, no particles
 *   speed         number, default 1 (0.25 = slow inspection)
 *   freezeAt      number | null, ms into the animation; renders that frame and
 *                 holds it (debug / screenshot mode), resolves after ~240ms
 *   onProgress    optional (t: 0..1) => void
 *
 * Motion model (all times at speed = 1)
 *   wave 1  150–410 ms   d < 0.30   (nearest the top-right corner)
 *   wave 2  430–700 ms   0.30–0.66
 *   wave 3  720–970 ms   0.66–1.00  (bottom-left corner last)
 *   each 3–4 px cell then drifts left/down, rotates ≤ 7°, shrinks and fades
 *   over 500–700 ms. The whole effect resolves at 1740 ms.
 *
 * The bubble is captured to an offscreen canvas through an SVG foreignObject
 * (computed styles inlined, DPR capped at 2). If that fails in any way the
 * module paints a geometry/text approximation instead — the animation always
 * has a correct, solid bitmap to disintegrate.
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var MYRQVIA = (window.MYRQVIA = window.MYRQVIA || {});
  if (MYRQVIA.recall && typeof MYRQVIA.recall.play === 'function') return; // idempotent install

  /* ======================================================================
     0. Environment + helpers
     ====================================================================== */

  var CANVAS_OK = (function () {
    try {
      var c = document.createElement('canvas');
      return !!(c.getContext && c.getContext('2d') && window.requestAnimationFrame);
    } catch (e) {
      return false;
    }
  })();

  var raf = window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : function (cb) { return window.setTimeout(function () { cb(now()); }, 16); };
  var caf = window.cancelAnimationFrame
    ? window.cancelAnimationFrame.bind(window)
    : function (id) { window.clearTimeout(id); };

  function now() {
    return window.performance && window.performance.now ? window.performance.now() : Date.now();
  }
  function clamp(v, min, max) { return v < min ? min : (v > max ? max : v); }
  function clamp01(v) { return clamp(v, 0, 1); }
  function prefersReducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) {
      return false;
    }
  }
  function getDpr() {
    var d = window.devicePixelRatio || 1;
    return Math.min(DPR_CAP, Math.max(1, d));
  }
  function cssColor(value, fallback) {
    if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return fallback;
    return value;
  }

  /* ======================================================================
     1. Timing / tuning
     ====================================================================== */

  var DPR_CAP = 2;

  var TIMING = {
    total: 1740,          // resolve point
    glint: 160,           // 4-point star glint at the top-right corner
    freezeResolveDelay: 240,
    minDelay: 140,        // keeps the bubble intact for the first ~150ms
    maxDelay: 1010,
    jitter: 38,           // per-cell release jitter (ms)
    noise: 30,            // smooth front wobble (ms)
    lifeMin: 440,
    lifeMax: 600,
    waves: [
      { d0: 0.00, d1: 0.30, start: 150, end: 410 },
      { d0: 0.28, d1: 0.66, start: 430, end: 700 },
      { d0: 0.64, d1: 1.00, start: 720, end: 970 }
    ]
  };

  var CELL_SMALL = 3;     // CSS px, default — fine fragments
  var CELL_MAX = 6;
  var CELL_BUDGET = 4300; // max cells, keeps 60fps on large bubbles

  var PAD = { top: 36, right: 28, bottom: 88, left: 112 };
  var DRIFT_X_ROOM = 112; // px of horizontal room for full leftward drift
  var DRIFT_Y_ROOM = 84;  // px of downward room for full drift

  var CANVAS_CLASS = 'myrqvia-recall-canvas';

  /* ======================================================================
     2. Capture — foreignObject path
     ====================================================================== */

  // Computed style properties that must survive the trip into an SVG image.
  // External stylesheets do not exist inside the SVG document, so everything
  // is inlined. Pseudo-elements and external images are out of scope.
  var STYLE_PROPS = [
    'display', 'position', 'box-sizing', 'float', 'clear', 'visibility',
    'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'top', 'right', 'bottom', 'left', 'z-index',
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'border-top-left-radius', 'border-top-right-radius',
    'border-bottom-right-radius', 'border-bottom-left-radius',
    'background-color', 'background-image', 'background-repeat',
    'background-size', 'background-position', 'background-clip', 'background-origin',
    'box-shadow', 'opacity', 'overflow', 'overflow-x', 'overflow-y',
    'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant',
    'font-feature-settings', 'font-kerning', 'font-stretch',
    'line-height', 'letter-spacing', 'word-spacing', 'text-align',
    'text-decoration', 'text-transform', 'text-indent', 'text-shadow',
    'white-space', 'word-break', 'overflow-wrap', 'word-wrap', 'hyphens', 'tab-size',
    'vertical-align', 'color', '-webkit-text-fill-color', '-webkit-font-smoothing',
    'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
    'align-items', 'align-self', 'align-content', 'justify-content',
    'gap', 'row-gap', 'column-gap',
    'list-style-type', 'list-style-position', 'list-style-image',
    'border-collapse', 'border-spacing', 'table-layout',
    'transform', 'transform-origin', 'filter', 'mix-blend-mode',
    'object-fit', 'object-position', 'stroke', 'stroke-width', 'fill'
  ];

  function inlineComputedStyles(src, dst) {
    var cs = window.getComputedStyle(src);
    var css = '';
    for (var i = 0; i < STYLE_PROPS.length; i++) {
      var prop = STYLE_PROPS[i];
      var value = cs.getPropertyValue(prop);
      if (value) css += prop + ':' + value + ';';
    }
    dst.setAttribute('style', css);
    var sc = src.children;
    var dc = dst.children;
    for (var j = 0; j < sc.length; j++) inlineComputedStyles(sc[j], dc[j]);
  }

  // Inline <svg> clones serialised through XML parsing need an explicit SVG
  // namespace or the icon disappears from the captured bitmap.
  function fixSvgNamespaces(root) {
    if (root.tagName && root.tagName.toLowerCase() === 'svg') {
      root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    var svgs = root.querySelectorAll ? root.querySelectorAll('svg') : [];
    for (var i = 0; i < svgs.length; i++) {
      svgs[i].setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
  }

  function resetCloneRoot(clone, W, H) {
    var s = clone.style;
    s.position = 'relative';
    s.top = 'auto'; s.right = 'auto'; s.bottom = 'auto'; s.left = 'auto';
    s.margin = '0';
    s.transform = 'none';
    s.opacity = '1';
    s.visibility = 'visible';
    s.width = W + 'px';
    s.height = H + 'px';
    s.boxSizing = 'border-box';
    s.maxWidth = 'none';
    s.maxHeight = 'none';
    s.minWidth = '0';
    s.minHeight = '0';
    s.float = 'none';
    s.zIndex = '0';
  }

  function captureForeignObject(bubbleEl, rect) {
    var W = Math.max(1, rect.width);
    var H = Math.max(1, rect.height);
    var dpr = getDpr();
    var SW = Math.max(1, Math.round(W * dpr));
    var SH = Math.max(1, Math.round(H * dpr));

    var clone = bubbleEl.cloneNode(true);
    inlineComputedStyles(bubbleEl, clone);
    fixSvgNamespaces(clone);
    resetCloneRoot(clone, W, H);

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H +
      '" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<foreignObject x="0" y="0" width="' + W + '" height="' + H + '">' +
      '<div xmlns="http://www.w3.org/1999/xhtml" style="width:' + W + 'px;height:' + H +
      'px;overflow:hidden">' + clone.outerHTML + '</div>' +
      '</foreignObject></svg>';

    return new Promise(function (resolve, reject) {
      var img = new Image();
      var settled = false;
      img.decoding = 'sync';
      img.onload = function () {
        if (settled) return;
        settled = true;
        try {
          var canvas = document.createElement('canvas');
          canvas.width = SW;
          canvas.height = SH;
          var ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('no 2d context');
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(img, 0, 0, SW, SH);
          var data;
          try {
            data = ctx.getImageData(0, 0, SW, SH);
          } catch (e) {
            // tainted canvas — treat as capture failure
            reject(e);
            return;
          }
          // A solid bubble surface must have an opaque pixel at its centre.
          var idx = (((SH >> 1) * SW) + (SW >> 1)) * 4;
          if (data.data[idx + 3] < 16) {
            reject(new Error('capture appears empty'));
            return;
          }
          resolve({
            canvas: canvas, data: data, W: W, H: H, SW: SW, SH: SH,
            dpr: dpr, mode: 'foreignObject'
          });
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = function () {
        if (settled) return;
        settled = true;
        reject(new Error('foreignObject image failed'));
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  /* ======================================================================
     3. Capture — fallback (DOM geometry + text approximation)
     ====================================================================== */

  function parseRadius(value) {
    var n = parseFloat(value);
    return isFinite(n) && n > 0 ? n : 0;
  }
  function cornerRadii(cs) {
    return {
      tl: parseRadius(cs.borderTopLeftRadius),
      tr: parseRadius(cs.borderTopRightRadius),
      br: parseRadius(cs.borderBottomRightRadius),
      bl: parseRadius(cs.borderBottomLeftRadius)
    };
  }
  function roundRectPath(ctx, x, y, w, h, radii) {
    var tl = Math.min(radii.tl, w / 2, h / 2);
    var tr = Math.min(radii.tr, w / 2, h / 2);
    var br = Math.min(radii.br, w / 2, h / 2);
    var bl = Math.min(radii.bl, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.arcTo(x + w, y, x + w, y + tr, tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
    ctx.lineTo(x + bl, y + h);
    ctx.arcTo(x, y + h, x, y + h - bl, bl);
    ctx.lineTo(x, y + tl);
    ctx.arcTo(x, y, x + tl, y, tl);
    ctx.closePath();
  }

  function drawFallbackText(ctx, el, baseX, baseY) {
    if (!document.createTreeWalker || !document.createRange) return;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while ((node = walker.nextNode())) {
      var text = node.nodeValue;
      if (!text || !/\S/.test(text)) continue;
      var parent = node.parentElement;
      if (!parent) continue;
      var pcs = window.getComputedStyle(parent);
      if (pcs.display === 'none' || pcs.visibility === 'hidden') continue;
      ctx.font = pcs.font || (pcs.fontStyle + ' ' + pcs.fontWeight + ' ' + pcs.fontSize + ' ' + pcs.fontFamily);
      ctx.fillStyle = cssColor(pcs.color, '#111113');
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      var range = document.createRange();
      for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);
        if (!/\S/.test(ch)) continue;
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        var rects = range.getClientRects();
        if (!rects.length) continue;
        var r = rects[0];
        if (r.width <= 0) continue;
        ctx.fillText(ch, r.left - baseX, r.top - baseY + r.height / 2);
      }
    }
  }

  function captureFallback(bubbleEl, rect) {
    var W = Math.max(1, rect.width);
    var H = Math.max(1, rect.height);
    var dpr = getDpr();
    var SW = Math.max(1, Math.round(W * dpr));
    var SH = Math.max(1, Math.round(H * dpr));
    var baseX = rect.left;
    var baseY = rect.top;

    var canvas = document.createElement('canvas');
    canvas.width = SW;
    canvas.height = SH;
    var ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var cs = window.getComputedStyle(bubbleEl);
    ctx.fillStyle = cssColor(cs.backgroundColor, '#ffffff');
    roundRectPath(ctx, 0, 0, W, H, cornerRadii(cs));
    ctx.fill();

    var bw = parseFloat(cs.borderTopWidth) || 0;
    if (bw > 0 && cs.borderTopStyle !== 'none') {
      ctx.strokeStyle = cssColor(cs.borderTopColor, 'transparent');
      ctx.lineWidth = bw;
      roundRectPath(ctx, bw / 2, bw / 2, W - bw, H - bw, cornerRadii(cs));
      ctx.stroke();
    }

    // Descendant surfaces (file rows, icon chips, etc.)
    var nodes = bubbleEl.querySelectorAll('*');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var ncs = window.getComputedStyle(node);
      if (ncs.display === 'none' || ncs.visibility === 'hidden') continue;
      var r = node.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      var x = r.left - baseX;
      var y = r.top - baseY;
      var nbg = ncs.backgroundColor;
      if (nbg && nbg !== 'rgba(0, 0, 0, 0)' && nbg !== 'transparent') {
        ctx.fillStyle = nbg;
        roundRectPath(ctx, x, y, r.width, r.height, cornerRadii(ncs));
        ctx.fill();
      }
      var nbw = parseFloat(ncs.borderTopWidth) || 0;
      if (nbw > 0 && ncs.borderTopStyle !== 'none') {
        ctx.strokeStyle = cssColor(ncs.borderTopColor, 'transparent');
        ctx.lineWidth = nbw;
        roundRectPath(ctx, x + nbw / 2, y + nbw / 2, r.width - nbw, r.height - nbw, cornerRadii(ncs));
        ctx.stroke();
      }
    }

    drawFallbackText(ctx, bubbleEl, baseX, baseY);

    var data = null;
    try {
      data = ctx.getImageData(0, 0, SW, SH);
    } catch (e) {
      data = null;
    }
    return {
      canvas: canvas, data: data, W: W, H: H, SW: SW, SH: SH,
      dpr: dpr, mode: 'fallback'
    };
  }

  /* ======================================================================
     4. Particle model
     ====================================================================== */

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  // Coherent front wobble so the dissolve edge is not a perfect arc.
  function frontNoise(x, y) {
    return 0.55 * Math.sin(x * 0.085 + y * 0.045) +
      0.45 * Math.sin(x * 0.031 - y * 0.097 + 1.7);
  }
  function waveFor(d) {
    if (d < 0.30) return TIMING.waves[0];
    if (d < 0.64) return TIMING.waves[1];
    return TIMING.waves[2];
  }
  function luminance(r, g, b) {
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  // Released cells are re-packed into a sprite atlas with a feathered mask.
  // Without this, a 3px bitmap tile reads as a hard square when it rotates
  // and drifts; the mask turns each fragment into a soft crumb of material.
  function buildSpriteAtlas(cells, source, dpr, cellCss) {
    if (!cells.length) return null;
    var tile = Math.max(3, Math.ceil(cellCss * dpr) + 2); // 1 device px bleed each side
    var COLUMNS = 64;
    var rows = Math.ceil(cells.length / COLUMNS);
    var atlas = document.createElement('canvas');
    atlas.width = COLUMNS * tile;
    atlas.height = rows * tile;
    var actx = atlas.getContext('2d');
    if (!actx) return null;

    var mask = document.createElement('canvas');
    mask.width = tile;
    mask.height = tile;
    var mctx = mask.getContext('2d');
    if (!mctx) return null;
    if ('filter' in mctx) {
      try { mctx.filter = 'blur(' + Math.max(0.35, tile * 0.06).toFixed(2) + 'px)'; } catch (e) { /* ignore */ }
    }
    mctx.fillStyle = '#ffffff';
    roundRectPath(mctx, 0.5, 0.5, tile - 1, tile - 1, {
      tl: tile * 0.3, tr: tile * 0.3, br: tile * 0.3, bl: tile * 0.3
    });
    mctx.fill();

    // Compositing (destination-in) affects the whole canvas, so each feathered
    // tile is assembled in a scratch canvas before being copied into the atlas.
    var scratch = document.createElement('canvas');
    scratch.width = tile;
    scratch.height = tile;
    var sctx = scratch.getContext('2d');
    if (!sctx) return null;

    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      var x = (i % COLUMNS) * tile;
      var y = Math.floor(i / COLUMNS) * tile;
      sctx.globalCompositeOperation = 'source-over';
      sctx.clearRect(0, 0, tile, tile);
      sctx.drawImage(source, c.sx, c.sy, c.sw, c.sh, 1, 1, c.sw, c.sh);
      sctx.globalCompositeOperation = 'destination-in';
      sctx.drawImage(mask, 0, 0);
      sctx.globalCompositeOperation = 'source-over';
      actx.drawImage(scratch, x, y);
      c.spriteX = x;
      c.spriteY = y;
    }
    return { canvas: atlas, tile: tile };
  }

  function buildModel(cap) {
    var W = cap.W;
    var H = cap.H;
    var SW = cap.SW;
    var SH = cap.SH;
    var data = cap.data ? cap.data.data : null;
    if (!data) return { cells: [], dust: [], glint: null };

    var cell = CELL_SMALL;
    var cols = Math.max(1, Math.ceil(W / cell));
    var rows = Math.max(1, Math.ceil(H / cell));
    while (cols * rows > CELL_BUDGET && cell < CELL_MAX) {
      cell += 1;
      cols = Math.max(1, Math.ceil(W / cell));
      rows = Math.max(1, Math.ceil(H / cell));
    }

    var ratioX = SW / W;
    var ratioY = SH / H;
    // Diagonal projection in screen space: 0 at the top-right corner, 1 at the
    // bottom-left corner. A straight 45° front reads as "top-right → bottom-
    // left" on any bubble aspect ratio (a radial metric turns into a vertical
    // wipe on wide, short message bubbles).
    var diagNorm = (W + H) || 1;
    var rng = mulberry32(hashString(Math.round(W * 100) + 'x' + Math.round(H * 100) + 'x' + cols + 'x' + rows));

    var cells = [];
    var sumR = 0, sumG = 0, sumB = 0, sumN = 0;

    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var x = col * cell;
        var y = row * cell;
        var w = Math.min(cell, W - x);
        var h = Math.min(cell, H - y);
        if (w <= 0 || h <= 0) continue;

        var midX = x + w / 2;
        var midY = y + h / 2;
        var px = clamp(Math.round(midX * ratioX), 0, SW - 1);
        var py = clamp(Math.round(midY * ratioY), 0, SH - 1);
        var idx = (py * SW + px) * 4;
        var alpha = data[idx + 3];
        if (alpha < 12) continue; // transparent rounded corner

        var r = data[idx], g = data[idx + 1], b = data[idx + 2];
        if (alpha > 200) { sumR += r; sumG += g; sumB += b; sumN++; }

        var d = clamp01(((W - midX) + midY) / diagNorm);
        var wave = waveFor(d);
        var u = clamp01((d - wave.d0) / Math.max(0.001, wave.d1 - wave.d0));
        var delay = wave.start + u * (wave.end - wave.start) +
          (rng() * 2 - 1) * TIMING.jitter + frontNoise(midX, midY) * TIMING.noise;
        delay = clamp(delay, TIMING.minDelay, TIMING.maxDelay);

        var sx = clamp(Math.round(x * ratioX), 0, SW - 1);
        var sy = clamp(Math.round(y * ratioY), 0, SH - 1);
        var sw = clamp(Math.round(w * ratioX), 1, SW - sx);
        var sh = clamp(Math.round(h * ratioY), 1, SH - sy);

        cells.push({
          x: x, y: y, w: w, h: h,
          gi: row * cols + col,
          sx: sx, sy: sy, sw: sw, sh: sh,
          delay: delay,
          life: TIMING.lifeMin + rng() * (TIMING.lifeMax - TIMING.lifeMin),
          vx: -(45 + rng() * 145),
          vy: 40 + rng() * 110,
          // Small initial "pop" toward the bottom-left: the cloud visibly
          // leads the crumbling edge instead of sitting behind it.
          popX: 8 + rng() * 16,
          popY: 4 + rng() * 10,
          scaleStart: 0.8 + rng() * 0.2,
          scaleEnd: 0.22 + rng() * 0.18,
          rot0: (rng() * 2 - 1) * 3,
          spin: (rng() * 2 - 1) * 7,
          color: [r, g, b]
        });
      }
    }

    var avgLum = sumN ? luminance(sumR / sumN, sumG / sumN, sumB / sumN) : 1;
    var bgRgb = sumN ? [sumR / sumN, sumG / sumN, sumB / sumN] : [255, 255, 255];

    var sprite = null;
    try {
      sprite = buildSpriteAtlas(cells, cap.canvas, cap.dpr, cell);
    } catch (e) {
      sprite = null;
    }

    // --- fine dust: emitted by the wave front as its cells leave -------------
    var dust = [];
    var dustCount = clamp(Math.round((W * H) / 520), 60, 240);
    for (var k = 0; k < dustCount && cells.length; k++) {
      var host = cells[Math.floor(rng() * cells.length)];
      var dDelay = host.delay + 30 + rng() * 110;
      if (dDelay > TIMING.maxDelay + 40) dDelay = TIMING.maxDelay + rng() * 40;
      var dLife = 420 + rng() * 360;
      if (dDelay + dLife > TIMING.total - 16) {
        dLife = Math.max(140, TIMING.total - 16 - dDelay);
      }
      if (dLife < 140) continue;
      var lift = avgLum < 0.5 ? 0.34 : 0.06;
      var dr = Math.round(host.color[0] + (255 - host.color[0]) * lift);
      var dg = Math.round(host.color[1] + (255 - host.color[1]) * lift);
      var db = Math.round(host.color[2] + (255 - host.color[2]) * lift);
      dust.push({
        x: host.x + host.w / 2 + (rng() - 0.5) * host.w * 1.6,
        y: host.y + host.h / 2 + (rng() - 0.5) * host.h * 1.6,
        delay: dDelay,
        life: dLife,
        size: 0.8 + rng() * 1.2,
        vx: -(30 + rng() * 90),
        vy: 30 + rng() * 70,
        curl: 1.4 + rng() * 4.2,
        freq: 0.9 + rng() * 1.5,
        phase: rng() * Math.PI * 2,
        alpha: 0.3 + rng() * 0.34,
        color: 'rgb(' + dr + ',' + dg + ',' + db + ')'
      });
    }

    // --- signature glint: a barely-there 4-point star at the top-right ------
    // Only drawn when the surface is dark or saturated enough for white to
    // read; on a light grey bubble it would be invisible or muddy.
    var starR = clamp(Math.round(Math.min(W, H) * 0.09), 4, 8);
    var glint = {
      enabled: avgLum < 0.62 && W > 44 && H > 30,
      x: Math.max(16, W - 24),
      y: clamp(Math.round(H * 0.3), 14, 20),
      r: starR,
      bgLum: avgLum
    };

    return {
      cells: cells, dust: dust, glint: glint, cellSize: cell,
      avgLum: avgLum, bgRgb: bgRgb,
      W: W, H: H,
      gridCols: cols, gridRows: rows,
      released: new Uint8Array(cols * rows),
      atlas: sprite ? sprite.canvas : null,
      spriteTile: sprite ? sprite.tile : 0
    };
  }

  /* ======================================================================
     5. Host resolution + mount
     ====================================================================== */

  function viewportPads(rect) {
    return {
      top: Math.min(PAD.top, Math.max(0, rect.top)),
      left: Math.min(PAD.left, Math.max(0, rect.left)),
      right: Math.min(PAD.right, Math.max(0, window.innerWidth - rect.right)),
      bottom: Math.min(PAD.bottom, Math.max(0, window.innerHeight - rect.bottom))
    };
  }

  function resolveHost(bubbleEl, opts, rect, W, H) {
    var host = null;
    if (opts.host && opts.host.nodeType === 1) {
      host = opts.host;
    } else if (bubbleEl.closest) {
      host = bubbleEl.closest('[data-recall-host]');
    }

    var fixedInfo = {
      host: null,
      fixed: true,
      pads: viewportPads(rect),
      scrollHeight: 0,
      scrollWidth: 0,
      scrollTop: 0
    };

    if (!host || host === document.body || host === document.documentElement) return fixedInfo;
    if (!document.documentElement.contains(host)) return fixedInfo;

    var hostRect = host.getBoundingClientRect();
    var scrollLeft = host.scrollLeft || 0;
    var scrollTop = host.scrollTop || 0;
    var leftInContent = rect.left - hostRect.left - (host.clientLeft || 0) + scrollLeft;
    var topInContent = rect.top - hostRect.top - (host.clientTop || 0) + scrollTop;
    var contentW = host.scrollWidth;
    var contentH = host.scrollHeight;

    return {
      host: host,
      fixed: false,
      leftInContent: leftInContent,
      topInContent: topInContent,
      pads: {
        top: Math.min(PAD.top, Math.max(0, topInContent)),
        left: Math.min(PAD.left, Math.max(0, leftInContent)),
        right: Math.min(PAD.right, Math.max(0, contentW - (leftInContent + W))),
        bottom: Math.min(PAD.bottom, Math.max(0, contentH - (topInContent + H)))
      },
      scrollHeight: contentH,
      scrollWidth: contentW,
      scrollTop: scrollTop,
      prevHostPosition: host.style.position,
      wasStatic: window.getComputedStyle(host).position === 'static'
    };
  }

  /* ======================================================================
     6. Rendering
     ====================================================================== */

  function drawSparkle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x + r * 0.12, y - r * 0.12, x + r, y);
    ctx.quadraticCurveTo(x + r * 0.12, y + r * 0.12, x, y + r);
    ctx.quadraticCurveTo(x - r * 0.12, y + r * 0.12, x - r, y);
    ctx.quadraticCurveTo(x - r * 0.12, y - r * 0.12, x, y - r);
    ctx.closePath();
    ctx.fill();
  }

  function renderFrame(state, t) {
    var ctx = state.ctx;
    var canvas = state.canvas;
    var model = state.model;
    var src = state.source;
    var pads = state.pads;
    var dpr = state.dpr;
    var padL = pads.left;
    var padT = pads.top;
    var dxScale = state.driftScaleX;
    var dyScale = state.driftScaleY;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- intact body -------------------------------------------------------
    // Rather than blitting every cell, contiguous intact runs are drawn per
    // row. The released set still defines the ragged wave edge exactly, but
    // the intact body costs ~rows draw calls per frame instead of thousands.
    var cells = model.cells;
    var atlas = model.atlas;
    var spriteTile = model.spriteTile;
    var released = model.released;
    var gridCols = model.gridCols;
    var gridRows = model.gridRows;
    var cellCss = model.cellSize;
    var gridW = model.W;
    var gridH = model.H;
    var ratioX = src.width / gridW;
    var ratioY = src.height / gridH;
    var i, c;

    released.fill(0);
    for (i = 0; i < cells.length; i++) {
      c = cells[i];
      if (t >= c.delay) released[c.gi] = 1;
    }

    function drawRun(row, c0, c1) {
      var yCss = row * cellCss;
      var hCss = Math.min(cellCss, gridH - yCss);
      var xCss = c0 * cellCss;
      var wCss = Math.min((c1 + 1) * cellCss, gridW) - xCss;
      if (wCss <= 0 || hCss <= 0) return;
      var sx = Math.round(xCss * ratioX);
      var sy = Math.round(yCss * ratioY);
      var sw = Math.round(wCss * ratioX);
      var sh = Math.round(hCss * ratioY);
      if (sx + sw > src.width) sw = src.width - sx;
      if (sy + sh > src.height) sh = src.height - sy;
      if (sw <= 0 || sh <= 0) return;
      ctx.drawImage(src, sx, sy, sw, sh,
        Math.round((padL + xCss) * dpr), Math.round((padT + yCss) * dpr), sw, sh);
    }

    for (var row = 0; row < gridRows; row++) {
      var runStart = -1;
      for (var col = 0; col <= gridCols; col++) {
        // The sentinel column must count as "released" so the final intact run
        // of a row is closed and drawn.
        var isReleased = col >= gridCols || released[row * gridCols + col] === 1;
        if (!isReleased) {
          if (runStart < 0) runStart = col;
        } else if (runStart >= 0) {
          drawRun(row, runStart, col - 1);
          runStart = -1;
        }
      }
    }

    // --- dissolving cells ---------------------------------------------------
    for (i = 0; i < cells.length; i++) {
      c = cells[i];
      if (t < c.delay) continue;
      var p = (t - c.delay) / c.life;
      if (p >= 1) continue;
      var alpha = Math.pow(1 - p, 2.0);
      if (alpha < 0.02) continue;
      // Front-loaded travel easing: fragments visibly shoot away from the
      // wave front instead of hovering near the pixels they came from.
      var e = 1 - Math.pow(1 - p, 5);
      var travel = (c.life / 1000) * 0.95;
      var dx = c.vx * travel * e * dxScale;
      var dy = c.vy * travel * e * dyScale;
      // Never let a fragment leave the mounted canvas: clamp per axis.
      var maxDx = Math.max(0, padL - 6);
      var maxDy = Math.max(0, pads.bottom - 6);
      if (dx < -maxDx) dx = -maxDx;
      if (dy > maxDy) dy = maxDy;
      var popE = 1 - Math.pow(1 - p, 3);
      dx -= c.popX * popE;
      dy += c.popY * popE;
      if (dx < -maxDx) dx = -maxDx;
      if (dy > maxDy) dy = maxDy;
      // Shrink immediately on release: the leading edge crumbles into dust
      // instead of reading as a wipe made of square tiles.
      var scale = c.scaleStart * (1 - (1 - c.scaleEnd) * Math.pow(p, 0.5));
      var rot = (c.rot0 + c.spin * p) * (Math.PI / 180);
      var cos = Math.cos(rot) * scale;
      var sin = Math.sin(rot) * scale;
      var cx = padL + c.x + c.w / 2 + dx;
      var cy = padT + c.y + c.h / 2 + dy;
      ctx.globalAlpha = alpha;
      ctx.setTransform(dpr * cos, dpr * sin, -dpr * sin, dpr * cos, dpr * cx, dpr * cy);
      if (atlas) {
        var tileCss = spriteTile / dpr;
        ctx.drawImage(atlas, c.spriteX, c.spriteY, spriteTile, spriteTile,
          -tileCss / 2, -tileCss / 2, tileCss, tileCss);
      } else {
        ctx.drawImage(src, c.sx, c.sy, c.sw, c.sh, -c.w / 2, -c.h / 2, c.w, c.h);
      }
    }

    // --- dust ---------------------------------------------------------------
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var dust = model.dust;
    for (i = 0; i < dust.length; i++) {
      var d = dust[i];
      var dt = t - d.delay;
      if (dt <= 0 || dt >= d.life) continue;
      var dp = dt / d.life;
      var de = 1 - Math.pow(1 - dp, 4);
      var dTravel = (d.life / 1000) * 1.0;
      var swirlPhase = dp * Math.PI * 2 * d.freq + d.phase;
      var ddx = d.vx * dTravel * de * dxScale;
      var ddy = d.vy * dTravel * de * dyScale;
      var dMaxDx = Math.max(0, padL - 4);
      var dMaxDy = Math.max(0, pads.bottom - 4);
      if (ddx < -dMaxDx) ddx = -dMaxDx;
      if (ddy > dMaxDy) ddy = dMaxDy;
      var px = padL + d.x + ddx + Math.sin(swirlPhase) * d.curl * dp;
      var py = padT + d.y + ddy +
        Math.cos(swirlPhase * 1.13 + 0.7) * d.curl * 0.7 * dp;
      ctx.globalAlpha = d.alpha * Math.pow(Math.sin(Math.PI * dp), 0.7);
      ctx.fillStyle = d.color;
      var size = d.size * (1 - 0.32 * dp);
      ctx.fillRect(px, py, size, size);
    }

    // --- glint --------------------------------------------------------------
    var g = model.glint;
    if (g && g.enabled && t < TIMING.glint) {
      var u = clamp01(t / TIMING.glint);
      var env = Math.sin(Math.PI * u);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 0.4 * env;
      ctx.fillStyle = '#ffffff';
      drawSparkle(ctx, padL + g.x, padT + g.y, g.r * (0.6 + 0.55 * env));
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
  }

  /* ======================================================================
     7. Quiet fade (reduced motion)
     ====================================================================== */

  function startQuietFade(el, opts) {
    var DURATION = 200;
    var cancelled = false;
    var resolvePromise = null;
    var promise = new Promise(function (res) { resolvePromise = res; });
    var anim = null;
    var rafId = 0;

    function report(p) {
      if (typeof opts.onProgress === 'function') {
        try { opts.onProgress(clamp01(p)); } catch (e) { /* swallow */ }
      }
    }

    var wasHidden = window.getComputedStyle(el).visibility === 'hidden';
    if (wasHidden) el.style.visibility = 'visible';
    var start = now();

    function stop() {
      if (rafId) { caf(rafId); rafId = 0; }
      if (anim) { try { anim.cancel(); } catch (e) { /* ignore */ } anim = null; }
    }
    function finish() {
      if (cancelled) return;
      cancelled = true;
      stop();
      el.style.visibility = 'hidden';
      report(1);
      resolvePromise();
    }
    function tick(ts) {
      if (cancelled) return;
      var p = clamp01((ts - start) / DURATION);
      report(p);
      if (p >= 1) { finish(); return; }
      rafId = raf(tick);
    }

    report(0);
    if (typeof el.animate === 'function') {
      try {
        anim = el.animate(
          [{ opacity: '1' }, { opacity: '0' }],
          { duration: DURATION, easing: 'linear', fill: 'none' }
        );
      } catch (e) {
        anim = null;
      }
    } else {
      el.style.transition = 'opacity ' + DURATION + 'ms linear';
      el.style.opacity = '0';
    }
    rafId = raf(tick);

    return {
      promise: promise,
      cancel: function () {
        if (cancelled) return;
        cancelled = true;
        stop();
        resolvePromise();
      }
    };
  }

  /* ======================================================================
     8. Dissolve animation
     ====================================================================== */

  function startDissolve(el, opts) {
    var cancelled = false;
    var resolvePromise = null;
    var promise = new Promise(function (res) { resolvePromise = res; });
    var cleanup = null;

    function reportProgress(p) {
      if (typeof opts.onProgress === 'function') {
        try { opts.onProgress(clamp01(p)); } catch (e) { /* swallow */ }
      }
    }

    var speed = 1;
    if (typeof opts.speed === 'number' && isFinite(opts.speed) && opts.speed > 0) {
      speed = clamp(opts.speed, 0.05, 8);
    }
    var freezeAt = (typeof opts.freezeAt === 'number' && isFinite(opts.freezeAt))
      ? clamp(opts.freezeAt, 0, TIMING.total)
      : null;

    // Animation-scoped state (canvas, listeners, loop, host position…)
    var canvas = null;
    var ctx = null;
    var source = null;
    var model = null;
    var pads = null;
    var dpr = 1;
    var host = null;
    var hostWasStatic = false;
    var prevHostPosition = '';
    var rafId = 0;
    var timerId = 0;
    var listeners = [];
    var driftScaleX = 1;
    var driftScaleY = 1;

    // The live render state handed to renderFrame().
    var animState = {
      canvas: null, ctx: null, source: null, model: null, pads: null,
      dpr: 2, driftScaleX: 1, driftScaleY: 1
    };

    function addListener(target, type, handler, options) {
      target.addEventListener(type, handler, options || false);
      listeners.push([target, type, handler, options || false]);
    }
    function removeListeners() {
      for (var i = 0; i < listeners.length; i++) {
        var l = listeners[i];
        l[0].removeEventListener(l[1], l[2], l[3]);
      }
      listeners.length = 0;
      if (rafId) { caf(rafId); rafId = 0; }
      if (timerId) { window.clearTimeout(timerId); timerId = 0; }
    }
    function restoreHost() {
      if (host && hostWasStatic) {
        host.style.position = prevHostPosition;
        hostWasStatic = false;
      }
    }
    function removeCanvas() {
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      restoreHost();
    }
    function teardown(keepCanvas) {
      removeListeners();
      if (!keepCanvas) removeCanvas();
    }
    function finish() {
      if (cancelled) return;
      cancelled = true;
      teardown(false);
      reportProgress(1);
      resolvePromise();
    }

    cleanup = function () {
      cancelled = true;
      teardown(false);
    };

    function mountAt(padsToUse) {
      var hostInfo = resolvedHost;
      var fixed = hostInfo.fixed;
      var cw = Math.max(1, cap.W + padsToUse.left + padsToUse.right);
      var ch = Math.max(1, cap.H + padsToUse.top + padsToUse.bottom);
      var cv = document.createElement('canvas');
      cv.className = CANVAS_CLASS;
      cv.setAttribute('aria-hidden', 'true');
      cv.width = Math.max(1, Math.round(cw * dpr));
      cv.height = Math.max(1, Math.round(ch * dpr));
      cv.style.position = fixed ? 'fixed' : 'absolute';
      cv.style.left = '0px';
      cv.style.top = '0px';
      cv.style.width = cw + 'px';
      cv.style.height = ch + 'px';
      cv.style.pointerEvents = 'none';
      cv.style.zIndex = fixed ? '2147483000' : '9999';
      cv.style.contain = 'paint';

      var context = cv.getContext('2d');
      if (!context) throw new Error('no 2d context');

      if (fixed) {
        var leftPx = rect.left - padsToUse.left;
        var topPx = rect.top - padsToUse.top;
        cv.style.left = leftPx + 'px';
        cv.style.top = topPx + 'px';
        cv.dataset.myrqviaBaseLeft = String(leftPx);
        cv.dataset.myrqviaBaseTop = String(topPx);
        var baseScrollX = window.scrollX || 0;
        var baseScrollY = window.scrollY || 0;
        addListener(window, 'scroll', function () {
          if (!canvas) return;
          canvas.style.left = (leftPx - ((window.scrollX || 0) - baseScrollX)) + 'px';
          canvas.style.top = (topPx - ((window.scrollY || 0) - baseScrollY)) + 'px';
        }, { passive: true });
        (document.body || document.documentElement).appendChild(cv);
      } else {
        if (hostWasStatic === false && host && window.getComputedStyle(host).position === 'static') {
          prevHostPosition = host.style.position;
          host.style.position = 'relative';
          hostWasStatic = true;
        }
        cv.style.left = (hostInfo.leftInContent - padsToUse.left) + 'px';
        cv.style.top = (hostInfo.topInContent - padsToUse.top) + 'px';
        host.appendChild(cv);
      }
      return { canvas: cv, ctx: context };
    }

    var resolvedHost = null;
    var cap = null;
    var rect = null;
    var wasHidden = false;

    function startAsync() {
      try {
        wasHidden = window.getComputedStyle(el).visibility === 'hidden';
        if (wasHidden) el.style.visibility = 'visible';
        rect = el.getBoundingClientRect();
        var W = rect.width;
        var H = rect.height;
        if (!(W > 2 && H > 2)) {
          el.style.visibility = 'hidden';
          reportProgress(1);
          resolvePromise();
          return;
        }

        var captureStart = now();
        dpr = getDpr();
        captureForeignObject(el, rect).then(function (result) {
          finishCapture(result);
        }, function () {
          var result = null;
          try {
            result = captureFallback(el, rect);
          } catch (e) {
            result = null;
          }
          finishCapture(result);
        });

        function finishCapture(result) {
          if (cancelled) {
            if (wasHidden) el.style.visibility = 'hidden';
            return;
          }
          if (!result || !result.data) {
            // Nothing to animate — resolve quietly but keep the bubble hidden.
            el.style.visibility = 'hidden';
            reportProgress(1);
            resolvePromise();
            return;
          }
          cap = result;
          var captureMs = Math.round(now() - captureStart);
          try { model = buildModel(cap); } catch (e) { model = null; }
          if (!model || !model.cells.length) {
            el.style.visibility = 'hidden';
            reportProgress(1);
            resolvePromise();
            return;
          }

          try {
            resolvedHost = resolveHost(el, opts, rect, W, H);
            pads = {
              top: resolvedHost.pads.top,
              right: resolvedHost.pads.right,
              bottom: resolvedHost.pads.bottom,
              left: resolvedHost.pads.left
            };
            host = resolvedHost.host;

            var mounted = mountAt(pads);
            // Guarantee we never change the scroller's geometry.
            if (host) {
              var h0 = resolvedHost.scrollHeight;
              var w0 = resolvedHost.scrollWidth;
              if (host.scrollHeight !== h0 || host.scrollWidth !== w0) {
                removeCanvas();
                pads = { top: 0, right: 0, bottom: 0, left: 0 };
                mounted = mountAt(pads);
              }
              if (host.scrollHeight !== h0 || host.scrollWidth !== w0) {
                // Extremely defensive: leave the host entirely.
                removeCanvas();
                resolvedHost.fixed = true;
                resolvedHost.host = null;
                host = null;
                pads = viewportPads(rect);
                mounted = mountAt(pads);
              }
              if (host && host.scrollTop !== resolvedHost.scrollTop) {
                host.scrollTop = resolvedHost.scrollTop;
              }
            }

            canvas = mounted.canvas;
            ctx = mounted.ctx;
            source = cap.canvas;
            driftScaleX = pads.left <= 0 ? 0.05 : clamp(pads.left / DRIFT_X_ROOM, 0.2, 1);
            driftScaleY = pads.bottom <= 0 ? 0.05 : clamp(pads.bottom / DRIFT_Y_ROOM, 0.2, 1);
            animState.canvas = canvas;
            animState.ctx = ctx;
            animState.source = source;
            animState.model = model;
            animState.pads = pads;
            animState.dpr = dpr;
            animState.driftScaleX = driftScaleX;
            animState.driftScaleY = driftScaleY;

            // diagnostics for the lab / QA (invisible to the design)
            canvas.dataset.myrqviaCapture = cap.mode;
            canvas.dataset.myrqviaCaptureMs = String(captureMs);
            canvas.dataset.myrqviaHost = resolvedHost.fixed ? 'fixed' : 'host';
            canvas.dataset.myrqviaPads = [pads.top, pads.right, pads.bottom, pads.left].join(',');
            canvas.dataset.myrqviaCells = String(model.cells.length);
            canvas.dataset.myrqviaDust = String(model.dust.length);
            canvas.dataset.myrqviaGlint = model.glint && model.glint.enabled ? '1' : '0';
            if (host) {
              canvas.dataset.myrqviaScrollHeightDelta = String(host.scrollHeight - resolvedHost.scrollHeight);
              canvas.dataset.myrqviaScrollWidthDelta = String(host.scrollWidth - resolvedHost.scrollWidth);
              canvas.dataset.myrqviaScrollTopDelta = String(host.scrollTop - resolvedHost.scrollTop);
            }

            el.style.visibility = 'hidden';

            addListener(window, 'resize', function () { finish(); }, false);

            if (freezeAt !== null) {
              renderFrame(animState, freezeAt);
              reportProgress(freezeAt / TIMING.total);
              timerId = window.setTimeout(function () {
                if (cancelled) return;
                teardown(true);
                held.set(el, function () {
                  if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
                  restoreHost();
                });
                resolvePromise();
              }, TIMING.freezeResolveDelay);
              return;
            }

            var startTime = now();
            function tick(ts) {
              if (cancelled) return;
              var elapsed = (typeof ts === 'number' ? ts : now()) - startTime;
              if (elapsed < 0) elapsed = 0;
              var t = Math.min(TIMING.total, elapsed * speed);
              renderFrame(animState, t);
              reportProgress(t / TIMING.total);
              if (t >= TIMING.total) { finish(); return; }
              rafId = raf(tick);
            }
            rafId = raf(tick);
          } catch (e) {
            // Anything unexpected: hide the bubble, resolve, never leave a
            // half-mounted canvas behind.
            teardown(false);
            el.style.visibility = 'hidden';
            reportProgress(1);
            resolvePromise();
          }
        }
      } catch (e) {
        if (cancelled) return;
        cancelled = true;
        teardown(false);
        el.style.visibility = 'hidden';
        reportProgress(1);
        resolvePromise();
      }
    }

    var controller = {
      promise: promise,
      cancel: function () {
        if (cancelled) return;
        cancelled = true;
        cleanup();
        resolvePromise();
      }
    };

    startAsync();

    return controller;
  }

  /* ======================================================================
     9. Public API
     ====================================================================== */

  var active = new WeakMap();  // bubbleEl -> { promise, cancel }
  var held = new WeakMap();    // bubbleEl -> cleanup fn (held freeze frame)

  function cancelPrevious(el) {
    var ctl = active.get(el);
    if (ctl) {
      active.delete(el);
      ctl.cancel();
    }
    var heldCleanup = held.get(el);
    if (heldCleanup) {
      held.delete(el);
      heldCleanup();
    }
  }

  function play(bubbleEl, opts) {
    opts = opts || {};
    if (!bubbleEl || bubbleEl.nodeType !== 1) {
      return Promise.reject(new TypeError('MYRQVIA.recall.play expects a bubble element'));
    }
    cancelPrevious(bubbleEl);

    var reduce = opts.reduceMotion === true || prefersReducedMotion();
    var ctl = (reduce || !CANVAS_OK)
      ? startQuietFade(bubbleEl, opts)
      : startDissolve(bubbleEl, opts);

    active.set(bubbleEl, ctl);
    ctl.promise.then(function () {
      if (active.get(bubbleEl) === ctl) active.delete(bubbleEl);
    }, function () {
      if (active.get(bubbleEl) === ctl) active.delete(bubbleEl);
    });
    return ctl.promise;
  }

  MYRQVIA.recall = {
    play: play,
    supports: CANVAS_OK
  };
})();
