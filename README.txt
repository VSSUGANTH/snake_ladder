Snakes & Ladders Arena — PWA

Contents:
- index.html, style.css, app.js (game)
- Procedural background music: assets/bgm.wav
- Offline-capable: manifest.json + sw.js
- Icons: assets/icon-192.png, assets/icon-512.png
- Features: snake bites (obstacles), ladders, power-ups (extra move, shield, speed boost), simple animation, keyboard/tap ready.

Deployment:
- Unzip and upload to any static host (GitHub Pages, Netlify, Vercel).
- Service worker will cache resources for offline play. Browsers may block autoplay audio: use Toggle Music if audio doesn't start.

Notes:
- Power-ups are randomly placed each new game; shields protect from one snake bite; speed boost lets you move faster for the next move; extra move triggers an immediate extra roll.
- This project uses generated audio and icons only — no copyrighted content included.