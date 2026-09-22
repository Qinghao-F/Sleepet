const state = {
  soundIndex: 0,
  modeIndex: 0,
  volume: 50,
  petIndex: 0,
  petName: "Mocha",
  appearanceIndex: 0,
  poseIndex: 0,
  schedule: { bedHour: "08", bedMinute: "10", bedPeriod: "PM", wakeHour: "09", wakeMinute: "52", wakePeriod: "AM", windMinutes: "20", windSeconds: "00" }
};

const sounds = ["Ocean", "Rain", "Forest"];
const modes = ["Quiet", "Focus", "Deep"];
const petNames = ["Mocha", "Luna", "Hazel"];
const appearanceImages = ["./assets/pet-option-3.png", "./assets/pet-option-1.png", "./assets/pet-option-2.png"];
const posePositions = ["100% 0", "0% 0", "50% 0", "0% 100%", "100% 100%"];
const CLOCK_CENTER = 144;
const CLOCK_RADIUS = 128;
const CLOCK_STEP = 0.5;
const ARC_CIRCUMFERENCE = 2 * Math.PI * CLOCK_RADIUS;

const $ = (id) => document.getElementById(id);
const cycle = (current, length, dir) => (current + dir + length) % length;

function scheduleToHours(hour, minute, period) {
  let value = Number(hour) % 12;
  if (period === "PM") value += 12;
  return value + Number(minute) / 60;
}

function hoursToSchedule(hours) {
  const normalized = (hours + 24) % 24;
  const totalMinutes = Math.round(normalized * 60);
  const hour24 = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour: String(hour12).padStart(2, "0"), minute: String(minute).padStart(2, "0"), period };
}

function formatScheduleTime(hours) {
  const value = hoursToSchedule(hours);
  return `${Number(value.hour)}:${value.minute}${value.period}`;
}

function getDialTime(handle) {
  return handle === "bed"
    ? scheduleToHours(state.schedule.bedHour, state.schedule.bedMinute, state.schedule.bedPeriod)
    : scheduleToHours(state.schedule.wakeHour, state.schedule.wakeMinute, state.schedule.wakePeriod);
}

function updateScheduleFromDial(handle, hours) {
  const snapped = (Math.round(hours / CLOCK_STEP) * CLOCK_STEP) % 24;
  const value = hoursToSchedule(snapped);
  if (handle === "bed") {
    state.schedule.bedHour = value.hour;
    state.schedule.bedMinute = value.minute;
    state.schedule.bedPeriod = value.period;
  } else {
    state.schedule.wakeHour = value.hour;
    state.schedule.wakeMinute = value.minute;
    state.schedule.wakePeriod = value.period;
  }
  renderMain();
}

function renderClock() {
  const bedtime = getDialTime("bed");
  const wake = getDialTime("wake");
  let duration = (wake - bedtime + 24) % 24;
  if (duration < CLOCK_STEP) duration = CLOCK_STEP;
  const arc = (duration / 24) * ARC_CIRCUMFERENCE;
  const arcNode = $("sleepArc");
  arcNode.style.strokeDasharray = `${arc} ${ARC_CIRCUMFERENCE}`;
  arcNode.style.transform = `rotate(${bedtime * 15 - 90}deg)`;
  [["bedtime-handle", bedtime, "bedTooltip"], ["wake-handle", wake, "wakeTooltip"]].forEach(([className, hours, tooltipId]) => {
    const node = document.querySelector(`.${className}`);
    const angle = (hours / 24) * Math.PI * 2;
    node.style.left = `${CLOCK_CENTER + Math.sin(angle) * CLOCK_RADIUS}px`;
    node.style.top = `${CLOCK_CENTER - Math.cos(angle) * CLOCK_RADIUS}px`;
    $(tooltipId).textContent = formatScheduleTime(hours);
    node.setAttribute("aria-label", `${className.startsWith("bed") ? "Adjust bedtime" : "Adjust wake up time"}: ${formatScheduleTime(hours)}`);
  });
}

function dialHoursFromPointer(event) {
  const rect = $("clockStage").getBoundingClientRect();
  const x = event.clientX - (rect.left + rect.width / 2);
  const y = event.clientY - (rect.top + rect.height / 2);
  let angle = Math.atan2(x, -y);
  if (angle < 0) angle += Math.PI * 2;
  return (angle / (Math.PI * 2)) * 24;
}

function openLayer(layer) {
  layer.setAttribute("aria-hidden", "false");
  layer.classList.add("open");
  $("scrollArea").style.overflow = "hidden";
}

function closeLayer(layer) {
  layer.classList.remove("open");
  layer.setAttribute("aria-hidden", "true");
  window.setTimeout(() => {
    if (![...document.querySelectorAll(".sheet-layer")].some((item) => item.classList.contains("open"))) $("scrollArea").style.overflow = "auto";
  }, 300);
}

function setScheduleInputs(schedule) {
  ["bedHour", "bedMinute", "wakeHour", "wakeMinute", "windMinutes", "windSeconds"].forEach((id) => { $(id).value = schedule[id]; });
  document.querySelectorAll("[data-ampm]").forEach((button) => {
    const chosen = schedule[button.dataset.ampm === "bed" ? "bedPeriod" : "wakePeriod"] === button.dataset.value;
    button.classList.toggle("selected", chosen);
  });
}

