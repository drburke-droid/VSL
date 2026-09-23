# CLAUDE.md — Visual Systems Lab retro front page

Read README.md first; it explains the stage, the tube geometry and the effect layers.

## Ground rules
- No build tooling, no frameworks, no npm deps. Vanilla HTML/CSS/JS only; keep it runnable with `python3 -m http.server`.
- Stage coordinates are 1280×720 px. The tube is `left:365 top:19 602×495` — do not move it; it is traced from the photo.
- Desktop content lives in a 630×464 box scaled by `--desktop-scale` (0.934). If you change that value, change `DESKTOP_SCALE` in js/app.js too.
- Tool data belongs in `js/tools.json`, never hard-coded in HTML.
- Keep the desktop chrome generic 1990s: our own pixel icons, 16-colour palette, no vendor logos/icons/wordmarks.
- All clickable things must be real `<a>`/`<button>` elements with labels. The phone handheld's group windows are generated from tools.json in `build()`; never hand-edit them.
- Real links: tools are on calgaryvisioncentre.com (two on drburke-droid.github.io); blog `/blog`; booking `/book-an-appointment`; lab index `/lab`.

## Testing
- Serve the folder, open in Chrome, and check: click an icon → tool opens in an iframe window; right-click → Properties; drag/resize/min/max/close on every window; Window → Cascade/Tile/Arrange/Reopen; power button off → on boot sequence; Help → Degauss / screensaver / scanlines; Alt-F/W/H; typing `20/20` and `dgs`.
- Check Safari for the barrel filter (`#barrel`); if it breaks, guard with `@supports` or a UA check and set `filter:none` on `.tube`.
- Resize under 700 px: the handheld must appear with all 13 icons; its screen is `left:40 top:38 250×457` in a 332×625 scene — do not move it.
- `design-canvas-sources/` is reference only — the `.dc.html` files need the Claude Design runtime and will not run here.
