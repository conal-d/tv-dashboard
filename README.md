# Xbox TV Dashboard

The dashboard remains a single self-contained HTML file. The current pass keeps Verdant's Apps, Media, Store, Settings, and System functions while applying the green phosphor, orb, and high-contrast controller focus language of the original Xbox dashboard.

## Run

Open `verdant-dashboard.html` in a browser. The Three.js renderer and Google Fonts continue to load from the existing CDNs.

Press **F** to show or hide the frame-time overlay. It reports average frame time and the 99th-percentile frame time (the slowest 1% of frames) for each quality and screen combination observed in the current session.

## Visual QA

Playwright is a development-only dependency; it is not loaded by the dashboard. Install dependencies and Chromium, then run `npm run qa:screenshots`. The capture script uses keyboard input at 1920×1080 and 1280×720, saves images in `qa/screenshots/`, and records frame-time samples in `qa/performance.json`.

The capture script includes gate, boot, menu focus, sub-screen focus, overlays, theme, accents, and quality states. It measures five seconds per quality and screen state after the matching screenshot.
