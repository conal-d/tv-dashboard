# Xbox dashboard QA report

## Current pass

The current implementation replaces the Verdant home-screen concept with the original Xbox dashboard’s four main choices: Memory, Music, Xbox Live, and Settings. It removes the modern clock/header, orb caption, energy connector, five-item right-side menu, and accent/theme switching. The orb now carries an Xbox mark, and the menu uses four green blades with a muted yellow-green focus state. System information is available from Settings. Apps, ambient mode, screen test, and quality controls remain available inside the dashboard.

The supplied video is the main reference: [Original Xbox Startup and Dashboard](https://www.youtube.com/watch?v=nm6XchTak40). One historical distinction matters: the classic 2001 Xbox dashboard uses a green, four-choice menu; the well-known four differently colored blades are from the Xbox 360 dashboard. This pass follows the 2001 layout and labels rather than mixing the two designs.

## Ranked findings

1. **High — Previous home screen still looked like Verdant.** The saved screenshots from the earlier pass show a large text-labeled orb, five oversized modern menu cards, a prominent clock, controller hints, and a synthetic grid/particle treatment. Those shots were inspected and confirmed that the earlier visual direction did not meet the requested target. The current code replaces those elements; an after screenshot review is pending.
2. **High — Current visual QA could not launch Playwright Chromium here.** The latest `npm run qa:screenshots` attempt exits before opening the dashboard. Chromium reports a macOS `MachPortRendezvousServer` permission error. The existing `qa/screenshots/` images therefore remain before-rebuild captures and are not evidence for the current HTML. The new capture script is ready to run in desktop Terminal.
3. **High — Current performance is unmeasured.** `qa/performance-before-rebuild.json` contains the previous design’s measurements (for example, 132 ms average and 167 ms 1%-low frame time at 1080p/High). Playwright used Chromium’s software WebGL path, so those results are not representative of the LG TV or the new design. Capture fresh numbers before making shader or particle cuts.
4. **Medium — Audio is an approximation.** Startup swell, interface cues, and ambient hum are generated with Web Audio. They have not been compared by listening against the reference video, so their timing, pitch, and texture still need a human audio review. Microsoft’s [Xbox Wire dashboard audio post](https://news.xbox.com/en-us/2012/11/15/audio-of-the-original-xbox-dashboard/) provides an additional reference for a transition sound.
5. **Medium — Target TV browser behavior is not verified on hardware.** LG’s [Web API and Web Engine table](https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine) lists Chromium 68 for webOS 5, Chromium 79 for webOS 6, and Chromium 87 for webOS 22. The Back key mapping remains 461; unknown keys are ignored. A TV test is still needed to confirm the remote and rendering behavior.
6. **Pending — Title-safe bounds, contrast over rendered pixels, orb mark proportions, blade focus readability, background banding, and ring aliasing.** These require after screenshots at both target sizes. The current home uses TV-safe padding and a distinct focus outline, but I have not marked those checks complete without a rendered capture.

## After-capture procedure

Run `npm run qa:screenshots` after installing the project dependencies and Playwright Chromium. The script captures the start gate, boot sequence, each of the four focused blades, first and last focus on Memory/Music/Xbox Live/Settings/System, ambient and screen-test overlays, the frame-time overlay, and High/Balanced/Low quality at 1920×1080 and 1280×720. It writes new images to `qa/screenshots/` and fresh measurements to `qa/performance.json`.

Then inspect the new captures before marking contrast, clipping, safe-area, or visual-artifact findings resolved. The older screenshots remain available as before-rebuild examples. Their old frame-time samples are kept separately in `qa/performance-before-rebuild.json`.

## Checks completed here

- `node --check qa/capture.mjs` passed.
- The dashboard’s inline JavaScript passed `node --check` after extraction.
- The Playwright capture attempt was made and failed before navigation because Chromium could not start under the current macOS process restrictions.
