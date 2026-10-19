/* Franja de cacas en el escritorio (ventana aparte, estática: no consume nada mientras no cambie). */
(function () {
  const B = window.poopStrip; if (!B) return;
  const s = document.getElementById('s');
  const svg = window.N.art.poopSVG().replace(/ class="stink"/, ' class="stink" style="opacity:.8"');
  let ignoring = true;
  B.onPoops((list) => {
    s.innerHTML = list.map((q) => `<button type="button" data-id="${q.id}" title="Limpiar" style="left:${(4 + q.x * 92).toFixed(1)}%">${svg}</button>`).join('');
  });
  document.addEventListener('mousemove', (e) => {
    const over = !!(document.elementFromPoint(e.clientX, e.clientY) || {}).closest?.('button');
    if (over === !ignoring) return;
    ignoring = !over; B.setIgnore(ignoring);
  });
  document.addEventListener('mouseleave', () => { if (!ignoring) { ignoring = true; B.setIgnore(true); } });
  s.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { B.clean(b.dataset.id); b.remove(); } });
})();
