# VisitorFlow — Installation Guide

A Progressive Web App (PWA) visitor sign-in system. No app store needed.
Works on iPad, iPhone, Android, Windows, and Mac.

---

## Hosting (required for install)

The app must be served over HTTPS. Options:

### Option A — GitHub Pages (free, 5 min setup)
1. Create a free account at github.com
2. Create a new public repository (e.g. `visitorflow`)
3. Upload all 3 files: `index.html`, `manifest.json`, `sw.js`
4. Go to Settings → Pages → Source: main branch → Save
5. Your URL: `https://yourusername.github.io/visitorflow`

### Option B — Netlify (free, drag & drop)
1. Go to netlify.com → sign up free
2. Drag the entire folder onto the deploy area
3. Done — you get a live HTTPS URL instantly

### Option C — Your own web server
Upload all 3 files to any HTTPS-enabled server.
Serve with correct MIME types (standard Apache/Nginx defaults work).

---

## Installing on devices

### iPad / iPhone (Safari required)
1. Open the app URL in Safari
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add" — the app appears on your home screen
5. Launch it like a native app (full screen, no browser chrome)

### Android (Chrome)
1. Open the app URL in Chrome
2. Tap the ⋮ menu → "Add to Home Screen" or "Install app"
3. Tap Install — appears in your app drawer

### Windows / Mac (Chrome or Edge)
1. Open the app URL
2. Look for the install icon (⊕) in the address bar
3. Click "Install VisitorFlow"
4. Opens as a standalone desktop app

### Multiple iPads / devices
Simply open the same URL on each device and follow the install steps above.
All devices use local storage independently — for shared data,
you'd integrate a backend (see below).

---

## Features
- 4-step visitor sign-in (details, photo/ID, agreement, badge)
- Live dashboard with on-site visitor count
- One-tap sign-out
- Full visitor log with search and CSV export
- Printable visitor badge
- Works offline (data stored locally on device)
- Dark mode support

---

## Data storage
Visitor records are stored in the device's localStorage.
Data persists across app launches but stays on that device.

For multi-device shared data, integrate a backend such as:
- Firebase Firestore (free tier, real-time sync)
- Supabase (open source, Postgres-based)
- Airtable API

---

## Files
- `index.html` — the entire app
- `manifest.json` — PWA install configuration  
- `sw.js` — service worker for offline support
