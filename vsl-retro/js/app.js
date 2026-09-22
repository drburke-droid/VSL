/* ==========================================================
   Visual Systems Lab — "Vision Lab Manager"
   A tiny window manager + CRT effects. No dependencies.
   Data (groups, tools, links) lives in js/tools.json.
   ========================================================== */
(() => {
  'use strict';

  const DESKTOP_SCALE = 0.934;         // must match --desktop-scale in css
  const WS = { w: 606, h: 383 };       // workspace size in desktop px
  const IDLE_MS = 45000;
  const BOOT_LINES = [
    'Starting VSL/OS 3.1...',
    '',
    'HIMEM is testing extended memory...done.',
    'C:\\>C:\\VSL\\RETINA.SYS /load',
    'MODE prepare visual cortex ... completed',
    'MODE select 20/20 ............ completed',
    '',
    'Loading 12 programs ......... OK',
    '640K OK',
    '',
    'C:\\>win'
  ];

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const stage = $('#stage');
  const workspace = $('#workspace');
  const tray = $('#tray');
  const tube = $('#tube');
  const desktop = $('#desktop');
  const boot = $('#boot');
  const saver = $('#saver');
  const led = $('#led');
  const offdot = $('#offdot');
  const menubar = $('#menubar');

  let stageScale = 1;
  let zTop = 10;
  let drag = null;
  let power = 'on';
  let idleTimer = null;
  let bootTimer = null;
  const home = {};                     // window id → original geometry

  /* ---------- stage scaling ---------- */
  function fit() {
    stageScale = Math.min(innerWidth / 1280, innerHeight / 720);
    stage.style.transform = `scale(${stageScale})`;
  }
  addEventListener('resize', fit);
  fit();

  /* ---------- build group windows from data ---------- */
  async function build() {
    const data = await fetch('js/tools.json').then(r => r.json());
    const byGroup = {};
    data.tools.forEach(t => (byGroup[t.group] ||= []).push(t));

    data.groups.forEach(g => {
      const win = document.createElement('div');
      win.className = 'bev win';
      win.dataset.win = g.id;
      win.style.cssText = `left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h}px`;
      win.innerHTML = `
        <div class="titlebar">
          <span><button class="bev sysbtn" data-wm="close" aria-label="Close">▬</button> ${g.title}</span>
          <span><button class="bev sysbtn" data-wm="min" aria-label="Minimize">▼</button><button class="bev sysbtn" data-wm="max" aria-label="Maximize">▲</button></span>
        </div>
        <div class="body icons">
          ${(byGroup[g.id] || []).map(t => `<a class="ico" href="${t.href}" title="${t.title}">${t.icon}<span>${t.label}</span></a>`).join('')}
        </div>
        <div class="grip" data-wm="resize" aria-hidden="true"></div>`;
      workspace.insertBefore(win, tray);
    });

    // remember home geometry for every window (groups + dialogs)
    $$('.win', workspace).forEach(w => {
      home[w.dataset.win] = { left: w.style.left, top: w.style.top, width: w.style.width, height: w.style.height };
      w.style.zIndex = ++zTop;
    });
    focus($('.win[data-win="readme"]'));

    // plain list for the phone fallback
    $('#fallback-list').innerHTML = data.tools.map(t => `<li><a href="${t.href}">${t.title}</a></li>`).join('');
  }

  /* ---------- window management ---------- */
  function focus(win) {
    $$('.win.active').forEach(w => w.classList.remove('active'));
    if (!win) return;
    win.classList.add('active');
    win.style.zIndex = ++zTop;
  }

  function minimize(win) {
    win.hidden = true;
    win.dataset.min = '1';
    const title = win.querySelector('.titlebar > span').textContent.trim().split(' ')[0].replace(/[^A-Z&.]/gi, '');
    const b = document.createElement('button');
    b.className = 'ico';
    b.dataset.restore = win.dataset.win;
    b.innerHTML = `<svg width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges"><rect width="32" height="32" fill="#c0c0c0"/><rect x="3" y="5" width="26" height="22" fill="#fff" stroke="#000" stroke-width="2"/><rect x="3" y="5" width="26" height="5" fill="#000080"/><rect x="7" y="14" width="8" height="8" fill="#008080"/><rect x="17" y="14" width="8" height="8" fill="#008080"/></svg><span>${title}</span>`;
    tray.appendChild(b);
  }

  function restore(id) {
    const win = $(`.win[data-win="${id}"]`);
    tray.querySelector(`[data-restore="${id}"]`)?.remove();
    win.hidden = false; delete win.dataset.min;
    focus(win);
  }

  function toggleMax(win) {
    if (win.dataset.max) {
      Object.assign(win.style, JSON.parse(win.dataset.max));
      delete win.dataset.max;
    } else {
      win.dataset.max = JSON.stringify({ left: win.style.left, top: win.style.top, width: win.style.width, height: win.style.height });
      Object.assign(win.style, { left: '0px', top: '0px', width: WS.w + 'px', height: WS.h + 'px' });
    }
    focus(win);
  }

  function close(win) {
    win.hidden = true;
    win.dataset.closed = '1';
    tray.querySelector(`[data-restore="${win.dataset.win}"]`)?.remove();
  }

  function open(win) {
    win.hidden = false; delete win.dataset.closed; delete win.dataset.min;
    tray.querySelector(`[data-restore="${win.dataset.win}"]`)?.remove();
    focus(win);
  }

  function arrange(mode) {
    const wins = $$('.win', workspace);
    if (mode === 'home') {
      wins.forEach(w => { if (!w.dataset.closed) { Object.assign(w.style, home[w.dataset.win]); delete w.dataset.max; if (w.dataset.min) restore(w.dataset.win); } });
      return;
    }
    if (mode === 'reopen') {
      wins.forEach(w => { if (w.dataset.win !== 'about') { Object.assign(w.style, home[w.dataset.win]); delete w.dataset.max; open(w); } });
      return;
    }
    const live = wins.filter(w => !w.hidden);
    if (mode === 'cascade') {
      live.forEach((w, i) => { Object.assign(w.style, { left: 8 + i * 22 + 'px', top: 8 + i * 20 + 'px', width: '300px', height: '190px' }); delete w.dataset.max; w.style.zIndex = ++zTop; });
    } else if (mode === 'tile') {
      const cols = Math.min(2, live.length), rows = Math.ceil(live.length / cols);
      const cw = Math.floor((WS.w - 12) / cols), ch = Math.floor((WS.h - 12) / rows);
      live.forEach((w, i) => { Object.assign(w.style, { left: 6 + (i % cols) * cw + 'px', top: 6 + Math.floor(i / cols) * ch + 'px', width: cw - 4 + 'px', height: ch - 4 + 'px' }); delete w.dataset.max; });
    }
  }

  // pointer: drag + resize (pointer events cover mouse, pen and touch)
  workspace.addEventListener('pointerdown', e => {
    const win = e.target.closest('.win');
    if (!win) return;
    focus(win);
    const wm = e.target.closest('[data-wm]');
    if (wm) return;                                        // buttons handle themselves on click
    const grip = e.target.closest('.grip');
    const bar = e.target.closest('.titlebar');
    if (!grip && !bar) return;
    if (e.target.closest('a, button')) return;
    e.preventDefault();
    drag = { win, mode: grip ? 'size' : 'move', sx: e.clientX, sy: e.clientY,
             ox: parseFloat(win.style.left), oy: parseFloat(win.style.top),
             ow: win.offsetWidth, oh: win.offsetHeight };
    workspace.setPointerCapture?.(e.pointerId);
  });

  addEventListener('pointermove', e => {
    if (!drag) return;
    const k = 1 / (stageScale * DESKTOP_SCALE);
    const dx = (e.clientX - drag.sx) * k, dy = (e.clientY - drag.sy) * k;
    const w = drag.win;
    if (drag.mode === 'move') {
      w.style.left = Math.round(Math.max(-drag.ow + 40, Math.min(WS.w - 40, drag.ox + dx))) + 'px';
      w.style.top = Math.round(Math.max(0, Math.min(WS.h - 18, drag.oy + dy))) + 'px';
    } else {
      w.style.width = Math.round(Math.max(120, drag.ow + dx)) + 'px';
      w.style.height = Math.round(Math.max(60, drag.oh + dy)) + 'px';
    }
    delete w.dataset.max;
  });
  addEventListener('pointerup', () => { drag = null; });
  addEventListener('pointercancel', () => { drag = null; });

  // window buttons + tray
  workspace.addEventListener('click', e => {
    const wm = e.target.closest('[data-wm]');
    if (wm) {
      const win = wm.closest('.win');
      ({ close, min: minimize, max: toggleMax })[wm.dataset.wm]?.(win);
      return;
    }
    const r = e.target.closest('[data-restore]');
    if (r) restore(r.dataset.restore);
  });
  // double-click titlebar = maximize (as in the original)
  workspace.addEventListener('dblclick', e => {
    const bar = e.target.closest('.titlebar');
    if (bar && !e.target.closest('button')) toggleMax(bar.closest('.win'));
  });

  /* ---------- menus ---------- */
  function closeMenus() {
    $$('.menu', menubar).forEach(m => (m.hidden = true));
    $$('button[data-menu]', menubar).forEach(b => b.classList.remove('open'));
  }
  menubar.addEventListener('click', e => {
    const top = e.target.closest('button[data-menu]');
    if (top) {
      const menu = $(`.menu[data-for="${top.dataset.menu}"]`, menubar);
      const wasOpen = !menu.hidden;
      closeMenus();
      if (!wasOpen) { menu.hidden = false; top.classList.add('open'); }
      return;
    }
    const act = e.target.closest('[data-action]');
    if (!act) return;
    closeMenus();
    const actions = {
      'power-off': () => setPower(false),
      cascade: () => arrange('cascade'),
      tile: () => arrange('tile'),
      home: () => arrange('home'),
      reopen: () => arrange('reopen'),
      degauss,
      saver: showSaver,
      scanlines: () => $('#scanlines').classList.toggle('hidden'),
      about: () => open($('.win[data-win="about"]'))
    };
    actions[act.dataset.action]?.();
  });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('#menubar')) closeMenus(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenus(); });

  /* ---------- power / boot ---------- */
  function setPower(on) {
    clearInterval(bootTimer);
    if (!on) {
      power = 'off';
      hideSaver();
      tube.classList.add('off');
      led.classList.remove('on');
      setTimeout(() => { if (power === 'off') offdot.hidden = false; }, 350);
      setTimeout(() => { offdot.hidden = true; }, 1500);
      $('#status').textContent = '';
      return;
    }
    power = 'boot';
    offdot.hidden = true;
    tube.classList.remove('off');
    led.classList.add('on');
    desktop.hidden = true; boot.hidden = false; boot.textContent = '';
    let n = 0;
    bootTimer = setInterval(() => {
      n++;
      boot.textContent = BOOT_LINES.slice(0, n).join('\n');
      if (n >= BOOT_LINES.length) {
        clearInterval(bootTimer);
        setTimeout(() => { boot.hidden = true; desktop.hidden = false; power = 'on'; $('#status').textContent = '12 PROGRAMS LOADED · 640K OK'; armIdle(); }, 400);
      }
    }, 260);
  }
  $('#power').addEventListener('click', () => setPower(power === 'off'));

  /* ---------- screensaver ---------- */
  function armIdle() { clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (power === 'on') showSaver(); }, IDLE_MS); }
  function showSaver() { saver.hidden = false; closeMenus(); }
  function hideSaver() { saver.hidden = true; armIdle(); }
  saver.addEventListener('pointerdown', e => { e.stopPropagation(); hideSaver(); });
  ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => { if (power === 'on' && saver.hidden) armIdle(); }));

  /* ---------- degauss ---------- */
  function degauss() {
    tube.classList.remove('degauss'); void tube.offsetWidth;   // restart animation
    tube.classList.add('degauss');
    setTimeout(() => tube.classList.remove('degauss'), 750);
  }

  /* ---------- keyboard easter eggs (global keys are fine here) ---------- */
  let typed = '';
  document.addEventListener('keydown', e => {
    if (e.altKey && /^[fwh]$/i.test(e.key)) {           // Alt-F / Alt-W / Alt-H open menus
      e.preventDefault();
      $(`button[data-menu="${{ f: 'file', w: 'window', h: 'help' }[e.key.toLowerCase()]}"]`, menubar).click();
      return;
    }
    typed = (typed + e.key).slice(-6);
    if (typed.endsWith('20/20')) $('#scanlines').classList.toggle('hidden');   // type 20/20 → toggle scanlines
    if (typed.endsWith('dgs')) degauss();                                      // d g s → degauss
  });

  build().then(armIdle);
})();
