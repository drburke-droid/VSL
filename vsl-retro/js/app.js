/* ==========================================================
   Visual Systems Lab — "Vision Lab Manager"
   A tiny window manager + CRT effects. No dependencies.
   Data (groups, tools, links) lives in js/tools.json.
   ========================================================== */
(() => {
  'use strict';

  const DESKTOP_SCALE = 0.9318;        // must match --desktop-scale in css
  const WS = { w: 645, h: 425 };       // desktop size above the taskbar, in desktop px
  const DATA_URL = document.body.dataset.tools || 'js/tools.json';        // which programs to load
  const IDLE_MS = document.body.dataset.idle !== undefined ? Number(document.body.dataset.idle) : 45000;   // 0 = no screensaver
  let programCount = 0;
  const statusText = () => `${programCount} PROGRAMS LOADED · 640K OK`;
  const bootLines = () => {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    const day = d.toLocaleDateString('en-US', { weekday: 'short' });
    return [
    'Starting VSL/OS 3.1...',
    '',
    'HIMEM is testing extended memory...done.',
    `Current date is ${day} ${p(d.getMonth() + 1)}-${p(d.getDate())}-${d.getFullYear()}`,
    `Current time is ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(Math.floor(d.getMilliseconds() / 10))}`,
    'C:\\>C:\\VSL\\RETINA.SYS /load',
    'MODE prepare visual cortex ... completed',
    'MODE select 20/20 ............ completed',
    '',
    `Loading ${programCount} programs ......... OK`,
    '640K OK',
    '',
    'C:\\>win'
  ]; };

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
  const palm = $('#palm');

  let stageScale = 1;
  let zTop = 10;
  let drag = null;
  let power = 'on';
  let idleTimer = null;
  let bootTimer = null;
  const home = {};                     // window id → original geometry
  const tools = {};                    // tool id → tools.json entry
  const FOLDER16 = '<svg class="ti" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true"><rect x="3" y="8" width="12" height="4" fill="#ffff00" stroke="#000" stroke-width="2"/><rect x="3" y="11" width="26" height="16" fill="#ffff00" stroke="#000" stroke-width="2"/></svg>';
  const EYE_ICON = '<svg class="ti" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="12" width="28" height="8" fill="#000"/><rect x="4" y="10" width="24" height="12" fill="#fff"/><rect x="11" y="12" width="10" height="8" fill="#008080"/><rect x="14" y="14" width="4" height="4" fill="#000"/></svg>';
  const MINE_ICON = '<svg class="ti" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true"><rect width="32" height="32" fill="#c0c0c0"/><rect x="14" y="4" width="4" height="24" fill="#000"/><rect x="4" y="14" width="24" height="4" fill="#000"/><rect x="8" y="8" width="16" height="16" fill="#000"/><rect x="6" y="6" width="2" height="2" fill="#000"/><rect x="24" y="6" width="2" height="2" fill="#000"/><rect x="6" y="24" width="2" height="2" fill="#000"/><rect x="24" y="24" width="2" height="2" fill="#000"/><rect x="10" y="10" width="4" height="4" fill="#fff"/></svg>';
  const WIN_ICON = '<svg class="ti" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true"><rect x="3" y="5" width="26" height="22" fill="#fff" stroke="#000" stroke-width="2"/><rect x="3" y="5" width="26" height="6" fill="#000080"/></svg>';
  const CARD_ICON = '<svg class="ti" viewBox="0 0 32 32" aria-hidden="true"><rect x="9" y="3" width="16" height="22" rx="2" fill="#1a4a7a" stroke="#000"/><rect x="5" y="8" width="16" height="22" rx="2" fill="#fff" stroke="#000"/><text x="8" y="17" font-family="Arial" font-weight="bold" font-size="9" fill="#c00">A</text><text x="10" y="27" font-size="11" fill="#c00">♥</text></svg>';
  const POWER_ICON = '<svg class="ti" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true"><rect x="6" y="6" width="20" height="18" fill="#000080"/><rect x="8" y="8" width="16" height="14" fill="#00ffff"/><rect x="10" y="24" width="12" height="2" fill="#000"/><rect x="6" y="26" width="20" height="2" fill="#808080"/></svg>';
  const esc = str => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  /* ---------- stage scaling ---------- */
  function fit() {
    stageScale = Math.min(innerWidth / 738, innerHeight / 720);
    stage.style.transform = `scale(${stageScale})`;
    palm.style.transform = `scale(${Math.min(innerWidth / 328, innerHeight / 613)})`;     // phone: the handheld
  }
  addEventListener('resize', fit);
  fit();

  /* ---------- build group windows from data ---------- */
  async function build() {
    const data = await fetch(DATA_URL).then(r => r.json());
    programCount = data.tools.length;
    $('#status').textContent = statusText();
    $('.palm-status span').textContent = statusText();
    const byGroup = {};
    data.tools.forEach(t => { (byGroup[t.group] ||= []).push(t); tools[t.id] = t; });

    // desktop icons, grouped in the JSON's order, in columns down the left
    $('#desk').innerHTML = data.groups.map(g => (byGroup[g.id] || []).map(t =>
      `<a class="ico" href="${t.href}" title="${esc(t.title)}" data-tool="${t.id}">${t.icon}<span>${t.label}</span></a>`).join('')).join('');

    // remember home geometry for every window (groups + dialogs)
    $$('.win', workspace).forEach(w => {
      home[w.dataset.win] = { left: w.style.left, top: w.style.top, width: w.style.width, height: w.style.height };
      w.style.zIndex = ++zTop;
    });
    focus($('.win[data-win="readme"]'));

    // phone: the same group windows, stacked
    $('#palm-list').innerHTML = data.groups.map(g => `
      <div class="bev pwin">
        <div class="titlebar"><span>${g.title}</span></div>
        <div class="body icons">${(byGroup[g.id] || []).map(t => `<a class="ico" href="${t.href}" title="${esc(t.title)}" data-tool="${t.id}">${t.icon}<span>${t.label}</span></a>`).join('')}</div>
      </div>`).join('');
  }

  /* ---------- phone: programs open inside the handheld's screen ---------- */
  const palmMain = $('.palm-progman');
  const palmView = document.createElement('div');
  palmView.className = 'bev palm-progman palm-view';
  palmView.hidden = true;
  palmView.innerHTML = `
    <div class="titlebar main"><span class="pv-title"></span><span><button class="bev sysbtn x" type="button" data-pv="close" aria-label="Close"></button></span></div>
    <div class="pv-bar"><button class="bev btn" type="button" data-pv="close">&#9664; Back</button><a class="bev btn pv-out" target="_blank" rel="noopener">Full size &#8599;</a></div>
    <div class="body frame"><iframe title=""></iframe></div>`;
  palmMain.after(palmView);
  let palmFrom = null;
  function palmOpen(t, from) {
    palmFrom = from;
    $('.pv-title', palmView).innerHTML = `${t.icon.replace('<svg ', '<svg class="ti" ')} ${esc(t.label.replace('\n', ' ').toUpperCase())}`;
    $('.pv-out', palmView).href = t.href;
    const f = $('iframe', palmView);
    f.title = t.title; f.src = t.href;
    palmMain.hidden = true; palmView.hidden = false;
    $('[data-pv="close"].btn', palmView).focus();
  }
  function palmClose() {
    if (palmView.hidden) return;
    palmView.hidden = true; palmMain.hidden = false;
    $('iframe', palmView).src = 'about:blank';               // stop sounds and animations
    palmFrom?.focus();
  }
  $('#palm-list').addEventListener('click', e => {
    const a = e.target.closest('a[data-tool]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;   // modified clicks still open a tab
    e.preventDefault();
    palmOpen(tools[a.dataset.tool], a);
  });
  palmView.addEventListener('click', e => { if (e.target.closest('[data-pv="close"]')) palmClose(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') palmClose(); });

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
    const title = win.dataset.label || [...win.querySelector('.titlebar > span').childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim().split(/\s/)[0];
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
    tray.querySelector(`[data-restore="${win.dataset.win}"]`)?.remove();
    if (win.classList.contains('tool')) { win._destroy?.(); delete home[win.dataset.win]; win.remove(); return; }
    win.hidden = true;
    win.dataset.closed = '1';
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
      wins.forEach(w => { if (!['about', 'props', 'hires'].includes(w.dataset.win)) { Object.assign(w.style, home[w.dataset.win]); delete w.dataset.max; open(w); } });
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

  /* ---------- tool windows (iframe on the tube) ---------- */
  function runTool(id) {
    const t = tools[id]; if (!t) return;
    let win = $(`.win[data-win="tool-${id}"]`, workspace);
    if (!win) {
      const n = $$('.win.tool', workspace).length;
      win = document.createElement('div');
      win.className = 'bev win tool';
      win.dataset.win = `tool-${id}`;
      win.dataset.label = t.label.split('\n')[0].toUpperCase();
      win.style.cssText = `left:${14 + n * 16}px;top:${10 + n * 14}px;width:576px;height:356px`;
      win.innerHTML = `
        <div class="titlebar">
          <span>${t.icon.replace('<svg ', '<svg class="ti" ')} ${esc(t.title.toUpperCase())}</span>
          <span><a class="bev sysbtn" href="${t.href}" target="_blank" rel="noopener" title="Open in a new tab" aria-label="Open in a new tab">↗</a><button class="bev sysbtn" data-wm="min" aria-label="Minimize"></button><button class="bev sysbtn" data-wm="max" aria-label="Maximize"></button><button class="bev sysbtn" data-wm="close" aria-label="Close"></button></span>
        </div>
        <div class="body frame"><iframe src="${t.href}" title="${esc(t.title)}" allow="fullscreen"></iframe></div>
        <div class="grip" data-wm="resize" aria-hidden="true"></div>`;
      workspace.appendChild(win);
      home[win.dataset.win] = { left: win.style.left, top: win.style.top, width: win.style.width, height: win.style.height };
    }
    open(win);
    clearTimeout(hiresTimer);
    hiresTimer = setTimeout(() => showHires(t), 900);      // pop in after the window lands
  }
  let hiresTimer = null;
  function showHires(t) {
    const win = $('.win[data-win="hires"]');
    if (win.dataset.once !== undefined) { if (win.dataset.shown) return; win.dataset.shown = '1'; }
    if ($('#hires-name')) $('#hires-name').textContent = t.label.replace('\n', ' ');
    if ($('#hires-open')) $('#hires-open').href = t.href;
    Object.assign(win.style, home.hires); delete win.dataset.max;   // always bottom-right
    open(win);
  }
  $('#hires-open')?.addEventListener('click', () => close($('.win[data-win="hires"]')));
  // "Scroll down" in an embed: the link targets an anchor on the host page; also tell the host, in case it listens
  $$('[data-host-scroll]').forEach(el => el.addEventListener('click', () => { try { parent.postMessage({ vsl: 'scroll-down' }, '*'); } catch (e) {} }));
  // clicking inside an iframe never reaches us, but it does move focus into it
  addEventListener('blur', () => setTimeout(() => {
    const f = document.activeElement;
    if (f?.tagName === 'IFRAME') focus(f.closest('.win'));
  }, 0));

  function showProps(id) {
    const t = tools[id]; if (!t) return;
    const win = $('.win[data-win="props"]');
    $('#props-title').textContent = `PROPERTIES — ${t.label.replace('\n', ' ').toUpperCase()}`;
    $('#props-icon').innerHTML = t.icon;
    $('#props-name').textContent = t.title;
    $('#props-desc').textContent = t.desc || '';
    $('#props-url').textContent = t.href.replace(/^https?:\/\//, '');
    $('#props-open').href = t.href;
    $('#props-run').onclick = () => { close(win); runTool(id); };
    open(win);
  }
  workspace.addEventListener('contextmenu', e => {
    const ico = e.target.closest('.ico[data-tool]');
    if (!ico) return;
    e.preventDefault();
    showProps(ico.dataset.tool);
  });

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
    workspace.classList.add('dragging');
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
  addEventListener('pointerup', () => { drag = null; workspace.classList.remove('dragging'); });
  addEventListener('pointercancel', () => { drag = null; workspace.classList.remove('dragging'); });

  // window buttons + tray
  workspace.addEventListener('click', e => {
    const run = e.target.closest('[data-run]');
    if (run) { const dlg = run.closest('.win'); if (dlg) close(dlg); runTool(run.dataset.run); return; }
    const ico = e.target.closest('a.ico[data-tool]');
    if (ico) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      e.preventDefault(); runTool(ico.dataset.tool); return;
    }
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

  /* ---------- menus: everything lives in the Start menu now ---------- */
  function closeMenus() { const m = $('.startmenu'); if (m) m.hidden = true; }
  /* ---------- start menu ---------- */
  const startbtn = $('.startbtn');
  const startmenu = document.createElement('div');
  startmenu.className = 'bev startmenu'; startmenu.hidden = true;
  startmenu.innerHTML = `
    <button type="button" data-start="minesweeper">${MINE_ICON} Minesweeper</button>
    <button type="button" data-start="solitaire">${CARD_ICON} Solitaire</button>
    <span class="sep"></span>
    <button type="button" data-start="cascade">${WIN_ICON} Cascade windows</button>
    <button type="button" data-start="tile">${WIN_ICON} Tile windows</button>
    <button type="button" data-start="home">${WIN_ICON} Arrange windows</button>
    <button type="button" data-start="reopen">${WIN_ICON} Reopen closed windows</button>
    <span class="sep"></span>
    <button type="button" data-start="degauss">${EYE_ICON} Degauss</button>
    <button type="button" data-start="saver">${EYE_ICON} Screensaver</button>
    <button type="button" data-start="scanlines">${EYE_ICON} Toggle scanlines</button>
    <button type="button" data-start="about">${EYE_ICON} About…</button>
    <span class="sep"></span>
    <button type="button" data-start="power-off">${POWER_ICON} Shut Down…</button>`;
  startbtn?.after(startmenu);
  startbtn?.addEventListener('click', () => { startmenu.hidden = !startmenu.hidden; });
  startmenu.addEventListener('click', e => {
    const b = e.target.closest('[data-start]'); if (!b) return;
    startmenu.hidden = true;
    ({ minesweeper: openMinesweeper, solitaire: openSolitaire,
       cascade: () => arrange('cascade'), tile: () => arrange('tile'), home: () => arrange('home'), reopen: () => arrange('reopen'),
       degauss, saver: showSaver, scanlines: () => $('#scanlines').classList.toggle('hidden'),
       about: () => open($('.win[data-win="about"]')), 'power-off': () => setPower(false) })[b.dataset.start]?.();
  });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.startmenu, .startbtn')) startmenu.hidden = true; });

  function openApp(id, title, icon, geom, mountFn) {
    let win = $(`.win[data-win="app-${id}"]`, workspace);
    if (!win) {
      win = document.createElement('div');
      win.className = 'bev win tool app';
      win.dataset.win = `app-${id}`;
      win.dataset.label = title;
      win.style.cssText = geom;
      win.innerHTML = `
        <div class="titlebar">
          <span>${icon} ${title}</span>
          <span><button class="bev sysbtn" data-wm="min" aria-label="Minimize"></button><button class="bev sysbtn" data-wm="max" aria-label="Maximize"></button><button class="bev sysbtn" data-wm="close" aria-label="Close"></button></span>
        </div>
        <div class="body"></div>`;
      workspace.appendChild(win);
      home[win.dataset.win] = { left: win.style.left, top: win.style.top, width: win.style.width, height: win.style.height };
      win._destroy = mountFn(win.querySelector('.body'));
    }
    open(win);
  }
  const openMinesweeper = () => openApp('minesweeper', 'MINESWEEPER', MINE_ICON, 'left:200px;top:40px;width:184px;height:244px', Minesweeper.mount);
  const openSolitaire = () => openApp('solitaire', 'SOLITAIRE', CARD_ICON, 'left:20px;top:8px;width:450px;height:400px', Solitaire.mount);
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
    const lines = bootLines();
    let n = 0;
    bootTimer = setInterval(() => {
      n++;
      boot.textContent = lines.slice(0, n).join('\n');
      if (n >= lines.length) {
        clearInterval(bootTimer);
        setTimeout(() => { boot.hidden = true; desktop.hidden = false; power = 'on'; $('#status').textContent = statusText(); armIdle(); }, 400);
      }
    }, 260);
  }
  $('#power').addEventListener('click', () => setPower(power === 'off'));

  /* ---------- screensaver: bouncing logo ----------
     The logo drifts and reflects off the screen edges, changing colour on
     each bounce. If it lands in a corner exactly (both edges in the same
     frame) it shatters into its own pixels, then respawns in the centre. */
  const canvas = $('#saver-canvas');
  const ctx = canvas.getContext('2d');
  const logo = new Image(); logo.src = 'assets/cvc-logo.png';
  const tintCanvas = document.createElement('canvas');
  const PALETTE = ['#ffffff', '#00ffff', '#ffff00', '#00ff00', '#ff00ff', '#ff8000', '#ff0000', '#b2ffff'];
  const LOGO_W = 150;
  const PX = 4;                                                // particle size / sample step
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let sv = null, svRaf = 0, svLast = 0;

  function svReset(centre) {
    const ratio = logo.naturalWidth ? logo.naturalHeight / logo.naturalWidth : 0.55;
    const w = LOGO_W, h = Math.round(LOGO_W * ratio);
    const sgn = () => (Math.random() < .5 ? -1 : 1);
    sv = { x: centre ? (canvas.width - w) / 2 : Math.random() * (canvas.width - w),
           y: centre ? (canvas.height - h) / 2 : Math.random() * (canvas.height - h),
           w, h, vx: sgn() * (1.5 + Math.random()), vy: sgn() * (1.1 + Math.random()),
           color: 0, particles: null, respawnAt: 0 };
    if (reduceMotion) { sv.vx = sv.vy = 0; }
    tint();
  }
  function tint() {
    if (!logo.naturalWidth) return;
    tintCanvas.width = sv.w; tintCanvas.height = sv.h;
    const c = tintCanvas.getContext('2d');
    c.clearRect(0, 0, sv.w, sv.h);
    c.drawImage(logo, 0, 0, sv.w, sv.h);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = PALETTE[sv.color]; c.fillRect(0, 0, sv.w, sv.h);
  }
  function explode() {
    const c = tintCanvas.getContext('2d');
    const img = c.getImageData(0, 0, sv.w, sv.h).data;
    const cx = sv.x + sv.w / 2, cy = sv.y + sv.h / 2;
    sv.particles = [];
    for (let py = 0; py < sv.h; py += PX) for (let px = 0; px < sv.w; px += PX) {
      if (img[(py * sv.w + px) * 4 + 3] < 128) continue;   // only the logo's own pixels
      const x = sv.x + px, y = sv.y + py;
      const ang = Math.atan2(y - cy, x - cx) + (Math.random() - .5) * .8;
      const sp = 1.5 + Math.random() * 4;
      sv.particles.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1.5, life: 1, decay: .006 + Math.random() * .01,
                          color: PALETTE[(sv.color + (Math.random() * 3 | 0)) % PALETTE.length] });
    }
    sv.respawnAt = performance.now() + 2600;
  }
  function svFrame(now) {
    svRaf = requestAnimationFrame(svFrame);
    const dt = Math.min(3, (now - svLast) / 16.67 || 1); svLast = now;
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (!logo.naturalWidth) return;
    if (!tintCanvas.width) tint();

    if (sv.particles) {
      let alive = false;
      for (const p of sv.particles) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .12 * dt; p.life -= p.decay * dt;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color; ctx.fillRect(Math.round(p.x), Math.round(p.y), PX, PX);
      }
      ctx.globalAlpha = 1;
      if (!alive && now >= sv.respawnAt) svReset(true);
      return;
    }

    sv.x += sv.vx * dt; sv.y += sv.vy * dt;
    let hitX = false, hitY = false;
    if (sv.x <= 0) { sv.x = 0; sv.vx = Math.abs(sv.vx); hitX = true; }
    else if (sv.x + sv.w >= W) { sv.x = W - sv.w; sv.vx = -Math.abs(sv.vx); hitX = true; }
    if (sv.y <= 0) { sv.y = 0; sv.vy = Math.abs(sv.vy); hitY = true; }
    else if (sv.y + sv.h >= H) { sv.y = H - sv.h; sv.vy = -Math.abs(sv.vy); hitY = true; }
    if (hitX && hitY) { explode(); return; }               // the corner. It happens.
    if (hitX || hitY) { sv.color = (sv.color + 1) % PALETTE.length; tint(); }
    ctx.drawImage(tintCanvas, Math.round(sv.x), Math.round(sv.y));
  }

  function armIdle() {
    clearTimeout(idleTimer);
    if (!IDLE_MS) return;
    idleTimer = setTimeout(() => {
      if (power !== 'on') return;
      if (document.activeElement?.tagName === 'IFRAME') armIdle(); else showSaver();
    }, IDLE_MS);
  }
  function showSaver() {
    if (!saver.hidden) return;
    closeMenus(); saver.hidden = false;
    canvas.width = saver.clientWidth; canvas.height = saver.clientHeight;   // match the screen, whatever its size
    svReset(false); svLast = performance.now();
    cancelAnimationFrame(svRaf); svRaf = requestAnimationFrame(svFrame);
  }
  function hideSaver() {
    cancelAnimationFrame(svRaf); svRaf = 0;
    saver.hidden = true; armIdle();
  }
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
    if (!saver.hidden) { e.preventDefault(); hideSaver(); return; }   // any key wakes the screensaver
    typed = (typed + e.key).slice(-6);
    if (typed.endsWith('20/20')) $('#scanlines').classList.toggle('hidden');   // type 20/20 → toggle scanlines
    if (typed.endsWith('dgs')) degauss();                                      // d g s → degauss
  });

  /* ---------- status-line clock ---------- */
  const clock = $('#clock');
  const palmClock = $('#palm-clock');
  function tick() {
    const d = new Date();
    clock.textContent = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).toUpperCase();
    palmClock.textContent = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toUpperCase();
  }
  tick(); setInterval(tick, 1000);

  build().then(armIdle);
})();
