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
    'Loading 13 programs ......... OK',
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
  const menubar = $('#menubar');

  let stageScale = 1;
  let zTop = 10;
  let drag = null;
  let power = 'on';
  let idleTimer = null;
  let bootTimer = null;
  const home = {};                     // window id → original geometry
  const tools = {};                    // tool id → tools.json entry
  const esc = str => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

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
    data.tools.forEach(t => { (byGroup[t.group] ||= []).push(t); tools[t.id] = t; });

    data.groups.forEach(g => {
      const win = document.createElement('div');
      win.className = 'bev win';
      win.dataset.win = g.id;
      win.dataset.label = g.title.split(' ')[0];
      win.style.cssText = `left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h}px`;
      win.innerHTML = `
        <div class="titlebar">
          <span>${g.title}</span>
          <span><button class="bev sysbtn" data-wm="min" aria-label="Minimize"></button><button class="bev sysbtn" data-wm="max" aria-label="Maximize"></button><button class="bev sysbtn" data-wm="close" aria-label="Close"></button></span>
        </div>
        <div class="body icons">
          ${(byGroup[g.id] || []).map(t => `<a class="ico" href="${t.href}" title="${esc(t.title)}" data-tool="${t.id}">${t.icon}<span>${t.label}</span></a>`).join('')}
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
    if (win.classList.contains('tool')) { delete home[win.dataset.win]; win.remove(); return; }
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
          <span>${esc(t.title.toUpperCase())}</span>
          <span><a class="bev sysbtn" href="${t.href}" target="_blank" rel="noopener" title="Open in a new tab" aria-label="Open in a new tab">↗</a><button class="bev sysbtn" data-wm="min" aria-label="Minimize"></button><button class="bev sysbtn" data-wm="max" aria-label="Maximize"></button><button class="bev sysbtn" data-wm="close" aria-label="Close"></button></span>
        </div>
        <div class="body frame"><iframe src="${t.href}" title="${esc(t.title)}" allow="fullscreen"></iframe></div>
        <div class="grip" data-wm="resize" aria-hidden="true"></div>`;
      workspace.insertBefore(win, tray);
      home[win.dataset.win] = { left: win.style.left, top: win.style.top, width: win.style.width, height: win.style.height };
    }
    open(win);
    clearTimeout(hiresTimer);
    hiresTimer = setTimeout(() => showHires(t), 900);      // pop in after the window lands
  }
  let hiresTimer = null;
  function showHires(t) {
    const win = $('.win[data-win="hires"]');
    $('#hires-name').textContent = t.label.replace('\n', ' ');
    $('#hires-open').href = t.href;
    Object.assign(win.style, home.hires); delete win.dataset.max;   // always bottom-right
    open(win);
  }
  $('#hires-open').addEventListener('click', () => close($('.win[data-win="hires"]')));
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
    const lines = bootLines();
    let n = 0;
    bootTimer = setInterval(() => {
      n++;
      boot.textContent = lines.slice(0, n).join('\n');
      if (n >= lines.length) {
        clearInterval(bootTimer);
        setTimeout(() => { boot.hidden = true; desktop.hidden = false; power = 'on'; $('#status').textContent = '13 PROGRAMS LOADED · 640K OK'; armIdle(); }, 400);
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
    idleTimer = setTimeout(() => {
      if (power !== 'on') return;
      if (document.activeElement?.tagName === 'IFRAME') armIdle(); else showSaver();
    }, IDLE_MS);
  }
  function showSaver() {
    if (!saver.hidden) return;
    closeMenus(); saver.hidden = false;
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
    if (e.altKey && /^[fwh]$/i.test(e.key)) {           // Alt-F / Alt-W / Alt-H open menus
      e.preventDefault();
      $(`button[data-menu="${{ f: 'file', w: 'window', h: 'help' }[e.key.toLowerCase()]}"]`, menubar).click();
      return;
    }
    typed = (typed + e.key).slice(-6);
    if (typed.endsWith('20/20')) $('#scanlines').classList.toggle('hidden');   // type 20/20 → toggle scanlines
    if (typed.endsWith('dgs')) degauss();                                      // d g s → degauss
  });

  /* ---------- status-line clock ---------- */
  const clock = $('#clock');
  function tick() {
    clock.textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).toUpperCase();
  }
  tick(); setInterval(tick, 1000);

  build().then(armIdle);
})();
