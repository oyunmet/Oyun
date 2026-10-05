---
name: Expo preview in Replit
description: Expo web workflow startup issues caused by desktop browser launching and React Native DevTools shared libraries.
---

Set `BROWSER=none` on Expo web workflows so the CLI does not try to launch a desktop browser. Missing shared libraries in React Native DevTools can be optional if Metro still serves the app. If required local images are missing from an early preview capture, verify their `onLoad`/`onError` events and take another capture before changing the layout.

**Why:** Expo attempted to use `xdg-open` in the headless workspace and its debugger shell lacked system libraries, which made a working Metro server look failed. Large bundled PNGs also did not appear in the first preview capture, but loaded in a later capture.

**How to apply:** When configuring an Expo web workflow, disable browser auto-open first. Check the actual web bundle and preview separately from optional DevTools startup logs; use image load events to distinguish delayed assets from layout defects.