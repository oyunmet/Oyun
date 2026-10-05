---
name: Saraya mobile controls
description: Required multi-touch and text-selection behavior for Saraya's mobile web controls.
---

Gameplay controls on mobile web must allow a direction press and jump press at the same time. Long-pressing a control must not select its label or open a copy/paste menu.

**Why:** The user repeated this requirement after the first control update still allowed iPhone Safari to treat the controls as selectable text.

**How to apply:** Preserve independent touch tracking for each active finger and test the controls on mobile Safari when possible. Prevent browser selection and callouts on the control surface.
