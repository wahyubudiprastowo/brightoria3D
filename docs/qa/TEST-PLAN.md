# Patch 02 Test Plan

## Required commands
```powershell
npm install
npm run typecheck
npm run build
npm run dev
```

## Functional checks
- Six islands render.
- Drag and pinch/scroll operate camera.
- Selecting an island opens the correct mission sheet.
- Demo completion adds exactly 50 XP once per selected introduction.
- Refresh retains progress.
- Parent mode renders three service paths.
- No background audio starts.

## Viewports
- 390x844 Android portrait.
- 800x1280 Android tablet.
- 1366x768 laptop.
- 1920x1080 desktop.

## Performance observation
Record FPS, first load time, memory after five minutes, context loss, orientation change, and device heat. Do not approve a hero asset solely from desktop performance.
