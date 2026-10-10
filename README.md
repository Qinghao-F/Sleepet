# Sleepet interactive prototype

live demo: https://qinghao-f.github.io/Sleepet/

Open `index.html` in a browser. The first screen is the local onboarding flow: animated splash → account → companion choice → personalisation → creating state → Meet → Home. Use the Me icon on Home to return to Preferences.

The updated onboarding frames are based on Figma nodes `264:808`, `264:559`, `264:523`, `264:501`, `264:481`, and `264:471`. All local UI text uses the `PingFang SC` font stack. The splash uses the supplied Symbol/letter SVGs under `assets/onboarding/splash/`, keeps the Account group on the same 4-second timeline, and includes a reduced-motion fallback. `sleepet_1.svg` and `sleepet_2.svg` are retained as the start/end wordmark spacing references.

The demo covers the Preferences page, schedule bottom sheet, pet-selection bottom sheet, scrolling, slider state, and save/cancel/backdrop interactions. From Home, choose “Ready to sleep” for the sleep monitor and wake-up flow; the morning routine and tomorrow-planning screens then return to Home.

The 24-hour dial uses the supplied `assets/clock/` layers. Drag either endpoint to adjust bedtime or wake-up time; the endpoint snaps to 30-minute increments and updates the summary above the dial. The time sheet remains available for precise minute-level edits.

Sound playback, Preview, Privacy & data, Accessibility, and other support destinations are intentionally left out for this iteration.

This is a front-end prototype only: account values and uploaded photos stay in the current browser session and are not sent to a backend.

## Sleep reports

The moon icon on Home and Preferences opens the weekly report. Tap any day/column for its daily report, use the arrows to change the displayed period, or select a date from the period pill. The daily back button returns to the same week. The wake-up screen's “Check last night’s sleep data” opens the fixed daily example and can return to morning feedback.

Reports always display fixed Figma presentation data, independent of stored sessions, sleep timers, preferences, and the demo query parameter. Weekly values: 3/7 nights, 4/7 mornings, average bedtime 12:21 am, average sleep 7h 45m. The seven bar heights are fixed at 87/99/77/87/87/99/99 px; the average reference is fixed 47.5 px below the plot top. Daily values: 8h 10m, 11:50 pm–8:00 am, Deep 1h 50m, Light 4h 20m, REM 2h 00m. The initial date range is September 7–13, 2026; changing dates changes the labels, not the example values.

The top Home and TEST + buttons have been removed. The bottom navigation remains available. Existing browser history is not deleted or read by the fixed report view. Watch/Apple Health integration is explanatory UI, not a live connection.

Reports use Figma weekly frame 53:378 and daily-without-watch frame 53:324, with original artwork in assets/reports/. Motion follows the Unity 480 ms entrance, staggered cards and growing chart columns, with a reduced-motion fallback.

Open index.html?preview=weekly or index.html?preview=daily for direct previews. No build or package installation is required.
