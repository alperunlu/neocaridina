# AA-indie review — Karides Çiftliği

Four parallel reviews (gameplay/sim, 3D visuals, UI/UX, audio/perf/native). Severity: P0 = bug or ship-blocker, P1 = big quality gap, P2 = polish.

## Gameplay & simulation (`web/src/sim.js`, modal views)
- **P0** Recommended feeding (`recFood`, 06-ui-state.js) is ~1.4× demand and leftover-food index `wi` scales with tank volume, not colony → following the game's own advice spawns planaria around day 80–90 and kills most babies. Fix: `wi = waste / max(1, dem*24*0.4)`, `recFood = dem*24/20`, show a leftover-food readout.
- **P0** Filter bio capacity doesn't scale with tank volume (`bioCap = F.bio + 0.12`) while shop text promises `vol*5` and breeding goes to `vol*12` → mass ammonia die-offs in big tanks. Fix: `bioCap = F.bio*(0.6+0.4*sc)+0.12`, "filter load %" readout, auto-drop to 1× on first stress warning.
- **P0** New player buying shrimp into the uncycled starter tank loses all of them in ~3 real minutes. Fix: pre-cycled "inherited" starter tank, or prompt "Bakteri ekle ve al?" on uncycled purchase.
- **P0** Failed/version-mismatched load silently starts a new game and overwrites the save in 5 s. Fix: versioned `SIM.migrate`, backup key, never overwrite an unparseable save.
- **P1** Shop→order flipping is profitable at high reputation; breeding unnecessary. Fix: shop-bought shrimp (`bought:true`) don't count for orders.
- **P1** ~60% of early orders ask for unobtainable colors and still cost reputation. Fix: only reachable colors, at most one long-deadline "stretch" order.
- **P1** First 5 minutes have no reward (first birth ~day 22, first sale ~day 51). Fix: start with 2 berried females, scripted first order.
- **P1** No money sink / late game (€10k by year 2, max item €110, 4 tanks). Fix: reputation-gated tank slots (6–8), room/rack upgrades, milestone track.
- **P1** Breeding is shallow; no goals structure. Fix: 10–15 milestone track with rewards in the Defter, grade-tier collection entries.
- **P2** `fulfill` can hand over berried females; swapping filters makes `spend` negative; `sellEq` guard; broke-and-no-shrimp fallback.

## 3D visuals (`03-scene.js`, `04-thumbs.js`)
- **P0** Linear output, no tone mapping → washed-out colours. Fix: sRGB output + texture encoding, ACES filmic, retune lights.
- **P0** Water is invisible (12% opacity box, no surface). Fix: animated surface plane with fresnel/specular, meniscus line, in-tank depth tint.
- **P0** No background panel → you look through the tank at the floor. Fix: inside back panel with deep gradient.
- **P1** Flat lighting: no shadows, night just dims. Fix: static-update shadow map, blob shadows, dark room + glowing lamp-lit tank at night, caustics.
- **P1** Shrimp: ~3 draw calls each (353 draws at 150 shrimp), transparent, beaded look. Fix: swept body, InstancedMesh, vertex-shader tail/legs/antennae, steering, molt shell.
- **P1** Camera fit ignores orbit angle (tablet crop, phone underfill); no inertia; can clip into tank. Fix: corner-projected fit, inertia, eased zoom, clamps.
- **P1** Crude decor (gem moss, cylinder frogbit, stick driftwood, dodecahedron rocks, grey substrate), aliased line glass.
- **P2** Particles, post-processing (vignette/bloom), adaptive pixel ratio, geometry disposal, thumbnails aliased and lit differently.

## UI/UX (`styles.css`, `body.html`, UI JS)
- **P0** Landscape phone unusable. Fix: lock iPhone portrait; breakpoint by short side.
- **P0** Tablet dock overflows (items cut off). Fix: trim, move camera views, hide hotkey digits on touch.
- **P0** Open modal is rebuilt every 0.5 s → taps dropped, focus/VoiceOver reset. Fix: re-render on state-signature change.
- **P1** Category tabs wrap (CSS order bug); tablet modal covers HUD; Turkish suffix bugs ("Tank 2'e"); no thousands separator and mixed decimal points; first run stuck paused if help closed with X; touch targets < 44pt; destructive sells with no undo; dark-mode contrast on amber; VoiceOver basics.
- **P2** Web-page tells (text selection, callouts, double-tap zoom, sticky hover), minimal juice (no press states, money tween, celebrations), toast stacking, gear vs sun icon.

## Audio, feel, performance, native wrapper
- **P0** WebView content-process crash → blank screen; naive reload would restore the stale mount-time save. Fix: latest-save ref, remount on termination.
- **P1** Background save never fires (`document.hidden` false); context loss unhandled; frame loop renders full speed when paused/covered and saves every 5 s even if unchanged; per-frame garbage (`tankSig`); audio session stops user's music.
- **P2** Procedural audio mixer + ambient + music, haptics bridge, splash hidden too early, privacy manifest, iPad multitasking, viewport zoom lock.

## Implementation split
| Track | Owns |
|---|---|
| Gameplay | `sim.js`, `06-ui-state.js`, `07-modal-views.js`, `08-modal-actions.js` |
| Visuals | `03-scene.js`, `04-thumbs.js` |
| UI shell | `styles.css`, `body.html`, `head.html`, `05-icons.js`, `09-dock.js`, `10-interaction.js`, `11-hud.js` |
| Platform | `App.js`, `app.json`, `package.json`, `01-core.js`, `02-sound.js`, `12-boot.js` |

All `web/src/app/*.js` files are concatenated in order into one IIFE, so they share one scope; function declarations hoist across files.

### Cross-track contracts
- Gameplay provides `fmt` (`fmt.money(n)`, `fmt.num(n,digits)`, tr-TR) in `06-ui-state.js`; `SIM.migrate(s)` returning a state with `v:2`; `sellShrimp(ids)` with undo toast in `08-modal-actions.js`.
- UI shell provides `celebrate(title, sub)` and `moneyFloat(delta)` in `11-hud.js`.
- Platform provides `hap(kind)` (`'tap'|'coin'|'good'|'bad'`), `audioGet(key)` / `audioSet(key, v)` (`'master'|'sfx'|'amb'|'mus'`, 0–1, persisted in `S.audio`) in `02-sound.js`; `onContextLost()` in `12-boot.js`; `window.__nc = {save, pause, resume}`. `load()` accepts `v` 1 or 2 and runs `SIM.migrate` when present. Save key stays `neokarides_v1`.
- Every call into another track's function is guarded with `typeof fn === 'function'`.

## Status after implementation
All four tracks are merged. Offline smoke test passes on phone, tablet and landscape; a menu tour (phone, iPad, dark mode) shows no page errors.

Still open:
- Neglect is harsh: with no feeding or water changes the starter colony is gone by about day 30 (about 12 real minutes at 1×). The stress alert fires and drops speed to 1× around day 25.
- No grade-tier collection entries, molt shells or bloom.
- "Önerilen" feed does nothing when food is still on the bottom; it should say so.
- Phone landscape layout (`measure()` in 12-boot.js) is still poor; iPhone is locked to portrait in app.json, so players don't see it.
- Nothing has run on a real iPhone/iPad yet: WebView crash remount, AsyncStorage backups, haptics, audio session, orientation, splash timing and real GPU performance need a TestFlight pass.
