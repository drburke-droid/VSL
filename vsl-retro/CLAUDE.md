# CLAUDE.md — Visual Systems Lab retro front page

Read README.md first; it explains the stage, the tube geometry and the effect layers.

## Ground rules
- No build tooling, no frameworks, no npm deps. Vanilla HTML/CSS/JS only; keep it runnable with `python3 -m http.server`.
- Stage coordinates are 738x720 px (the monitor image, `assets/monitor.webp`, 1157x1129 with alpha, fills it). The screen box is `left:68 top:68 601x426`, clipped by a `clip-path` to the bezel's bulged opening (about 6px top/bottom, 3px sides) - do not move it; it is traced from the image. Never use a displacement filter for curvature; the clip keeps text crisp.
- Desktop content lives in a 645x457 box scaled by `--desktop-scale` (0.9318) so it fills the screen exactly; the taskbar sits on the screen's bottom edge. If you change that value, change `DESKTOP_SCALE` in js/app.js too.
- Tool data belongs in `js/tools.json` (lab) and `js/home.json` (homepage), never hard-coded in HTML. `home.html` is `index.html` with different copy; when you change chrome in one, change the other.
- Keep the desktop chrome generic Windows-95/98-era: system sans (Tahoma/MS Sans Serif) at 11px; icons are our own 32x32 SVGs in the shaded late-90s style (gradients, 1px outline, soft shadow), never vendor logos or wordmarks. VT323 is for the DOS boot screen only. Icons sit directly on the teal desktop (`#desk`, generated in `build()`); the `groups` in the JSON only order them and drive the phone layout.
- All clickable things must be real `<a>`/`<button>` elements with labels. The phone handheld's group windows are generated from tools.json in `build()`; never hand-edit them.
- The page is embedded on calgaryvisioncentre.com/lab in an iframe; keep `<base target="_top">` so links leave the frame.
- Homepage copy (home.html, home.json, sites/cvc1998): no individual's name, and no comparative or superiority words (best, latest, advanced, leading, most, superior). The College of Optometrists' advertising rules apply.
- Homepage archive links (js/home.json) must be Wayback captures from 1998: any other year ruins the "we opened in 1998" joke. The Wayback Machine is blocked from the cloud sandbox, so new candidates are checked by hand in a browser (open without `if_`, read the date in the Wayback bar, confirm the page renders) before they go in; the `href` then uses the same timestamp with `if_`. Napster is not an option (launched June 1999). Where no clean 1998 capture exists, or a screenshot looks better, a 1998 screenshot can stand in as a local page under `sites/` (Amazon, Apple and BBC News do; see `sites/amazon1998/`); say in its title and desc that it is a picture.
- Handheld (phone) view: README.TXT comes first, above the group windows, on both pages, so visitors know why they are looking at a PDA. Tapping a program opens it inside the PDA screen (`.palm-view` iframe, built in app.js), never full screen; Full size is the explicit way out. The three hardware buttons still navigate normally. Keep it short; the homepage title there is just `README.TXT` so it fits.
- `today.html` is standalone (no app.js): the tour iframe is mapped onto the tablet screen with a matrix3d computed from four measured corners; if the image changes, re-measure the corners and recompute (see README).
- Real links: tools are on calgaryvisioncentre.com (two on drburke-droid.github.io); blog `/blog`; booking `/book-an-appointment`; lab index `/lab`.

## Testing
- Serve the folder, open in Chrome, and check: click an icon → tool opens in an iframe window; right-click → Properties; drag/resize/min/max/close on every window; Start > Cascade/Tile/Arrange/Reopen, Degauss, Screensaver, scanlines, Minesweeper, About, Shut Down; power button off > on boot sequence; typing `20/20` and `dgs`.
- Do not reintroduce the barrel displacement filter on `.tube`: it breaks 1px bevels and clips text. Curvature comes only from the glass overlay layers.
- Make the window portrait (taller than wide): the handheld must appear with README.TXT on top and all the icons (13 on index.html, 17 on home.html); its screen is `left:38 top:34 250×457` in a 328×613 scene — do not move it.
- `design-canvas-sources/` is reference only — the `.dc.html` files need the Claude Design runtime and will not run here.