function renderMain() {
  $("soundValue").textContent = sounds[state.soundIndex];
  $("modeValue").textContent = modes[state.modeIndex];
  $("volumeValue").textContent = `${state.volume}%`;
  $("volumeSlider").value = state.volume;
  $("mainPetName").textContent = state.petName;
  $("bedtimeSummary").textContent = `${Number(state.schedule.bedHour)}:${state.schedule.bedMinute}${state.schedule.bedPeriod}`;
  $("wakeSummary").textContent = `${Number(state.schedule.wakeHour)}:${state.schedule.wakeMinute}${state.schedule.wakePeriod}`;
  $("winddownSummary").textContent = `${Number(state.schedule.windMinutes)}MIN`;
  renderClock();
}

function renderPetDraft() {
  document.querySelectorAll(".pet-thumb").forEach((button) => button.classList.toggle("selected", Number(button.dataset.petIndex) === state.petIndex));
  $("petNameChoice").innerHTML = `${petNames[state.petIndex]} <span>›</span>`;
  $("appearanceImage").src = appearanceImages[state.appearanceIndex];
  $("posePreview").style.backgroundPosition = posePositions[state.poseIndex];
}

function readScheduleDraft() {
  const draft = { ...state.schedule };
  ["bedHour", "bedMinute", "wakeHour", "wakeMinute", "windMinutes", "windSeconds"].forEach((id) => { draft[id] = $(id).value.padStart(2, "0").slice(-2); });
  document.querySelectorAll("[data-ampm].selected").forEach((button) => { draft[button.dataset.ampm === "bed" ? "bedPeriod" : "wakePeriod"] = button.dataset.value; });
  return draft;
}

$("openTime").addEventListener("click", () => { setScheduleInputs(state.schedule); openLayer($("timeLayer")); });
$("openPet").addEventListener("click", () => { renderPetDraft(); openLayer($("petLayer")); });

document.querySelectorAll("[data-cycle]").forEach((button) => button.addEventListener("click", () => {
  if (button.dataset.cycle === "sound") state.soundIndex = cycle(state.soundIndex, sounds.length, Number(button.dataset.dir));
  if (button.dataset.cycle === "mode") state.modeIndex = cycle(state.modeIndex, modes.length, Number(button.dataset.dir));
  renderMain();
}));
$("volumeSlider").addEventListener("input", (event) => { state.volume = Number(event.target.value); renderMain(); });

document.querySelectorAll("[data-ampm]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll(`[data-ampm="${button.dataset.ampm}"]`).forEach((item) => item.classList.remove("selected"));
  button.classList.add("selected");
}));
$("cancelTime").addEventListener("click", () => closeLayer($("timeLayer")));
$("timeLayer").querySelector(".scrim").addEventListener("click", () => closeLayer($("timeLayer")));
$("saveTime").addEventListener("click", () => { state.schedule = readScheduleDraft(); renderMain(); closeLayer($("timeLayer")); });

let activeDialHandle = null;
document.querySelectorAll(".clock-handle").forEach((handle) => {
  handle.addEventListener("pointerdown", (event) => {
    activeDialHandle = handle.dataset.handle;
    handle.setPointerCapture(event.pointerId);
    handle.classList.add("is-dragging");
    updateScheduleFromDial(activeDialHandle, dialHoursFromPointer(event));
    event.preventDefault();
  });
  handle.addEventListener("pointermove", (event) => {
    if (activeDialHandle !== handle.dataset.handle) return;
    updateScheduleFromDial(activeDialHandle, dialHoursFromPointer(event));
  });
  const finishDialDrag = (event) => {
    if (activeDialHandle !== handle.dataset.handle) return;
    activeDialHandle = null;
    handle.classList.remove("is-dragging");
    if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
  };
  handle.addEventListener("pointerup", finishDialDrag);
  handle.addEventListener("pointercancel", finishDialDrag);
});

document.querySelectorAll("[data-pet-index]").forEach((button) => button.addEventListener("click", () => { state.petIndex = Number(button.dataset.petIndex); state.petName = petNames[state.petIndex]; renderPetDraft(); }));
$("petNameChoice").addEventListener("click", () => { state.petIndex = cycle(state.petIndex, petNames.length, 1); state.petName = petNames[state.petIndex]; renderPetDraft(); });
$("appearancePrev").addEventListener("click", () => { state.appearanceIndex = cycle(state.appearanceIndex, appearanceImages.length, -1); renderPetDraft(); });
$("appearanceNext").addEventListener("click", () => { state.appearanceIndex = cycle(state.appearanceIndex, appearanceImages.length, 1); renderPetDraft(); });
$("posePrev").addEventListener("click", () => { state.poseIndex = cycle(state.poseIndex, posePositions.length, -1); renderPetDraft(); });
$("poseNext").addEventListener("click", () => { state.poseIndex = cycle(state.poseIndex, posePositions.length, 1); renderPetDraft(); });
$("petLayer").querySelector(".scrim").addEventListener("click", () => closeLayer($("petLayer")));
$("savePet").addEventListener("click", () => { $("mainPetAvatar").style.backgroundPosition = posePositions[state.poseIndex]; renderMain(); closeLayer($("petLayer")); });

renderMain();
