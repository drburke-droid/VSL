# CLAUDE.md — Visual Systems Lab retro front page

Read README.md first; it explains the stage, the tube geometry and the effect layers.

## Ground rules
- No build tooling, no frameworks, no npm deps. Vanilla HTML/CSS/JS only; keep it runnable with `python3 -m http.server`.
- Stage coordinates are 737x720 px (the monitor image, `assets/monitor.webp`, 1172x1145 with alpha, fills it). The screen box is `left:72 top:73 593x419`, clipped by a `clip-path` to the bezel's bulged opening (about 6px top/bottom, 3px sides) - do not move it; it is traced from the image. Never use a displacement filter for curvature; the clip keeps text crisp.
- Desktop content lives in a 645x456 box scaled by `--desktop-scale` (0.9194) so it fills the screen exactly; the taskbar sits on the screen's bottom edge. If you change that value, change `DESKTOP_SCALE` in js/app.js too.
- Tool data belongs in `js/tools.json` (lab) and `js/home.json` (homepage), never hard-coded in HTML. `home.html` is `index.html` with different copy; when you change chrome in one, change the other.
- Keep the desktop chrome generic Windows-95/98-era: system sans (Tahoma/MS Sans Serif) at 11px; icons are our own 32x32 SVGs in the shaded late-90s style (gradients, 1px outline, soft shadow), never vendor logos or wordmarks. VT323 is for the DOS boot screen only. Icons sit directly on the teal desktop (`#desk`, generated in `build()`); the `groups` in the JSON only order them and drive the phone layout.
- All clickable things must be real `<a>`/`<button>` elements with labels. The phone handheld's group windows are generated from tools.json in `build()`; never hand-edit them.
- The page is embedded on calgaryvisioncentre.com/lab in an iframe; keep `<base target="_top">` so links leave the frame.
- Homepage copy (home.html, home.json, sites/cvc1998): no individual's name, and no comparative or superiority words (best, latest, advanced, leading, most, superior). The College of Optometrists' advertising rules apply.
- Real links: tools are on calgaryvisioncentre.com (two on drburke-droid.github.io); blog `/blog`; booking `/book-an-appointment`; lab index `/lab`.

## Testing
- Serve the folder, open in Chrome, and check: click an icon → tool opens in an iframe window; right-click → Properties; drag/resize/min/max/close on every window; Start > Cascade/Tile/Arrange/Reopen, Degauss, Screensaver, scanlines, Minesweeper, About, Shut Down; power button off > on boot sequence; typing `20/20` and `dgs`.
- Do not reintroduce the barrel displacement filter on `.tube`: it breaks 1px bevels and clips text. Curvature comes only from the glass overlay layers.
- Resize under 700 px: the handheld must appear with all 13 icons; its screen is `left:40 top:38 250×457` in a 332×625 scene — do not move it.
- `design-canvas-sources/` is reference only — the `.dc.html` files need the Claude Design runtime and will not run here.
