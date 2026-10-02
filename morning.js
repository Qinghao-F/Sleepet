(() => {
  const byId = (id) => document.getElementById(id);
  const SETTINGS_KEY = "sleepet-morning-settings-v1";
  const RATING_KEY = "sleepet-morning-rating-v1";
  const ratingNames = ["Exhausted", "Tired", "Okay", "Refreshed", "Energetic"];
  const stretchStageMs = new URLSearchParams(window.location.search).has("preview") ? 2000 : 100000;
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

  const plannedEvents = (settings) => [...settings.selected, ...settings.custom];
  const stopStretchTimer = () => {
    if (stretchTicker !== null) window.clearInterval(stretchTicker);
    stretchTicker = null;
  };
  const show = (name) => {
    if (name !== "morning-stretch") stopStretchTimer();
    showOnboardingScreen(name);
    if (name === "morning-stretch") startStretchTimer();
    if (name === "morning-todos") renderTodos(plannedEvents(savedSettings || defaultSettings()));
  };
  const continueAfterStretch = () => {
    const events = savedSettings ? plannedEvents(savedSettings) : [];
    if (events.length) show("morning-todos");
    else show("morning-end");
  };
  const continueAfterDrink = () => {
    if (savedSettings && savedSettings.gentle.stretch === false) continueAfterStretch();
    else show("morning-stretch");
  };

  byId("wakeContinue").addEventListener("click", () => show("morning-rating"));
  byId("ratingDone").addEventListener("click", () => {
    try { localStorage.setItem(RATING_KEY, byId("morningRating").value); } catch {}
    if (savedSettings && savedSettings.gentle.water === false) continueAfterDrink();
    else show("morning-drink");
  });
  const ratingControl = byId("morningRating");
  const ratingBubble = byId("ratingBubble");
  const bubbleLightByRating = [
    [.12, .22, .78, .04], [.24, .38, .72, .12], [.36, .54, .66, .20], [.48, .70, .60, .28], [.60, .88, .54, .38]
  ];
  const renderRating = () => {
    const index = Number(ratingControl.value);
    byId("ratingCurrent").textContent = ratingNames[index];
    const [veil, prism, lower, shine] = bubbleLightByRating[index];
    ratingBubble.style.setProperty("--bubble-veil", String(veil));
    ratingBubble.style.setProperty("--bubble-prism", String(prism));
    ratingBubble.style.setProperty("--bubble-lower", String(lower));
    ratingBubble.style.setProperty("--bubble-shine", String(shine));
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
    events.forEach((eventText) => {
      const item = document.createElement("div");
      item.className = "morning-todo-item";
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
  };
  byId("todosDone").addEventListener("click", () => {
    try { localStorage.setItem("sleepet-notify-later-v1", String(byId("morningNotifyLater").checked)); } catch {}
    show("morning-end");
  });

  const goHomeFromEnd = () => {
    if (leavingEnd) return;
    leavingEnd = true;
    const white = byId("morningWhiteTransition");
    white.classList.add("is-visible");
    window.setTimeout(() => {
      show("home");
      white.classList.remove("is-visible");
      window.setTimeout(() => { leavingEnd = false; }, 370);
    }, 350);
  };
  const endScreen = document.querySelector('[data-screen="morning-end"]');
  let endStartY = null;
  endScreen.addEventListener("pointerdown", (event) => { endStartY = event.clientY; });
  endScreen.addEventListener("pointerup", (event) => {
    if (endStartY !== null && endStartY - event.clientY >= 60) goHomeFromEnd();
    endStartY = null;
  });
  endScreen.addEventListener("pointercancel", () => { endStartY = null; });
  byId("endSwipe").addEventListener("click", goHomeFromEnd);
  byId("endSwipe").addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") { goHomeFromEnd(); event.preventDefault(); }
  });

  const renderSettingSuggestions = () => {
    document.querySelectorAll("#settingSuggestions [data-suggestion]").forEach((button) => {
      button.setAttribute("aria-pressed", String(draftSettings.selected.includes(button.dataset.suggestion)));
    });
  };
  const renderSettingEvents = () => {
    const list = byId("settingEventList");
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
    draftSettings.selected = draftSettings.selected.includes(value)
      ? draftSettings.selected.filter((item) => item !== value)
      : [...draftSettings.selected, value];
    renderSettingSuggestions();
    renderSettingEvents();
  }));
  const addEvent = () => {
    const value = byId("settingAddInput").value.trim();
    if (!value) { byId("settingAddInput").focus(); return; }
    if (!plannedEvents(draftSettings).some((item) => item.toLowerCase() === value.toLowerCase())) draftSettings.custom.push(value);
    byId("settingAddInput").value = "";
    renderSettingEvents();
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
  else if (preview === "morning-todos") {
    renderTodos(["Go grocery shopping", "Group meeting", "Email the professor about the thesis"]);
    showOnboardingScreen("morning-todos");
  } else if (["morning-rating", "morning-drink", "morning-end"].includes(preview)) show(preview);
})();
