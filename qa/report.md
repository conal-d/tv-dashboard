# QA report

## Current pass

The source review found several issues in the original Verdant layout relative to the new Xbox-dashboard direction. The local copy now has a green wireframe shader treatment, an orb positioned on the left of the menu, geometric green menu blades, a brighter focus outline, and larger TV-distance text. The original five dashboard functions and synthesized sound system remain available.

### Ranked findings

1. **High — the previous orb position conflicted with the menu layout.** The HTML placed the menu on the left while the 3D orb rendered to the right, allowing the orb and menu to compete for the same space. The visual layout and orb target now place them on opposite sides. This needs screenshot confirmation at both target resolutions.
2. **High — core content began outside the 90% title-safe area.** At 1080p the former app padding put the header and footer above the 5% safe margin. The app now uses padding beyond that margin. The screen-test overlay deliberately draws an outer frame to the display edge for overscan diagnosis.
3. **High — focus was not clear enough for distant viewing.** Home and sub-screen focus now have a bright lime outline and stronger glow. Confirm the result in a room-distance visual review.
4. **Medium — supporting labels were smaller than the 24px target.** Date, back/crumb labels, descriptions, tile subtitles, settings details, hints, and overlay instructions now use at least 24px in the main layout.
5. **Medium — legacy webOS syntax needed cleanup.** The JavaScript `??` operator and `Object.fromEntries` call were removed. CSS `inset`, `aspect-ratio`, `backdrop-filter`, and `min()` usage were removed; fixed sizing fallbacks cover CSS `clamp()`, which is not supported on Chromium 68. Flex gaps were replaced with margins where older engines need them.
6. **Medium — unknown remote keys could trigger an overlay return.** The global listener now ignores unrecognized keys. The existing LG Back mapping remains `keyCode === 461`; arrows, select, and recognized Back events are the only keyboard events prevented from reaching browser defaults.
7. **Unverified — rendered contrast, text clipping, orbital aliasing, shader banding, and flicker.** These require screenshots from a running browser. They were not visually scored in this pass.

## Browser and performance status

LG lists webOS TV 5.x as Chromium 68, webOS TV 6.x as Chromium 79, and webOS TV 22 as Chromium 87 in its [Web API and Web Engine table](https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine). The app has not been executed on those TV engines.

The F-key overlay now reports average frame time and p99 frame time (the slowest 1%, equivalent to a 1%-low frame-time view). The Playwright script is configured to capture High, Balanced, and Low on Home and Apps at both sizes, with five seconds of samples per state. No FPS figures are reported here because Chromium did not launch in this sandbox; the attempted local-file browser open was also rejected by the browser's local-file URL policy. No screenshots or `performance.json` were produced, so before/after pairs and visual contrast checks remain pending.

If High misses 60fps on modest hardware, the code provides specific first cuts to measure: reduce renderer pixel ratio from 1.5 to 1.0, noise octaves from 5 to 3, field particles from 2,400 to about 1,000, and sphere segments from 96 to 64. The current run produced no hardware measurements to justify applying those cuts.

## Verification performed

- `node --check` passed for the dashboard's inline JavaScript and the Playwright capture script.
- Static scan found none of the requested `??`, optional chaining, `Object.fromEntries`, `backdrop-filter`, `aspect-ratio`, CSS `inset`, or CSS `min()` usages.
- Playwright and its Chromium build are installed as local development tooling; browser launch failed with a macOS sandbox Mach-port permission error.
- Screenshots, WCAG ratios against rendered pixels, frame-time measurements, and TV-engine behavior are still unverified.
