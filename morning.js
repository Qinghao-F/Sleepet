(() => {
  const byId = (id) => document.getElementById(id);
  const SETTINGS_KEY = "sleepet-morning-settings-v1";
  const RATING_KEY = "sleepet-morning-rating-v1";
  const ratingNames = ["Exhausted", "Tired", "Okay", "Refreshed", "Energetic"];
  const stretchStageMs = 2000; // Four displayed checkpoints over six seconds for the demo.
  const suggestions = ["Go grocery shopping", "Group meeting", "Call dad to celebrate his birthday", "Gym day"];
  const iconFor = (value) => /grocery|shop/i.test(value) ? "./assets/flow/todos-grocery.svg" : /meeting|group/i.test(value) ? "./assets/flow/todos-meeting.svg" : /email|mail/i.test(value) ? "./assets/flow/todos-email.svg" : "";
  const tomorrow = () => {
    const day = new Date();
    day.setDate(day.getDate() + 1);
    return [day.getFullYear(), String(day.getMonth() + 1).padStart(2, "0"), String(day.getDate()).padStart(2, "0")].join("-");
  };
  const defaultSettings = () => ({
    gentle: { water: true, stretch: true, breakfast: false },
    selected: suggestions.slice(0, 2),
    custom: [],
    date: tomorrow()
  });
  const readSavedSettings = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
      if (!stored || !Array.isArray(stored.selected) || !Array.isArray(stored.custom)) return null;
      return {
        gentle: { ...defaultSettings().gentle, ...stored.gentle },
        selected: stored.selected.filter((item) => suggestions.includes(item)),
        custom: stored.custom.filter((item) => typeof item === "string" && item.trim()),
        date: /^\d{4}-\d{2}-\d{2}$/.test(stored.date) ? stored.date : tomorrow()
      };
    } catch {
      return null;
    }
  };
  let savedSettings = readSavedSettings();
  let draftSettings = defaultSettings();
  let stretchTicker = null;
  let stretchDeadline = 0;
  let stretchRemaining = 300;
  let leavingEnd = false;
  const endScreen = document.querySelector('[data-screen="morning-end"]');
  const endVideo = byId("endLandscapeVideo");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const drinkScreen = document.querySelector('[data-screen="morning-drink"]');
  const drinkVideo = byId("drinkMochaVideo");
  drinkVideo.defaultPlaybackRate = 0.75;
  drinkVideo.playbackRate = 0.75;
  const onboardingLayer = byId("onboardingLayer");
  let wasOnDrinkScreen = false;
  const syncDrinkVideo = () => {
    const onDrinkScreen = !drinkScreen.hidden && !onboardingLayer.classList.contains("is-hidden");
    if (onDrinkScreen && !wasOnDrinkScreen) {
      try { drinkVideo.currentTime = 0; } catch {}
    }
    wasOnDrinkScreen = onDrinkScreen;
    if (!onDrinkScreen || reducedMotion.matches) {
      drinkVideo.pause();
      return;
    }
    drinkVideo.playbackRate = 0.75;
    const playback = drinkVideo.play();
    if (playback?.catch) playback.catch(() => {});
  };
  new MutationObserver(syncDrinkVideo).observe(drinkScreen, { attributes: true, attributeFilter: ["hidden"] });
  new MutationObserver(syncDrinkVideo).observe(onboardingLayer, { attributes: true, attributeFilter: ["class"] });
  drinkVideo.addEventListener("canplay", syncDrinkVideo);
  document.addEventListener("visibilitychange", syncDrinkVideo);
  reducedMotion.addEventListener?.("change", syncDrinkVideo);
  window.addEventListener("pagehide", () => drinkVideo.pause());
  window.addEventListener("pageshow", syncDrinkVideo);
  endVideo.defaultPlaybackRate = 0.75;
  const syncEndVideo = (active, restart = false) => {
    if (restart) {
      endVideo.pause();
      endVideo.classList.remove("is-playing");
      try { endVideo.currentTime = 0; } catch {}
    }
    if (!active || reducedMotion.matches) {
      endVideo.pause();
      endVideo.classList.remove("is-playing");
      return;
    }
    if (endVideo.ended) {
      endVideo.classList.add("is-playing");
      return;
    }
    endVideo.playbackRate = 0.75;
    const playback = endVideo.play();
    if (playback?.catch) playback.catch(() => endVideo.classList.remove("is-playing"));
  };
  endVideo.addEventListener("playing", () => {
    if (!endScreen.hidden && !reducedMotion.matches) endVideo.classList.add("is-playing");
  });
  endVideo.addEventListener("error", () => endVideo.classList.remove("is-playing"));
  endVideo.addEventListener("canplay", () => syncEndVideo(!endScreen.hidden));
  document.addEventListener("visibilitychange", () => syncEndVideo(!endScreen.hidden));
  reducedMotion.addEventListener?.("change", () => syncEndVideo(!endScreen.hidden));
  window.addEventListener("pagehide", () => syncEndVideo(false));
  window.addEventListener("pageshow", () => syncEndVideo(!endScreen.hidden));

  const plannedEvents = (settings) => [...settings.selected, ...settings.custom];
  const todosScreen = document.querySelector('[data-screen="morning-todos"]');
  let todosRevealTimer = null;
  const stopStretchTimer = () => {
    if (stretchTicker !== null) window.clearInterval(stretchTicker);
    stretchTicker = null;
  };
  const show = (name) => {
    if (name !== "morning-stretch") stopStretchTimer();
    if (todosRevealTimer !== null) window.clearTimeout(todosRevealTimer);
    todosRevealTimer = null;
    todosScreen.classList.remove("is-entering");
    const enteringEnd = name === "morning-end" && endScreen.hidden;
    showOnboardingScreen(name);
    syncEndVideo(name === "morning-end", enteringEnd);
    if (name === "morning-stretch") startStretchTimer();
    if (name === "morning-todos") {
      savedSettings = readSavedSettings() || savedSettings;
      const events = plannedEvents(savedSettings || defaultSettings());
      renderTodos(events);
      if (!reducedMotion.matches) {
        const visibleCards = Math.min(events.length, 3);
        const petDelay = 320 + visibleCards * 140;
        const footerDelay = petDelay + 130;
        const buttonDelay = footerDelay + 100;
        todosScreen.style.setProperty("--todo-pet-delay", String(petDelay) + "ms");
        todosScreen.style.setProperty("--todo-footer-delay", String(footerDelay) + "ms");
        todosScreen.style.setProperty("--todo-button-delay", String(buttonDelay) + "ms");
        void todosScreen.offsetWidth;
        todosScreen.classList.add("is-entering");
        todosRevealTimer = window.setTimeout(() => {
          todosScreen.classList.remove("is-entering");
          todosRevealTimer = null;
        }, buttonDelay + 550);
      }
    }
  };
  const continueAfterStretch = () => show("morning-todos");
  const continueAfterDrink = () => show("morning-stretch");

  byId("wakeContinue").addEventListener("click", () => show("morning-rating"));
  byId("ratingDone").addEventListener("click", () => {
    try { localStorage.setItem(RATING_KEY, byId("morningRating").value); } catch {}
    show("morning-drink");
  });
  const ratingControl = byId("morningRating");
  const ratingBubble = byId("ratingBubble");
  const bubbleLightByRating = [
    [.6, .02], [.47, .07], [.33, .13], [.18, .2], [.04, .28]
  ];
  const renderRating = () => {
    const index = Number(ratingControl.value);
    byId("ratingCurrent").textContent = ratingNames[index];
    const [shade, light] = bubbleLightByRating[index];
    ratingBubble.style.setProperty("--bubble-shade", String(shade));
    ratingBubble.style.setProperty("--bubble-light", String(light));
    ratingBubble.querySelectorAll("[data-min-rating]").forEach((effect) => {
      effect.style.opacity = index >= Number(effect.dataset.minRating) ? "1" : "0";
    });
    byId("ratingThumb").style.left = String(56 + index * 73 - 21) + "px";
    ratingControl.setAttribute("aria-valuetext", ratingNames[index]);
  };
  ratingControl.addEventListener("input", renderRating);
  renderRating();

  byId("drinkDone").addEventListener("click", continueAfterDrink);
  byId("drinkSkip").addEventListener("click", continueAfterDrink);

  const renderStretchTimer = () => {
    const minutes = Math.floor(stretchRemaining / 60);
    const seconds = stretchRemaining % 60;
    byId("stretchTime").textContent = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    const ratio = stretchRemaining / 300;
    byId("stretchRingProgress").style.setProperty("--progress-angle", String(ratio * 360) + "deg");
    const angle = ratio * Math.PI * 2;
    const x = 204 + Math.sin(angle) * 106.865;
    const y = 269.5 - Math.cos(angle) * 106.865;
    byId("stretchRingDot").style.left = String(x - 12.5) + "px";
    byId("stretchRingDot").style.top = String(y - 12) + "px";
    byId("stretchRingDot").style.opacity = stretchRemaining === 0 ? "0" : "1";
    byId("stretchDone").disabled = stretchRemaining !== 0;
    byId("stretchTimeLabel").textContent = stretchRemaining === 0 ? "WELL DONE" : "STRETCH TIME";
  };
  const tickStretchTimer = () => {
    const stagesLeft = Math.ceil(Math.max(0, stretchDeadline - Date.now()) / stretchStageMs);
    stretchRemaining = stagesLeft * 100;
    renderStretchTimer();
    if (stretchRemaining === 0) stopStretchTimer();
  };
  function startStretchTimer() {
    stopStretchTimer();
    stretchRemaining = 300;
    stretchDeadline = Date.now() + stretchStageMs * 3;
    renderStretchTimer();
    stretchTicker = window.setInterval(tickStretchTimer, 250);
  }
  byId("stretchDone").addEventListener("click", () => {
    if (stretchRemaining === 0) continueAfterStretch();
  });
  byId("stretchSkip").addEventListener("click", continueAfterStretch);
  window.addEventListener("pagehide", stopStretchTimer);

  const renderTodos = (events) => {
    const list = byId("morningTodoList");
    list.replaceChildren();
    events.forEach((eventText, index) => {
      const item = document.createElement("div");
      item.className = "morning-todo-item";
      item.style.setProperty("--todo-delay", String(280 + index * 140) + "ms");
      const marker = document.createElement("img");
      marker.className = "morning-todo-marker";
      marker.src = "./assets/flow/todos-marker.svg";
      marker.alt = "";
      const card = document.createElement("div");
      card.className = "morning-todo-card";
      const iconName = iconFor(eventText);
      if (iconName) {
        const icon = document.createElement("img");
        icon.src = iconName;
        icon.alt = "";
        card.append(icon);
      }
      const label = document.createElement("span");
      label.textContent = eventText;
      card.append(label);
      item.append(marker, card);
      list.append(item);
    });
    list.scrollTop = 0;
  };
  window.addEventListener("storage", (event) => {
    if (event.key !== SETTINGS_KEY) return;
    savedSettings = readSavedSettings();
    if (!document.querySelector('[data-screen="morning-todos"]').hidden) {
      renderTodos(plannedEvents(savedSettings || defaultSettings()));
    }
  });
  byId("todosDone").addEventListener("click", () => {
    try { localStorage.setItem("sleepet-notify-later-v1", String(byId("morningNotifyLater").checked)); } catch {}
    show("morning-end");
  });

  const endSwipe = byId("endSwipe");
  const endCircle = byId("morningCircleTransition");
  let endGesture = null;
  let endCircleOrigin = { x: 201, y: 790 };
  const setEndCircleRadius = (radius) => endCircle.style.setProperty("--circle-radius", radius + "px");
  const setEndCircleOrigin = (x, y) => {
    endCircleOrigin = { x, y };
    endCircle.style.setProperty("--circle-x", x + "px");
    endCircle.style.setProperty("--circle-y", y + "px");
  };
  const resetEndCircle = () => {
    endCircle.classList.remove("is-active", "is-dragging", "is-covering", "is-revealing");
    setEndCircleRadius(0);
  };
  const cancelEndCircle = () => {
    endCircle.classList.remove("is-dragging", "is-covering");
    void endCircle.offsetWidth;
    setEndCircleRadius(0);
    endCircle.classList.remove("is-active");
  };
  const setDefaultEndCircleOrigin = () => {
    const screenBox = endScreen.getBoundingClientRect();
    const swipeBox = endSwipe.getBoundingClientRect();
    setEndCircleOrigin(
      (swipeBox.left + swipeBox.width / 2 - screenBox.left) * endScreen.clientWidth / screenBox.width,
      (swipeBox.top + swipeBox.height / 2 - screenBox.top) * endScreen.clientHeight / screenBox.height
    );
  };
  const goHomeFromEnd = () => {
    if (leavingEnd) return;
    leavingEnd = true;
    if (reducedMotion.matches) {
      resetEndCircle();
      show("home");
      leavingEnd = false;
      return;
    }
    if (!endCircle.classList.contains("is-active")) {
      setDefaultEndCircleOrigin();
      setEndCircleRadius(24);
      endCircle.classList.add("is-active");
    }
    endCircle.classList.remove("is-dragging", "is-revealing");
    endCircle.classList.add("is-covering");
    const { x, y } = endCircleOrigin;
    const farthestCorner = Math.max(
      Math.hypot(x, y),
      Math.hypot(endScreen.clientWidth - x, y),
      Math.hypot(x, endScreen.clientHeight - y),
      Math.hypot(endScreen.clientWidth - x, endScreen.clientHeight - y)
    );
    void endCircle.offsetWidth;
    window.requestAnimationFrame(() => setEndCircleRadius(farthestCorner / .7 + 24));
    window.setTimeout(() => {
      show("home");
      endCircle.classList.add("is-revealing");
      window.setTimeout(() => {
        resetEndCircle();
        leavingEnd = false;
      }, 560);
    }, 580);
  };
  endScreen.addEventListener("pointerdown", (event) => {
    if (leavingEnd || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    const box = endScreen.getBoundingClientRect();
    const scaleX = endScreen.clientWidth / box.width;
    const scaleY = endScreen.clientHeight / box.height;
    endGesture = {
      pointerId: event.pointerId,
      startY: event.clientY,
      scaleY,
      distance: 0,
      startedOnHint: Boolean(event.target.closest("#endSwipe"))
    };
    setEndCircleOrigin(
      Math.max(0, Math.min(endScreen.clientWidth, (event.clientX - box.left) * scaleX)),
      Math.max(0, Math.min(endScreen.clientHeight, (event.clientY - box.top) * scaleY))
    );
    endCircle.classList.remove("is-covering", "is-revealing");
    endCircle.classList.add("is-active", "is-dragging");
    setEndCircleRadius(20);
    try { endScreen.setPointerCapture(event.pointerId); } catch {}
  });
  endScreen.addEventListener("pointermove", (event) => {
    if (!endGesture || endGesture.pointerId !== event.pointerId) return;
    endGesture.distance = Math.max(0, (endGesture.startY - event.clientY) * endGesture.scaleY);
    setEndCircleRadius(20 + Math.min(endGesture.distance / 240, 1) * 460);
  });
  endScreen.addEventListener("pointerup", (event) => {
    if (!endGesture || endGesture.pointerId !== event.pointerId) return;
    const distance = Math.max(0, (endGesture.startY - event.clientY) * endGesture.scaleY);
    const startedOnHint = endGesture.startedOnHint;
    endGesture = null;
    if (endScreen.hasPointerCapture(event.pointerId)) endScreen.releasePointerCapture(event.pointerId);
    if (distance >= 60 || (startedOnHint && distance < 12)) goHomeFromEnd();
    else cancelEndCircle();
  });
  endScreen.addEventListener("pointercancel", () => { endGesture = null; if (!leavingEnd) cancelEndCircle(); });
  endSwipe.addEventListener("click", goHomeFromEnd);
  endSwipe.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") { goHomeFromEnd(); event.preventDefault(); }
  });
  const renderSettingSuggestions = () => {
    document.querySelectorAll("#settingSuggestions [data-suggestion]").forEach((button) => {
      button.setAttribute("aria-pressed", String(draftSettings.selected.includes(button.dataset.suggestion)));
    });
  };
  const renderSettingEvents = (scrollToEnd = false) => {
    const list = byId("settingEventList");
    const previousScrollTop = list.scrollTop;
    list.replaceChildren();
    plannedEvents(draftSettings).forEach((eventText) => {
      const row = document.createElement("div");
      row.className = "setting-event-row";
      const label = document.createElement("span");
      label.textContent = eventText;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.setAttribute("aria-label", "Remove " + eventText);
      const icon = document.createElement("img");
      icon.src = "./assets/flow/setting-trash.svg";
      icon.alt = "";
      remove.append(icon);
      remove.addEventListener("click", () => {
        draftSettings.selected = draftSettings.selected.filter((item) => item !== eventText);
        draftSettings.custom = draftSettings.custom.filter((item) => item !== eventText);
        renderSettingSuggestions();
        renderSettingEvents();
      });
      row.append(label, remove);
      list.append(row);
    });
    list.scrollTop = scrollToEnd ? list.scrollHeight : previousScrollTop;
  };
  const calendar = byId("settingCalendar");
  const calendarButton = byId("settingDateButton");
  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
  const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const parseCalendarDate = (value) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };
  const calendarDateValue = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  let calendarView = parseCalendarDate(draftSettings.date);
  const closeCalendar = (returnFocus = false) => {
    calendar.hidden = true;
    calendarButton.setAttribute("aria-expanded", "false");
    if (returnFocus) calendarButton.focus();
  };
  const selectCalendarDate = (date) => {
    draftSettings.date = calendarDateValue(date);
    byId("settingDateText").textContent = draftSettings.date.replaceAll("-", "/");
    closeCalendar(true);
  };
  const renderCalendar = () => {
    byId("settingCalendarMonth").textContent = monthFormatter.format(calendarView);
    const days = byId("settingCalendarDays");
    days.replaceChildren();
    const year = calendarView.getFullYear();
    const month = calendarView.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const today = calendarDateValue(new Date());
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(year, month, index - firstWeekday + 1);
      const value = calendarDateValue(date);
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(date.getDate());
      button.dataset.date = value;
      button.setAttribute("aria-label", dayFormatter.format(date));
      button.setAttribute("aria-pressed", String(value === draftSettings.date));
      button.classList.toggle("is-outside", date.getMonth() !== month);
      button.classList.toggle("is-selected", value === draftSettings.date);
      button.classList.toggle("is-today", value === today);
      if (value === today) button.setAttribute("aria-current", "date");
      button.addEventListener("click", () => selectCalendarDate(date));
      days.append(button);
    }
  };
  calendarButton.addEventListener("click", () => {
    if (!calendar.hidden) { closeCalendar(); return; }
    calendarView = parseCalendarDate(draftSettings.date);
    renderCalendar();
    calendar.hidden = false;
    calendarButton.setAttribute("aria-expanded", "true");
    byId("settingCalendarDays").querySelector(".is-selected")?.focus();
  });
  byId("settingCalendarPrev").addEventListener("click", () => {
    calendarView = new Date(calendarView.getFullYear(), calendarView.getMonth() - 1, 1);
    renderCalendar();
  });
  byId("settingCalendarNext").addEventListener("click", () => {
    calendarView = new Date(calendarView.getFullYear(), calendarView.getMonth() + 1, 1);
    renderCalendar();
  });
  byId("settingCalendarToday").addEventListener("click", () => selectCalendarDate(new Date()));
  byId("settingCalendarClose").addEventListener("click", () => closeCalendar(true));
  document.addEventListener("pointerdown", (event) => {
    if (!calendar.hidden && !calendar.contains(event.target) && !calendarButton.contains(event.target)) closeCalendar();
  });
  calendar.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { closeCalendar(true); event.preventDefault(); return; }
    const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (!offset || !event.target.matches(".setting-calendar-days button")) return;
    const date = parseCalendarDate(event.target.dataset.date);
    date.setDate(date.getDate() + offset);
    calendarView = new Date(date.getFullYear(), date.getMonth(), 1);
    renderCalendar();
    byId("settingCalendarDays").querySelector(`[data-date="${calendarDateValue(date)}"]`)?.focus();
    event.preventDefault();
  });

  const renderSetting = () => {
    document.querySelectorAll("[data-gentle]").forEach((input) => { input.checked = !!draftSettings.gentle[input.dataset.gentle]; });
    renderSettingSuggestions();
    renderSettingEvents();
    byId("settingEventList").scrollTop = 0;
    byId("settingAddInput").value = "";
    byId("settingDateText").textContent = draftSettings.date.replaceAll("-", "/");
    calendarView = parseCalendarDate(draftSettings.date);
    closeCalendar();
  };
  const openSetting = () => {
    draftSettings = savedSettings ? structuredClone(savedSettings) : defaultSettings();
    renderSetting();
    show("morning-setting");
  };
  byId("routineButton").addEventListener("click", openSetting);
  byId("morningSettingBack").addEventListener("click", () => { closeCalendar(); show("home"); });
  document.querySelectorAll("[data-gentle]").forEach((input) => input.addEventListener("change", () => {
    draftSettings.gentle[input.dataset.gentle] = input.checked;
  }));
  byId("changeRoutine").addEventListener("click", () => document.querySelector('[data-gentle="water"]').focus());
  document.querySelectorAll("#settingSuggestions [data-suggestion]").forEach((button) => button.addEventListener("click", () => {
    const value = button.dataset.suggestion;
    const wasSelected = draftSettings.selected.includes(value);
    draftSettings.selected = wasSelected
      ? draftSettings.selected.filter((item) => item !== value)
      : [...draftSettings.selected, value];
    renderSettingSuggestions();
    renderSettingEvents(!wasSelected);
  }));
  const addEvent = () => {
    const value = byId("settingAddInput").value.trim();
    if (!value) { byId("settingAddInput").focus(); return; }
    if (!plannedEvents(draftSettings).some((item) => item.toLowerCase() === value.toLowerCase())) draftSettings.custom.push(value);
    byId("settingAddInput").value = "";
    renderSettingEvents(true);
  };
  byId("settingAddButton").addEventListener("click", addEvent);
  byId("settingAddInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") { addEvent(); event.preventDefault(); }
  });
  byId("settingSave").addEventListener("click", () => {
    if (byId("settingAddInput").value.trim()) addEvent();
    savedSettings = structuredClone(draftSettings);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(savedSettings)); } catch {}
    closeCalendar();
    show("home");
  });

  const preview = new URLSearchParams(window.location.search).get("preview");
  if (preview === "morning-setting") openSetting();
  else if (preview === "morning-stretch") show("morning-stretch");
  else if (["morning-todos", "morning-rating", "morning-drink", "morning-end"].includes(preview)) show(preview);
  syncDrinkVideo();
})();
