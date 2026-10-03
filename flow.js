(() => {
  const sleepScreen = document.querySelector("[data-screen=\"sleep-monitor\"]");
  const wakeScreen = document.querySelector("[data-screen=\"wake-medium\"]");
  if (!sleepScreen || !wakeScreen) return;
  const wakeVideo = document.getElementById("wakeSceneVideo");
  wakeVideo.defaultPlaybackRate = 0.75;
  wakeVideo.playbackRate = 0.75;
  const onboardingLayer = document.getElementById("onboardingLayer");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let wasOnWakeScreen = false;
  const syncWakeVideo = () => {
    const onWakeScreen = !wakeScreen.hidden && !onboardingLayer.classList.contains("is-hidden");
    if (onWakeScreen && !wasOnWakeScreen) {
      try { wakeVideo.currentTime = 0; } catch {}
    }
    wasOnWakeScreen = onWakeScreen;
    if (!onWakeScreen || reducedMotion.matches) {
      wakeVideo.pause();
      return;
    }
    wakeVideo.playbackRate = 0.75;
    const playback = wakeVideo.play();
    if (playback?.catch) playback.catch(() => {});
  };
  new MutationObserver(syncWakeVideo).observe(wakeScreen, { attributes: true, attributeFilter: ["hidden"] });
  new MutationObserver(syncWakeVideo).observe(onboardingLayer, { attributes: true, attributeFilter: ["class"] });
  wakeVideo.addEventListener("canplay", syncWakeVideo);
  document.addEventListener("visibilitychange", syncWakeVideo);
  reducedMotion.addEventListener?.("change", syncWakeVideo);
  window.addEventListener("pagehide", () => wakeVideo.pause());
  window.addEventListener("pageshow", syncWakeVideo);
  document.getElementById("startSleepButton").addEventListener("click", () => showOnboardingScreen("sleep-monitor"));

  const modeToggle = document.getElementById("sleepModeToggle");
  const modeMenu = document.getElementById("sleepModeMenu");
  const modeLabel = document.getElementById("sleepModeLabel");
  const durationControl = document.getElementById("sleepStopDuration");
  const durationLabels = [document.getElementById("sleepStopDurationLabel"), document.getElementById("sleepStopDurationValue")];
  let stopMinutes = 60;
  const formatDuration = () => stopMinutes % 60 === 0 ? String(stopMinutes / 60) + "h" : String(Math.floor(stopMinutes / 60)) + "h " + String(stopMinutes % 60) + "m";
  const closeModeMenu = () => { modeMenu.hidden = true; modeToggle.setAttribute("aria-expanded", "false"); };
  modeToggle.addEventListener("click", () => { modeMenu.hidden = !modeMenu.hidden; modeToggle.setAttribute("aria-expanded", String(!modeMenu.hidden)); });
  modeMenu.querySelectorAll("[data-sleep-mode]").forEach((button) => button.addEventListener("click", () => {
    const mode = button.dataset.sleepMode;
    modeLabel.textContent = mode === "Stop after" ? "Stop after " + formatDuration() : mode;
    durationControl.hidden = mode !== "Stop after";
    if (mode !== "Stop after") closeModeMenu();
  }));
  durationControl.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    stopMinutes = Math.max(30, Math.min(240, stopMinutes + Number(button.dataset.stopMinutes)));
    durationLabels.forEach((label) => { label.textContent = formatDuration(); });
    modeLabel.textContent = "Stop after " + formatDuration();
  }));
  document.addEventListener("pointerdown", (event) => { if (!modeMenu.hidden && !event.target.closest(".sleep-mode-wrap")) closeModeMenu(); });

  const musicOptions = ["Ocean", "Rain", "Forest"];
  let musicIndex = 0;
  document.getElementById("sleepMusicPicker").addEventListener("click", () => {
    musicIndex = (musicIndex + 1) % musicOptions.length;
    document.getElementById("sleepMusicLabel").textContent = musicOptions[musicIndex];
  });
  let alarmMinutes = 8 * 60;
  const renderAlarm = () => {
    const minutes = ((alarmMinutes % 1440) + 1440) % 1440;
    const hour24 = Math.floor(minutes / 60);
    document.getElementById("sleepAlarmTime").textContent = String(hour24 % 12 || 12) + ":" + String(minutes % 60).padStart(2, "0") + (hour24 >= 12 ? " PM" : " AM");
  };
  document.getElementById("sleepAlarmEarlier").addEventListener("click", () => { alarmMinutes -= 30; renderAlarm(); });
  document.getElementById("sleepAlarmLater").addEventListener("click", () => { alarmMinutes += 30; renderAlarm(); });

  const slide = document.getElementById("sleepSlide");
  const travel = 204;
  let progress = 0, activePointer = null, startX = 0, startProgress = 0, slideCompleting = false;
  const setProgress = (value) => {
    progress = Math.min(1, Math.max(0, value));
    slide.style.setProperty("--slide-distance", String(Math.round(progress * travel)) + "px");
    slide.style.setProperty("--slide-fill-width", String(Math.round(64 + progress * 217)) + "px");
    slide.style.setProperty("--slide-fill-opacity", String(.05 + progress * .95));
    slide.style.setProperty("--slide-halo-opacity", String(.22 + progress * .72));
    slide.style.setProperty("--slide-text-opacity", String(1 - progress));
    slide.classList.toggle("is-active", progress > .02);
    slide.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
    slide.setAttribute("aria-valuetext", progress >= .82 ? "Release to end sleep" : "Slide right to end sleep");
  };
  const finishSlide = () => {
    if (progress >= .82) {
      slideCompleting = true;
      slide.classList.add("is-complete");
      setProgress(1);
      window.setTimeout(() => {
        showOnboardingScreen("wake-medium");
        window.setTimeout(() => {
          setProgress(0);
          slide.classList.remove("is-complete");
          slideCompleting = false;
        }, 300);
      }, 420);
    } else setProgress(0);
  };
  slide.addEventListener("pointerdown", (event) => {
    if (slideCompleting || event.button !== 0) return;
    activePointer = event.pointerId; startX = event.clientX; startProgress = progress;
    slide.setPointerCapture(event.pointerId); slide.classList.add("is-dragging"); event.preventDefault();
  });
  slide.addEventListener("pointermove", (event) => {
    if (activePointer === event.pointerId) setProgress(startProgress + (event.clientX - startX) / travel);
  });
  slide.addEventListener("pointerup", (event) => {
    if (activePointer !== event.pointerId) return;
    activePointer = null; slide.classList.remove("is-dragging");
    if (slide.hasPointerCapture(event.pointerId)) slide.releasePointerCapture(event.pointerId);
    finishSlide();
  });
  slide.addEventListener("pointercancel", () => { activePointer = null; slide.classList.remove("is-dragging"); setProgress(0); });
  slide.addEventListener("keydown", (event) => {
    if (slideCompleting) return;
    if (event.key === "ArrowRight") { setProgress(progress + .2); event.preventDefault(); }
    if (event.key === "ArrowLeft") { setProgress(progress - .2); event.preventDefault(); }
    if (event.key === "Home") { setProgress(0); event.preventDefault(); }
    if (event.key === "End") { setProgress(1); event.preventDefault(); }
    if ((event.key === "Enter" || event.key === " ") && progress >= .82) { finishSlide(); event.preventDefault(); }
  });

  const preview = new URLSearchParams(window.location.search).get("preview");
  if (preview === "sleep-monitor") showOnboardingScreen("sleep-monitor");
  if (preview === "wake-medium") showOnboardingScreen("wake-medium");
  syncWakeVideo();
})();
