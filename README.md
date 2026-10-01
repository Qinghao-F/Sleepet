# Sleepet onboarding + Preferences demo

Open `index.html` in a browser. The first screen is the local onboarding flow: animated splash → account → companion choice → personalisation → creating state → Meet → Home. Use the Me icon on Home to return to Preferences.

The updated onboarding frames are based on Figma nodes `264:808`, `264:559`, `264:523`, `264:501`, `264:481`, and `264:471`. All local UI text uses the `PingFang SC` font stack. The splash uses the supplied Symbol/letter SVGs under `assets/onboarding/splash/`, keeps the Account group on the same 4-second timeline, and includes a reduced-motion fallback. `sleepet_1.svg` and `sleepet_2.svg` are retained as the start/end wordmark spacing references.

The demo covers the Preferences page, schedule bottom sheet, pet-selection bottom sheet, scrolling, slider state, and save/cancel/backdrop interactions.

The 24-hour dial uses the supplied `assets/clock/` layers. Drag either endpoint to adjust bedtime or wake-up time; the endpoint snaps to 30-minute increments and updates the summary above the dial. The time sheet remains available for precise minute-level edits.

Sound playback, Preview, Privacy & data, Accessibility, and other support destinations are intentionally left out for this iteration.

This is a front-end prototype only: account values and uploaded photos stay in the current browser session and are not sent to a backend.
