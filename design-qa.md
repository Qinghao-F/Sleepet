# Design QA — Preferences clock

## Reference and implementation

- Reference: the user-provided close-up clock screenshot in this conversation (1002 × 968).
- Implementation: `implementation-clock.png`, captured from `http://127.0.0.1:4173/` at 1400 × 1100.
- Focused comparison: the dial is rendered at 288 × 288 inside the 402 × 874 phone viewport; comparison was made on the normalized dial layer geometry rather than the surrounding browser canvas.

## Comparison result

- Static dial layers: passed. The supplied `dial-base.png` preserves the pale outer ring, inner face, tick marks, cardinal labels, hour numerals, moon, and sun.
- Active sleep arc: passed. The arc follows the dial perimeter, uses the blue gradient, and updates from bedtime to wake time.
- Endpoint controls: passed. The supplied bedtime crescent and wake-up alarm assets are used inside circular colored handles. The hit area is larger than the visible circle for touch use.
- Alignment: passed. Endpoints rotate around the dial center and stay aligned to the perimeter while dragging.
- Typography and surrounding card: passed for the current Preferences demo viewport. The dial remains legible without covering the schedule summary.

## Interaction verification

- Dragging either endpoint updates the schedule summary above the dial.
- Dragging snaps to 30-minute increments only (for example, 8:00, 8:30, 9:00).
- The time sheet remains available for precise minute-level edits.
- The current implementation was tested by dragging the bedtime endpoint; the accessible label and summary updated to the snapped time.

## Findings

- No blocking visual or interaction issue found for the requested clock scope.
- Sound, Preview, Privacy & data, Accessibility, and the other deferred menu contents remain outside this pass.

**Result: passed**

## Onboarding QA

- Reference states: Figma nodes `264:808` (splash), `264:559` (Account), `264:523` (Choose), `264:501` (Personalise), `264:481` (Creating), and `264:471` (Meet).
- Implementation: the local browser prototype at `http://127.0.0.1:4173/`, with the latest Figma exports stored under `assets/onboarding/latest/` and all UI text using `PingFang SC`.
- Verified states: splash-to-account transition, account form, companion radio selection, personalisation fields and photo-picker state, creating transition with staggered loading dots, Meet confirmation/change, Home, and Home → Me → Preferences.
- Motion checks: splash runs once for 4 seconds on one shared timeline; the supplied Symbol and seven letter SVGs use the Figma translate/scale/height tracks; the Account group enters from 681px during the final 22.5% of the timeline; creating dots and puppy pulse on an 800 ms loop; `prefers-reduced-motion` disables the loops and shortens the splash.
- Interaction checks: empty account validation, account-to-companion transition, 1.6-second creating transition, dynamic pet name across Meet/Home, direct Log in to Home, and navigation back to Preferences.
- Visual checks: each state stays inside the 402 × 874 phone frame; the latest Figma export is used as the visual layer while inputs/buttons remain live above it; the existing clock and Preferences sheets remain available.
- Scope note: this is a local demo without real authentication, persistence, or backend calls. Deferred Sound, Preview, Privacy & data, Accessibility, and other support destinations remain intentionally out of scope.

final result: passed
