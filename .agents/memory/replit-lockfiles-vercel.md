---
name: Replit package locks on Vercel
description: Why npm installs from Replit-generated lockfiles can fail on Vercel.
---

Replit's npm lockfile can contain package URLs under `package-firewall.replit.internal`, which external hosts such as Vercel cannot resolve. This project also has a pnpm lockfile with integrity-based package entries that can be installed externally.

**Why:** Vercel is outside Replit's network and cannot access Replit's internal package firewall host.

**How to apply:** Before changing a deployment's install command, inspect the lockfile's `resolved` URLs. Use the package manager and lockfile intended for the external environment, and keep the manifest and lockfile in sync.
