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

- Reference states: the six supplied Figma frames for Account, Companion, Personalise, Creating, Meet, and Home.
- Implementation: the local browser prototype at `http://127.0.0.1:4173/`, using the downloaded Figma SVGs and supplied local imagery under `assets/onboarding/`.
- Verified states: account form, companion radio selection, personalisation fields and photo-picker state, creating transition, Meet confirmation/change, Home, and Home → Me → Preferences.
- Interaction checks: empty account validation, account-to-companion transition, 1.6-second creating transition, dynamic pet name across Meet/Home, direct Log in to Home, and navigation back to Preferences.
- Visual checks: each state stays inside the 402 × 874 phone frame; the Home background and sitting companion are clipped cleanly; the existing clock and Preferences sheets remain available.
- Scope note: this is a local demo without real authentication, persistence, or backend calls. Deferred Sound, Preview, Privacy & data, Accessibility, and other support destinations remain intentionally out of scope.

final result: passed
