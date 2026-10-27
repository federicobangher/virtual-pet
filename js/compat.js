/* Virtual Pet — compatibilidad con equipos viejos (2.0.3). Escrito en JavaScript "viejo" (ES5) a propósito:
   tiene que poder correr en cualquier navegador, aunque el resto del juego no arranque.
   - Tablets y celulares con el navegador (o el "Android System WebView") sin actualizar desde 2020 o antes, y
     iPads viejos: no entienden "aspect-ratio" de CSS (la mascota quedaba con alto 0: invisible) ni
     replaceChildren(). Acá se completa lo que falta.
   - Si con todo eso el juego igual no arranca (navegador demasiado viejo), en vez de una pantalla vacía se
     explica qué actualizar. */
(function () {
  'use strict';
  var EP = window.Element && Element.prototype;
  if (EP && !EP.replaceChildren) {
    EP.replaceChildren = function () {
      while (this.firstChild) this.removeChild(this.firstChild);
      for (var i = 0; i < arguments.length; i++) {
        var n = arguments[i];
        this.appendChild(typeof n === 'string' ? document.createTextNode(n) : n);
      }
    };
  }
  if (!String.prototype.padStart) {
    String.prototype.padStart = function (n, f) {
      var s = String(this); f = f == null ? ' ' : String(f);
      while (s.length < n) s = f + s;
      return s.length > n && f.length > 1 ? s.slice(s.length - n) : s;
    };
  }

  /* ---------- aspect-ratio (Chrome < 88, Safari < 15) ----------
     Se leen las hojas de estilo, se buscan las reglas con aspect-ratio y se calcula el alto (o el ancho, si la
     regla fija el alto) con JavaScript, cada vez que cambia algo. Sólo corre en los navegadores que lo necesitan. */
  var supports = function (p, v) { try { return !!(window.CSS && CSS.supports && CSS.supports(p, v)); } catch (e) { return false; } };
  if (!supports('aspect-ratio', '1 / 1') && document.querySelectorAll) {
    var rules = [];
    var condOk = function (c) {
      if (/^@media/i.test(c)) { try { return window.matchMedia(c.replace(/^@media/i, '').trim()).matches; } catch (e) { return false; } }
      if (/^@supports/i.test(c)) { try { return !!(window.CSS && CSS.supports && CSS.supports(c.replace(/^@supports/i, '').trim())); } catch (e) { return false; } }
      return false;
    };
    var parse = function (text) {
      text = text.replace(/\/\*[\s\S]*?\*\//g, '');
      var stack = [], start = 0;
      for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);
        if (ch === '{') { stack.push(text.slice(start, i).trim()); start = i + 1; }
        else if (ch === '}') {
          var sel = stack.pop(), body = text.slice(start, i);
          start = i + 1;
          if (!sel || sel.charAt(0) === '@') continue;
          var m = /(?:^|[;\s])aspect-ratio\s*:\s*([^;!]+)/.exec(body);
          if (!m) continue;
          var v = m[1].trim(), ratio = null;
          if (v !== 'auto') {
            var p = v.split('/');
            var a = parseFloat(p[0]), b = p.length > 1 ? parseFloat(p[1]) : 1;
            if (!(a > 0 && b > 0)) continue;
            ratio = a / b;
          }
          var parts = sel.split(',');
          for (var k = 0; k < parts.length; k++) {
            var s = parts[k].trim();
            if (!s || /::|:(before|after)\b/.test(s)) continue; // (los pseudo-elementos no se pueden tocar desde acá)
            rules.push({ sel: s, ratio: ratio, byH: /(?:^|[;\s])height\s*:(?!\s*auto)/.test(body), conds: stack.slice() });
          }
        }
      }
    };
    var setPx = function (el, k, v) { v = Math.round(v * 10) / 10 + 'px'; if (el.style[k] !== v) el.style[k] = v; };
    var ro = window.ResizeObserver ? new ResizeObserver(function () { queue(); }) : null;
    var watched = [];
    var apply = function () {
      queued = false;
      var map = [], idx = [];
      for (var r = 0; r < rules.length; r++) {
        var R = rules[r], ok = true;
        for (var c = 0; c < R.conds.length; c++) if (!condOk(R.conds[c])) { ok = false; break; }
        if (!ok) continue;
        var els;
        try { els = document.querySelectorAll(R.sel); } catch (e) { continue; }
        for (var j = 0; j < els.length; j++) {
          var at = idx.indexOf(els[j]);
          if (at < 0) { idx.push(els[j]); map.push(R); } else map[at] = R; // (gana la última regla, como en CSS)
        }
      }
      for (var n = 0; n < idx.length; n++) {
        var el = idx[n], rule = map[n];
        if (rule.ratio == null) { if (el.__ar) { el.style[el.__ar] = ''; el.__ar = null; } continue; }
        if (ro && watched.indexOf(el) < 0) { watched.push(el); ro.observe(el); }
        if (rule.byH) { el.__ar = 'width'; var h = el.getBoundingClientRect().height; if (h > 0) setPx(el, 'width', h * rule.ratio); }
        else { el.__ar = 'height'; var w = el.getBoundingClientRect().width; if (w > 0) setPx(el, 'height', w / rule.ratio); }
      }
      watched = watched.filter(function (e) { if (e.isConnected === false || !document.documentElement.contains(e)) { if (ro) ro.unobserve(e); return false; } return true; });
    };
    var queued = false;
    var queue = function () { if (queued) return; queued = true; (window.requestAnimationFrame || setTimeout)(apply); };
    var load = function () {
      var links = document.querySelectorAll('link[rel="stylesheet"]'), left = links.length;
      var done = function () { if (--left <= 0) { queue(); } };
      for (var i = 0; i < links.length; i++) {
        (function (href) {
          var x = new XMLHttpRequest();
          x.open('GET', href, true);
          x.onload = function () { try { parse(x.responseText || ''); } catch (e) { /* nada */ } done(); };
          x.onerror = done;
          try { x.send(); } catch (e) { done(); }
        })(links[i].href);
      }
      if (window.MutationObserver) new MutationObserver(queue).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
      window.addEventListener('resize', queue);
      if (!ro) setInterval(queue, 1000); // (sin ResizeObserver: se revisa una vez por segundo)
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
  }

  /* ---------- si el juego no arranca: explicar qué hacer ---------- */
  var started = function () {
    var b = document.body;
    return !!(b && (/\bmode-(room|desktop)\b/.test(b.className)));
  };
  var tries = 0;
  var check = function () {
    if (started()) return;
    if (document.hidden && tries++ < 20) { setTimeout(check, 3000); return; }
    var app = document.getElementById('app');
    if (!app) return;
    var android = /Android/i.test(navigator.userAgent || ''), apple = /iPad|iPhone|iPod|Macintosh/i.test(navigator.userAgent || '');
    var tip = android ? 'Abrí Play Store, buscá <b>Android System WebView</b> y <b>Chrome</b> y tocá <b>Actualizar</b>. Después volvé a abrir el juego.'
      : apple ? 'Actualizá el iPad o iPhone (Configuración → General → Actualización de software). Si ya no recibe actualizaciones, probá en otro equipo.'
      : 'Actualizá el navegador (Chrome, Edge o Firefox) y volvé a abrir el juego.';
    app.innerHTML = '<div style="position:fixed;top:0;right:0;bottom:0;left:0;display:flex;align-items:center;justify-content:center;padding:24px;background:#2a1f3d;color:#fff;font:16px/1.4 sans-serif;text-align:center">' +
      '<div style="max-width:420px"><p style="font-size:22px;font-weight:bold;margin:0 0 12px">Virtual Pet no pudo arrancar</p>' +
      '<p style="margin:0 0 12px">Este equipo tiene un navegador demasiado viejo para el juego.</p><p style="margin:0 0 20px">' + tip + '</p>' +
      '<button type="button" id="vpet-retry" style="font:inherit;font-weight:bold;padding:10px 22px;border-radius:14px;border:3px solid #fff;background:#ffc93c;color:#2a1f3d">Probar de nuevo</button></div></div>';
    var b = document.getElementById('vpet-retry');
    if (b) b.onclick = function () { location.reload(); };
  };
  setTimeout(check, 7000);
})();
