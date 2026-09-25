/* ==========================================================
   Solitaire (Klondike, draw one). window.Solitaire.mount(el)
   builds the game inside el and returns a destroy() function.
   Click a card to pick it up, click where it should go; double-click
   sends a card to its foundation. Win: the cards bounce. No dependencies.
   ========================================================== */
(() => {
  'use strict';
  const SUITS = ['♠', '♥', '♦', '♣'], RED = new Set(['♥', '♦']);
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const CW = 50, CH = 70, GAP = 8, LEFT = 8, TOP = 8, ROW2 = TOP + CH + 14, DOWN = 5, UP = 15;

  function mount(root) {
    root.classList.add('sol');
    root.innerHTML = `
      <div class="sol-bar"><button class="bev btn" type="button" data-sol="new">New game</button><span class="sol-msg"></span></div>
      <div class="sol-board"></div>
      <canvas class="sol-win" hidden></canvas>`;
    const board = root.querySelector('.sol-board'), msg = root.querySelector('.sol-msg'), canvas = root.querySelector('.sol-win');
    let stock, waste, found, tab, sel, won, raf = 0;

    function deal() {
      cancelAnimationFrame(raf); canvas.hidden = true; won = false; sel = null; msg.textContent = '';
      const deck = [];
      for (const s of SUITS) for (let r = 0; r < 13; r++) deck.push({ s, r, up: false });
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [deck[i], deck[j]] = [deck[j], deck[i]]; }
      tab = [];
      for (let c = 0; c < 7; c++) { tab.push(deck.splice(0, c + 1)); tab[c][c].up = true; }
      stock = deck; waste = []; found = [[], [], [], []];
      render();
    }
    const colour = c => RED.has(c.s) ? 'red' : 'black';
    const label = c => RANKS[c.r] + c.s;

    function render() {
      board.innerHTML = '';
      const slot = (x, y, cls, extra) => { const d = document.createElement('div'); d.className = 'sol-slot ' + cls; d.style.left = x + 'px'; d.style.top = y + 'px'; Object.assign(d.dataset, extra || {}); board.appendChild(d); return d; };
      const card = (c, x, y, extra) => {
        const d = document.createElement('div');
        d.className = `card ${c.up ? colour(c) : 'back'}`; d.style.left = x + 'px'; d.style.top = y + 'px';
        if (c.up) d.innerHTML = `<span class="tl">${label(c)}</span><span class="pip">${c.s}</span><span class="br">${label(c)}</span>`;
        Object.assign(d.dataset, extra || {});
        if (sel && sel.from === extra.from && sel.i === +extra.i && (sel.from !== 'tab' || sel.col === +extra.col)) d.classList.add('sel');
        board.appendChild(d); return d;
      };
      // stock + waste
      slot(LEFT, TOP, 'stock', { from: 'stock' });
      if (stock.length) card(stock[stock.length - 1], LEFT, TOP, { from: 'stock' });
      slot(LEFT + CW + GAP, TOP, '', { from: 'wasteslot' });
      if (waste.length) card(waste[waste.length - 1], LEFT + CW + GAP, TOP, { from: 'waste', i: waste.length - 1 });
      // foundations
      found.forEach((f, k) => {
        const x = LEFT + (3 + k) * (CW + GAP);
        slot(x, TOP, 'found', { from: 'found', col: k }).textContent = SUITS[k];
        if (f.length) card(f[f.length - 1], x, TOP, { from: 'found', col: k, i: f.length - 1 });
      });
      // tableau
      tab.forEach((col, k) => {
        const x = LEFT + k * (CW + GAP); let y = ROW2;
        slot(x, y, 'tabslot', { from: 'tab', col: k, i: -1 });
        col.forEach((c, i) => { card(c, x, y, { from: 'tab', col: k, i }); y += c.up ? UP : DOWN; });
      });
      board.style.height = Math.max(ROW2 + CH + 19 * UP, board.clientHeight) + 'px';
    }

    const topOf = a => a[a.length - 1];
    function canFound(c, k) { return c.s === SUITS[k] && c.r === found[k].length; }
    function canTab(c, k) { const t = topOf(tab[k]); return t ? (t.up && colour(t) !== colour(c) && t.r === c.r + 1) : c.r === 12; }
    function take(src) {                      // returns the cards being moved (not yet removed)
      if (src.from === 'waste') return [topOf(waste)];
      if (src.from === 'found') return [topOf(found[src.col])];
      return tab[src.col].slice(src.i);
    }
    function remove(src) {
      if (src.from === 'waste') return waste.pop();
      if (src.from === 'found') return found[src.col].pop();
      const out = tab[src.col].splice(src.i); const t = topOf(tab[src.col]); if (t) t.up = true; return out;
    }
    function moveTo(src, dst) {
      const cards = take(src); if (!cards.length || !cards[0]) return false;
      if (dst.from === 'found') {
        if (cards.length !== 1 || !canFound(cards[0], dst.col)) return false;
        remove(src); found[dst.col].push(cards[0]);
      } else if (dst.from === 'tab') {
        if (!canTab(cards[0], dst.col)) return false;
        remove(src); tab[dst.col].push(...cards);
      } else return false;
      return true;
    }
    function autoFound(src) {
      const cards = take(src); if (cards.length !== 1) return false;
      for (let k = 0; k < 4; k++) if (canFound(cards[0], k)) { remove(src); found[k].push(cards[0]); return true; }
      return false;
    }
    function after() {
      sel = null; render();
      if (found.every(f => f.length === 13)) win();
    }

    board.addEventListener('click', e => {
      if (won) return;
      const el = e.target.closest('[data-from]'); if (!el) return;
      const d = { from: el.dataset.from, col: +el.dataset.col, i: +el.dataset.i };
      if (d.from === 'stock') {                              // flip one, or recycle the waste
        if (stock.length) waste.push(Object.assign(stock.pop(), { up: true }));
        else { stock = waste.reverse().map(c => Object.assign(c, { up: false })); waste = []; }
        sel = null; render(); return;
      }
      if (d.from === 'wasteslot') { sel = null; render(); return; }
      if (d.from === 'tab' && d.i >= 0 && !tab[d.col][d.i].up) { sel = null; render(); return; }   // face-down: nothing
      if (!sel) {
        if (d.from === 'tab' && d.i < 0) return;
        if (d.from === 'waste' && !waste.length) return;
        sel = d; render(); return;
      }
      if (sel.from === d.from && sel.col === d.col && sel.i === d.i) { sel = null; render(); return; }
      const dst = d.from === 'tab' ? { from: 'tab', col: d.col } : d.from === 'found' ? { from: 'found', col: d.col } : null;
      if (dst && moveTo(sel, dst)) after(); else { sel = (d.from === 'waste' || d.from === 'tab' || d.from === 'found') ? d : null; render(); }
    });
    board.addEventListener('dblclick', e => {
      if (won) return;
      const el = e.target.closest('.card[data-from]'); if (!el || el.dataset.from === 'stock') return;
      const d = { from: el.dataset.from, col: +el.dataset.col, i: +el.dataset.i };
      if (d.from === 'tab' && d.i !== tab[d.col].length - 1) return;
      if (autoFound(d)) after();
    });
    root.querySelector('[data-sol="new"]').addEventListener('click', deal);

    function win() {                          // the cascade
      won = true; msg.textContent = 'You win!';
      canvas.hidden = false; canvas.width = board.clientWidth; canvas.height = board.clientHeight;
      const ctx = canvas.getContext('2d');
      const queue = [];
      for (let r = 12; r >= 0; r--) for (let k = 0; k < 4; k++) queue.push({ c: { s: SUITS[k], r, up: true }, x: LEFT + (3 + k) * (CW + GAP), y: TOP });
      let cur = null;
      const drawCard = (c, x, y) => {
        ctx.fillStyle = '#fff'; ctx.fillRect(x, y, CW, CH); ctx.strokeStyle = '#333'; ctx.strokeRect(x + .5, y + .5, CW - 1, CH - 1);
        ctx.fillStyle = RED.has(c.s) ? '#c00' : '#000'; ctx.font = 'bold 11px Tahoma, sans-serif'; ctx.fillText(label(c), x + 4, y + 13);
        ctx.font = '22px sans-serif'; ctx.fillText(c.s, x + 17, y + 46);
      };
      const step = () => {
        if (!cur) { if (!queue.length) return; cur = queue.shift(); cur.vx = (Math.random() * 4 + 2) * (Math.random() < .5 ? -1 : 1); cur.vy = -Math.random() * 3; }
        cur.x += cur.vx; cur.y += cur.vy; cur.vy += .5;
        if (cur.y + CH > canvas.height) { cur.y = canvas.height - CH; cur.vy *= -.75; }
        drawCard(cur.c, cur.x, cur.y);
        if (cur.x < -CW || cur.x > canvas.width) cur = null;
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }

    deal();
    return () => cancelAnimationFrame(raf);
  }
  window.Solitaire = { mount };
})();
