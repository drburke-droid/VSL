/* ==========================================================
   1998 extras for the homepage, loaded on first use (app.js need()).
   window.Retro = {
     inbox(el), recycle(el)      mount into el, return destroy()
     dialup(el, onDone)          the "Connecting to CVC Net" sequence in el
   }
   Everything is text and CSS; the modem sound is synthesized with Web
   Audio and only plays when someone presses the button. No dependencies.
   ========================================================== */
(() => {
  'use strict';
  const BOOK = 'https://calgaryvisioncentre.com/book-an-appointment';
  const book = `<p class="rx-cta"><a class="bev btn" href="${BOOK}">Book an appointment</a> or call <a href="tel:+14032370505">403-237-0505</a></p>`;
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  /* ---------- Inbox: an e-mail program with 1998 mail ---------- */
  const today = () => { const d = new Date(); return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`; };
  const MAIL = [
    { from: 'Calgary Vision Centre', subj: 'Time for an eye exam?', date: today, unread: true,
      body: `<p>Hello from the future!</p><p>We opened our doors in 1998, the year this computer was high tech. Computers, phones and eye care have all moved on since.</p><p>Come see what nearly 30 years of innovation looks like.</p>${book}` },
    { from: 'A friend', subj: 'FW: FW: FW: FW: FW: send this to 10 friends!!!', date: '6/18/98', unread: true,
      body: `<p>&gt;&gt;&gt;&gt;&gt; This e-mail is being tracked by a special program. Forward it to 10 people and a big software company will send you $245. Forward it to 20 and you get a free trip!!!</p><p>&gt;&gt;&gt;&gt;&gt; This is NOT a joke. My cousin's friend got a cheque.</p><p>&gt;&gt;&gt;&gt;&gt; DO NOT BREAK THE CHAIN</p>` },
    { from: 'Mom', subj: 'HOW DO I TURN OFF CAPS LOCK', date: '9/2/98', unread: true,
      body: `<p>WHY IS EVERYTHING I TYPE SHOUTING. ALSO THE COMPUTER SAYS IT HAS PERFORMED AN ILLEGAL OPERATION. AM I IN TROUBLE.</p><p>CALL YOUR GRANDMOTHER.</p><p>LOVE MOM</p>` },
    { from: 'Online Service', subj: '500 FREE hours! Just insert the CD', date: '7/22/98',
      body: `<p>Pop in the CD that came with your cereal and enjoy 500 FREE hours of online time!*</p><p class="rx-fine">*Hours must be used within 30 days.</p>` },
    { from: 'Y2K Newsletter', subj: 'Are you Y2K ready?', date: '3/15/98',
      body: `<p>Only 657 days until January 1, 2000!</p><p>Will your VCR still work? Will the bank remember your savings? Will the microwave know what year it is? Stock up now.</p><p>This newsletter is Y2K compliant.</p>` },
    { from: 'CVC Net', subj: 'Welcome to the Internet!', date: '1/5/98',
      body: `<p>Your account is ready. Your connection: 28.8 Kbps.</p><p>Helpful tips:</p><p>- Do not pick up the phone while you are online.<br>- A page with pictures can take a minute or two. Get a coffee.<br>- Remember to log off. You pay by the hour.</p>` }
  ];

  /* ---------- Recycle Bin: 1998, deleted ---------- */
  const TRASH = [
    { name: 'eye_prescription_1998.txt', from: 'C:\\My Documents', date: '12/21/98',
      body: `<p>Your prescription from 1998.</p><p>Eyes change over time, and so has the way we test them. Time for a new one?</p>${book}` },
    { name: 'Free 500 Hours Trial CD', from: 'D:\\', date: '12/03/98',
      body: `<p>Coaster number 14. They came in the mail, in cereal boxes and at the checkout. Nobody ever ran out.</p>` },
    { name: 'virtual_pet.sav', from: 'C:\\My Documents', date: '11/17/98',
      body: `<p>Status: hungry.<br>Last fed: during math class.</p>` },
    { name: 'phone_bill_aug98.txt', from: 'C:\\My Documents', date: '09/14/98',
      body: `<p>Long distance to the internet: $212.40.</p><p>Nobody else could use the phone all evening, either.</p>` },
    { name: 'summer_98_mix.m3u', from: 'C:\\My Music', date: '08/30/98',
      body: `<p>Track list for a mix CD that took four hours to download and eleven tries to burn.</p>` },
    { name: 'Y2K_survival_plan.doc', from: 'C:\\My Documents', date: '06/01/98',
      body: `<p>Step 1: fill the bathtub.<br>Step 2: buy a lot of canned beans.<br>Step 3: find out nothing happens.</p>` },
    { name: 'backup_disk_17_of_23.img', from: 'A:\\', date: '04/09/98',
      body: `<p>Please insert disk 18 of 23.</p>` }
  ];

  // list + preview pane, shared by the Inbox and the Recycle Bin
  function listApp(root, { cls, cols, rows, cells, toolbar, empty }) {
    root.classList.add('rx', cls);
    root.innerHTML = `${toolbar ? `<div class="rx-bar">${toolbar}</div>` : ''}
      <div class="rx-list bev-in" role="listbox" aria-label="${cls === 'rx-mail' ? 'Messages' : 'Deleted files'}">
        <div class="rx-row rx-head">${cols.map(c => `<span>${c}</span>`).join('')}</div><div class="rx-rows"></div>
      </div>
      <div class="rx-view bev-in"></div>`;
    const list = root.querySelector('.rx-rows'), view = root.querySelector('.rx-view');
    const draw = sel => {
      list.innerHTML = rows.length ? rows.map((r, i) =>
        `<button type="button" role="option" class="rx-row${r.unread ? ' unread' : ''}${i === sel ? ' sel' : ''}" data-i="${i}" aria-selected="${i === sel}">${cells(r).map(c => `<span>${c}</span>`).join('')}</button>`).join('')
        : `<p class="rx-empty">${empty}</p>`;
    };
    const show = i => {
      const r = rows[i]; if (!r) { view.innerHTML = ''; return; }
      r.unread = false; draw(i);
      view.innerHTML = r.head ? r.head(r) + r.body : r.body;
    };
    list.addEventListener('click', e => { const b = e.target.closest('.rx-row[data-i]'); if (b) show(+b.dataset.i); });
    draw(0); show(0);
    return { list, view, root, redraw: () => { draw(-1); view.innerHTML = ''; } };
  }

  function inbox(root) {
    const rows = MAIL.map(m => ({ ...m, head: r => `<div class="rx-mhead"><b>From:</b> ${esc(r.from)}<br><b>Subject:</b> ${esc(r.subj)}</div>` }));
    listApp(root, { cls: 'rx-mail', cols: ['From', 'Subject', 'Received'], rows,
      cells: r => [esc(r.from), esc(r.subj), typeof r.date === 'function' ? r.date() : r.date] });
    return () => {};
  }

  function recycle(root) {
    const rows = TRASH.map(t => ({ ...t }));
    const app = listApp(root, { cls: 'rx-bin', cols: ['Name', 'Original location', 'Deleted'], rows,
      cells: r => [esc(r.name), esc(r.from), r.date],
      toolbar: `<button type="button" class="bev btn" data-rx="empty">Empty Recycle Bin</button><span class="rx-ask" hidden>Delete all ${TRASH.length} items? <button type="button" class="bev btn" data-rx="yes">Yes</button> <button type="button" class="bev btn" data-rx="no">No</button></span>`,
      empty: 'The Recycle Bin is empty.' });
    const ask = root.querySelector('.rx-ask'), emptyBtn = root.querySelector('[data-rx="empty"]');
    root.querySelector('.rx-bar').addEventListener('click', e => {
      const b = e.target.closest('[data-rx]'); if (!b) return;
      if (b.dataset.rx === 'empty') { ask.hidden = false; emptyBtn.hidden = true; return; }
      ask.hidden = true;
      if (b.dataset.rx === 'yes') { rows.length = 0; app.redraw(); emptyBtn.disabled = true; }
      emptyBtn.hidden = false;
    });
    return () => {};
  }

  /* ---------- dial-up: "Connecting to CVC Net" ---------- */
  const STEPS = ['Dialing 555-1998...', 'Verifying user name and password...', 'Logging on to network...', 'Connected at 28,800 bps.'];
  function dialup(root, onDone) {
    root.classList.add('rx', 'rx-dial');
    root.innerHTML = `
      <div class="rx-dialtop">
        <svg width="40" height="32" viewBox="0 0 40 32" aria-hidden="true"><rect x="1" y="4" width="16" height="12" rx="1" fill="#c0c0c0" stroke="#000"/><rect x="3" y="6" width="12" height="8" fill="#008080"/><rect x="5" y="17" width="8" height="3" fill="#808080" stroke="#000" stroke-width=".6"/><rect x="23" y="4" width="16" height="12" rx="1" fill="#c0c0c0" stroke="#000"/><rect x="25" y="6" width="12" height="8" fill="#008080"/><rect x="27" y="17" width="8" height="3" fill="#808080" stroke="#000" stroke-width=".6"/><path class="rx-wire" d="M13 24h14" stroke="#000" stroke-width="2" stroke-dasharray="2 2"/></svg>
        <div><b>Connecting to CVC Net</b><div class="rx-status" aria-live="polite"></div></div>
      </div>
      <div class="rx-dialbtns"><button type="button" class="bev btn" data-rx="sound">Play modem sound</button><button type="button" class="bev btn" data-rx="skip">Cancel</button></div>`;
    const status = root.querySelector('.rx-status');
    let timers = [], done = false;
    const finish = () => { if (done) return; done = true; timers.forEach(clearTimeout); onDone(); };
    const run = gap => {
      timers.forEach(clearTimeout); timers = [];
      STEPS.forEach((s, i) => timers.push(setTimeout(() => { status.textContent = s; }, i * gap)));
      timers.push(setTimeout(finish, (STEPS.length - 1) * gap + 900));
    };
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-rx]'); if (!b) return;
      if (b.dataset.rx === 'skip') { finish(); return; }
      b.disabled = true; modem(); run(1500);                   // stretch the steps over the sound
    });
    run(650);
    return finish;
  }

  // Dial tones, the answer tone, then the handshake screech: about 5 s, synthesized.
  function modem() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ac = new AC(), out = ac.createGain(); out.gain.value = 0.12; out.connect(ac.destination);
    const tone = (f, t0, dur, g = 1) => {
      const o = ac.createOscillator(), v = ac.createGain(); o.frequency.value = f; v.gain.value = g;
      o.connect(v); v.connect(out); o.start(ac.currentTime + t0); o.stop(ac.currentTime + t0 + dur);
      return o;
    };
    const DTMF = { 1: [697, 1209], 5: [770, 1336], 8: [852, 1336], 9: [852, 1477] };
    [...'5551998'].forEach((d, i) => DTMF[d].forEach(f => tone(f, i * 0.14, 0.09, 0.5)));
    let t = 1.3;
    tone(2100, t, 0.9); t += 1.0;                                // answer tone
    for (let i = 0; i < 6; i++) { tone(i % 2 ? 1650 : 980, t, 0.12, 0.6); tone(i % 2 ? 2250 : 1180, t, 0.12, 0.6); t += 0.13; }
    const warble = tone(1800, t, 0.8, 0.5); warble.frequency.setValueAtTime(1800, ac.currentTime + t);
    warble.frequency.linearRampToValueAtTime(600, ac.currentTime + t + 0.8); t += 0.8;
    const len = 1.6, buf = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.sin(i / 300));
    const noise = ac.createBufferSource(), bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.8;
    noise.buffer = buf; noise.connect(bp); bp.connect(out); noise.start(ac.currentTime + t);
    setTimeout(() => ac.close(), (t + len + 0.5) * 1000);
  }

  window.Retro = { inbox, recycle, dialup };
})();
