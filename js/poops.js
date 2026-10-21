/* Franja de cacas en el escritorio (ventana aparte, estática: no consume nada mientras no cambie). */
(function () {
  const B = window.poopStrip; if (!B) return;
  const s = document.getElementById('s');
  const svg = window.N.art.poopSVG().replace(/ class="stink"/, ' class="stink" style="opacity:.8"');
  B.onPoops((list) => {
    s.innerHTML = list.map((q) => `<button type="button" data-id="${q.id}" title="Limpiar" style="left:${(4 + q.x * 92).toFixed(1)}%">${svg}</button>`).join('');
  });
  // (qué partes se pueden tocar lo calcula el proceso principal: acá no se escucha el mouse)
  s.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { B.clean(b.dataset.id); b.remove(); } });
})();
