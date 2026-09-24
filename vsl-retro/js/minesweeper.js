/* ==========================================================
   Minesweeper — 9×9, 10 mines, classic rules.
   window.Minesweeper.mount(el) builds the game inside el and
   returns a destroy() function. No dependencies.
   ========================================================== */
(() => {
  'use strict';
  const W = 9, H = 9, MINES = 10;
  const FACE = {
    ok:   '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="1" width="10" height="14" fill="#ff0"/><rect x="1" y="3" width="14" height="10" fill="#ff0"/><rect x="5" y="5" width="2" height="2"/><rect x="9" y="5" width="2" height="2"/><rect x="4" y="9" width="1" height="1"/><rect x="5" y="10" width="6" height="1"/><rect x="11" y="9" width="1" height="1"/></svg>',
    dead: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="1" width="10" height="14" fill="#ff0"/><rect x="1" y="3" width="14" height="10" fill="#ff0"/><path d="M4 4h1v1h1v1h1v1h-1v1h-1v1h-1v-1h1v-1h1v-1h-1v-1h-1zM9 4h1v1h1v1h1v1h-1v1h-1v1h-1v-1h1v-1h1v-1h-1v-1h-1z"/><rect x="5" y="11" width="6" height="1"/><rect x="4" y="12" width="1" height="1"/><rect x="11" y="12" width="1" height="1"/></svg>',
    cool: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="1" width="10" height="14" fill="#ff0"/><rect x="1" y="3" width="14" height="10" fill="#ff0"/><rect x="3" y="5" width="4" height="3"/><rect x="9" y="5" width="4" height="3"/><rect x="7" y="5" width="2" height="1"/><rect x="4" y="10" width="1" height="1"/><rect x="5" y="11" width="6" height="1"/><rect x="11" y="10" width="1" height="1"/></svg>',
    oh:   '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="1" width="10" height="14" fill="#ff0"/><rect x="1" y="3" width="14" height="10" fill="#ff0"/><rect x="5" y="5" width="2" height="2"/><rect x="9" y="5" width="2" height="2"/><rect x="6" y="9" width="4" height="3" fill="none" stroke="#000"/></svg>'
  };
  const MINE = '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="7" y="2" width="2" height="12"/><rect x="2" y="7" width="12" height="2"/><rect x="4" y="4" width="8" height="8"/><rect x="3" y="3" width="1" height="1"/><rect x="12" y="3" width="1" height="1"/><rect x="3" y="12" width="1" height="1"/><rect x="12" y="12" width="1" height="1"/><rect x="5" y="5" width="2" height="2" fill="#fff"/></svg>';
  const FLAG = '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="8" y="3" width="1" height="9"/><rect x="4" y="3" width="4" height="4" fill="#f00"/><rect x="6" y="7" width="2" height="1" fill="#f00"/><rect x="5" y="11" width="6" height="1"/><rect x="4" y="12" width="8" height="1"/></svg>';

  function mount(root) {
    root.classList.add('ms');
    root.innerHTML = `
      <div class="ms-top bev-in">
        <span class="ms-led" id="ms-mines">010</span>
        <button class="ms-face" type="button" aria-label="New game">${FACE.ok}</button>
        <span class="ms-led" id="ms-time">000</span>
      </div>
      <div class="ms-grid bev-in" role="grid" aria-label="Minefield"></div>`;
    const grid = root.querySelector('.ms-grid');
    const face = root.querySelector('.ms-face');
    const ledM = root.querySelector('#ms-mines');
    const ledT = root.querySelector('#ms-time');
    let cells, mines, revealed, flagged, over, started, timer, t0, count;

    const pad = n => String(Math.max(-99, Math.min(999, n))).padStart(3, '0');
    const idx = (x, y) => y * W + x;
    const around = (x, y) => {
      const out = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H) out.push([nx, ny]);
      }
      return out;
    };

    function reset() {
      clearInterval(timer);
      mines = new Set(); revealed = new Set(); flagged = new Set();
      over = false; started = false; count = 0;
      ledM.textContent = pad(MINES); ledT.textContent = '000';
      face.innerHTML = FACE.ok;
      grid.innerHTML = '';
      cells = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'ms-cell'; b.dataset.x = x; b.dataset.y = y;
        b.setAttribute('aria-label', `Row ${y + 1}, column ${x + 1}`);
        grid.appendChild(b); cells.push(b);
      }
    }
    function place(sx, sy) {           // mines go down after the first click, never under or beside it
      const safe = new Set([idx(sx, sy), ...around(sx, sy).map(([x, y]) => idx(x, y))]);
      while (mines.size < MINES) {
        const i = Math.random() * W * H | 0;
        if (!safe.has(i)) mines.add(i);
      }
      started = true; t0 = Date.now();
      timer = setInterval(() => { ledT.textContent = pad(Math.floor((Date.now() - t0) / 1000)); }, 250);
    }
    function reveal(x, y) {
      const i = idx(x, y);
      if (revealed.has(i) || flagged.has(i)) return;
      revealed.add(i);
      const c = cells[i]; c.classList.add('open');
      const n = around(x, y).filter(([ax, ay]) => mines.has(idx(ax, ay))).length;
      if (n) { c.textContent = n; c.dataset.n = n; }
      else around(x, y).forEach(([ax, ay]) => reveal(ax, ay));
    }
    function lose(hit) {
      over = true; clearInterval(timer); face.innerHTML = FACE.dead;
      mines.forEach(i => { if (!flagged.has(i)) { cells[i].classList.add('open'); cells[i].innerHTML = MINE; } });
      flagged.forEach(i => { if (!mines.has(i)) { cells[i].classList.add('open', 'wrong'); cells[i].innerHTML = MINE; } });
      cells[hit].classList.add('hit');
    }
    function checkWin() {
      if (revealed.size === W * H - MINES) {
        over = true; clearInterval(timer); face.innerHTML = FACE.cool;
        mines.forEach(i => { flagged.add(i); cells[i].innerHTML = FLAG; });
        ledM.textContent = '000';
      }
    }

    grid.addEventListener('click', e => {
      const c = e.target.closest('.ms-cell'); if (!c || over) return;
      const x = +c.dataset.x, y = +c.dataset.y, i = idx(x, y);
      if (flagged.has(i)) return;
      if (!started) place(x, y);
      if (mines.has(i)) { lose(i); return; }
      reveal(x, y); checkWin();
    });
    grid.addEventListener('contextmenu', e => {
      e.preventDefault(); e.stopPropagation();
      const c = e.target.closest('.ms-cell'); if (!c || over) return;
      const i = idx(+c.dataset.x, +c.dataset.y);
      if (revealed.has(i)) return;
      if (flagged.delete(i)) c.innerHTML = ''; else { flagged.add(i); c.innerHTML = FLAG; }
      ledM.textContent = pad(MINES - flagged.size);
    });
    grid.addEventListener('pointerdown', e => { if (!over && e.button === 0 && e.target.closest('.ms-cell')) face.innerHTML = FACE.oh; });
    addEventListener('pointerup', () => { if (!over) face.innerHTML = FACE.ok; });
    face.addEventListener('click', reset);

    reset();
    return () => clearInterval(timer);
  }
  window.Minesweeper = { mount, W, H };
})();
