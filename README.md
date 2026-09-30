# Sleepet onboarding + Preferences demo

Open `index.html` in a browser. The first screen is the local onboarding flow: account → companion choice → personalisation → creating state → Meet → Home. Use the Me icon on Home to return to Preferences.

To preview Home directly, open `index.html?preview=home`. Mocha's head sways gently while idle; tapping the dog changes its expression for three seconds before it returns to normal. Repeated taps restart the three-second timer.

The demo covers the Preferences page, schedule bottom sheet, pet-selection bottom sheet, scrolling, slider state, and save/cancel/backdrop interactions.

The 24-hour dial uses the supplied `assets/clock/` layers. Drag either endpoint to adjust bedtime or wake-up time; the endpoint snaps to 30-minute increments and updates the summary above the dial. The time sheet remains available for precise minute-level edits.

Sound playback, Preview, Privacy & data, Accessibility, and other support destinations are intentionally left out for this iteration.

This is a front-end prototype only: account values and uploaded photos stay in the current browser session and are not sent to a backend.
