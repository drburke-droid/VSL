# Visual Systems Lab — retro CRT front page

A replacement for https://calgaryvisioncentre.com/lab: a photographed 1993 CRT whose
tube shows a working 16-colour "Vision Lab Manager" desktop. Each of the 13 lab tools
is a program icon; windows drag, resize, minimize, maximize and close; the power
button, screensaver and degauss are easter eggs.

Plain HTML/CSS/JS — no build step, no dependencies.

## Run it

```bash
cd vsl-retro
python3 -m http.server 8000      # or: npx serve .
# open http://localhost:8000
```

A server is needed (not `file://`) because `js/tools.json` is fetched and the
SVG displacement map is loaded by URL.

## Layout

```
index.html                  stage markup: photo, screen, desktop chrome, dialogs, hotspots, phone fallback
css/style.css               all styling; stage coordinates are in 1280×720 px
js/app.js                   window manager, menus, power/boot, screensaver, degauss, keyboard eggs
js/tools.json               the 13 tools (title, URL, group, pixel icon) + 4 group windows + site links
assets/monitor.png          the photo with the tube blanked to #008080 (1672×941)
assets/monitor-original.png the photo as supplied (DOS text still on screen)
assets/barrel.png           602×495 displacement map (R = x, G = y, radial r³) for the barrel filter
assets/cvc-logo.png         the CVC mark, white on transparent, used by the screensaver
design-canvas-sources/      the Claude Design artboards this was built from (.dc.html) — reference only
```

## How the screen is put together

- The stage is a fixed 1280×720 scene scaled to the viewport (`fit()` in app.js).
- The tube was traced from the photo: `left:365px; top:19px; 602×495`. The rounded
  corners are the real ones from the photo's fill.
- Inside `.tube`, a 630×464 desktop is scaled by 0.934 (`--desktop-scale`). Pointer
  deltas are divided by `stageScale × 0.934` so dragging tracks the cursor.
- `.tube` has `filter: url(#barrel)` — an `feDisplacementMap` fed by `assets/barrel.png`.
  `scale="22"` in index.html sets the curvature strength. Scanlines and the RGB
  shadow-mask sit inside `.tube` so they curve too.
- Six overlay layers (`.fx.*`) build the glass: beam falloff, bezel shadow, glass
  edge hairline, mirrored room reflection, specular, dust.
- Photo hotspots: `.masthead` (newspaper → /blog), `.pda` (→ /book-an-appointment),
  `.power` (bezel button, with `.led`).

## Interactions

| Action | How |
|---|---|
| Run a tool | click its icon: the page opens as a low-res preview in a window on the tube (iframe). A moment later a **See it in high res** dialog pops up bottom-right with a button to the real site. Ctrl/⌘-click, or the ↗ button on the window, also opens it in a new tab |
| Tool properties | right-click an icon: description, URL, Open full size (default) / Preview here |
| Move / resize | drag title bar / drag bottom-right grip |
| Minimize / maximize / close | _ □ × at the right of each title bar; double-click title bar = maximize |
| Cascade / Tile / Arrange / Reopen | Window menu |
| Clock | live in the status line; the boot sequence prints the real date and time |
| Power off / on | bezel button below the tube, or File → Exit; boot sequence on power-on |
| Screensaver | 45 s idle, or Help → Preview screensaver; click or any key to wake. The CVC logo bounces around a black screen, changing colour on each bounce; a dead-on corner hit shatters it into pixels |
| Degauss | Help → Degauss, or type `dgs` |
| Scanlines | Help → Toggle scanlines, or type `20/20` |
| Menus by keyboard | Alt-F, Alt-W, Alt-H; Esc closes |

The screensaver sits above the glass overlay layers (a sibling of `.tube` inside `.screen`)
so the whole tube goes black; it is a 602×495 canvas driven by `svFrame()` in app.js.

Under 700 px wide the stage is hidden and a plain list of the tools is shown instead
(`nav.fallback`). Screen readers get that list too.

## Editing the tools

Edit `js/tools.json`. Each tool: `id`, `title` (tooltip + fallback list), `label`
(icon caption, `\n` for a line break), `href`, `group` (one of the group ids), `desc`
(one sentence for the Properties dialog), `icon`
(a 32×32 SVG string; keep `shape-rendering="crispEdges"` and stick to the 16-colour
palette for the look). Groups carry their home position/size in desktop px.

## Known caveats

- The `feImage`-driven displacement is solid in Chrome/Edge; Safari has rendered it
  inconsistently in the past. Test there; fall back to `filter:none` on `.tube` if needed.
- The photo is 1672×941 upscaled to 1280-wide stage at large viewports; a higher-res
  original would sharpen the bezel on 4K displays.
- The desktop is deliberately generic 1990s chrome with original pixel icons — keep it
  that way (no vendor logos, icons or wordmarks).

## Ideas not yet built

- Per-tool OG/share images (see `design-canvas-sources/ShareCard.dc.html`).
- "Start with a symptom" entry point for patients.
- Mobile: a full-bleed desktop without the monitor instead of the plain list.
