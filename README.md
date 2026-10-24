# Xbox Dashboard for LG TV

A single-file dashboard recreation inspired by the original 2001 Xbox home screen. The home screen uses the classic Memory, Music, Xbox Live, and Settings labels with a green orb and animated phosphor background. TV apps, ambient mode, display test, controller support, and visual-quality settings are adapted inside those sections.

## Run

Open `verdant-dashboard.html` in a modern browser. The Three.js renderer is loaded from the existing CDN. Browser audio begins after the first user action.

Use arrow keys and Enter, the LG remote, or a gamepad. Press **F** to show or hide frame-time statistics.

## Visual QA

Playwright is a development-only dependency. Install dependencies and its Chromium build, then run `npm run qa:screenshots`. The script uses keyboard events at 1920×1080 and 1280×720, saves screenshots to `qa/screenshots/`, and measures five seconds of frame times per quality on the home screen and in Memory.

The current capture run may require a normal desktop Terminal because Chromium launch is restricted in some managed environments. `qa/report.md` records exactly which captures and measurements belong to the current design pass.

## Reference

The supplied [Original Xbox startup and dashboard video](https://www.youtube.com/watch?v=nm6XchTak40) is the visual and motion reference. LG’s [webOS Web API and Web Engine table](https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine) lists the browser engines used by older TV releases.
