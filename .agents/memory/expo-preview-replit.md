---
name: Expo preview in Replit
description: Expo web workflow startup issues caused by desktop browser launching and React Native DevTools shared libraries.
---

Set `BROWSER=none` on Expo web workflows so the CLI does not try to launch a desktop browser. If React Native DevTools reports missing shared libraries, install the corresponding Nix system packages (glib, nspr, nss); Metro can still serve the app while optional DevTools fails.

**Why:** Expo attempted to use `xdg-open` in the headless workspace and its debugger shell lacked system libraries, which made a working Metro server look failed.

**How to apply:** When configuring an Expo web workflow, disable browser auto-open first. Check the actual web bundle and preview separately from optional DevTools startup logs.