# Sleepet interactive prototype

live demo: https://qinghao-f.github.io/Sleepet/

Open `index.html` in a browser. The first screen is the local onboarding flow: animated splash → account → companion choice → personalisation → creating state → Meet → Home. Use the Me icon on Home to return to Preferences.

The updated onboarding frames are based on Figma nodes `264:808`, `264:559`, `264:523`, `264:501`, `264:481`, and `264:471`. All local UI text uses the `PingFang SC` font stack. The splash uses the supplied Symbol/letter SVGs under `assets/onboarding/splash/`, keeps the Account group on the same 4-second timeline, and includes a reduced-motion fallback. `sleepet_1.svg` and `sleepet_2.svg` are retained as the start/end wordmark spacing references.

The demo covers the Preferences page, schedule bottom sheet, pet-selection bottom sheet, scrolling, slider state, and save/cancel/backdrop interactions. From Home, choose “Ready to sleep” for the sleep monitor and wake-up flow; the morning routine and tomorrow-planning screens then return to Home.

The 24-hour dial uses the supplied `assets/clock/` layers. Drag either endpoint to adjust bedtime or wake-up time; the endpoint snaps to 30-minute increments and updates the summary above the dial. The time sheet remains available for precise minute-level edits.

Sound playback, Preview, Privacy & data, Accessibility, and other support destinations are intentionally left out for this iteration.

This is a front-end prototype only: account values and uploaded photos stay in the current browser session and are not sent to a backend.

## Sleep reports

The moon icon on Home and Preferences opens the weekly report. Tap any day/column for its daily report, use the arrows to change the period, or select a date from the period pill. The back button returns to the same week. The wake-up screen's “Check last night’s sleep data” opens the latest recorded session and returns to morning feedback.

Use **TEST +** to add the Unity prototype's seven fixed demo nights for the selected week. Demo records are labelled; a real session takes precedence on the same day. App sessions are saved locally under `sleepet-report-history-v1` when “Slide to end sleep” completes. App timing does not measure sleep stages; only the labelled demo records show stages. Watch/Apple Health integration is explanatory UI, not a live connection.

Reports use the Figma weekly frame `53:378` and daily-without-watch frame `53:324`. Original Figma artwork is stored in `assets/reports/`. The CSS follows the Unity UI motion's 480 ms entrance with cubic-bezier(.22,.7,.22,1), staggered cards and growing chart columns, with a reduced-motion fallback.

Direct previews: `index.html?preview=weekly`, `index.html?preview=daily`, and `index.html?preview=weekly&demo=1` (in-memory sample preview). A normal first visit has an empty report until a session or TEST + data is added. No package installation/build step is needed.

Run calculation checks with `node --test report-model.test.cjs`. Browser checks cover weekly → daily → back, date selection, empty records, TEST +, persisted real sessions, Home/Me navigation, the health information dialog, and mobile scrolling.
