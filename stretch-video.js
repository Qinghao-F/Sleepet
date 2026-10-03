(() => {
  const screen = document.querySelector('[data-screen="morning-stretch"]');
  const layer = document.getElementById("onboardingLayer");
  const video = document.getElementById("stretchMochaVideo");
  const canvas = document.getElementById("stretchMochaCanvas");
  const fallback = document.getElementById("stretchDogFallback");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return;

  const width = canvas.width;
  const height = canvas.height;
  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Uint32Array(pixelCount);
  let frameRequest = null;
  let active = false;
  let showingStretch = false;
  let processingAvailable = true;

  const drawFrame = () => {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    context.drawImage(video, 0, 0, width, height);
    let frame;
    try { frame = context.getImageData(0, 0, width, height); }
    catch { processingAvailable = false; active = false; stopFrames(); video.pause(); return; }
    const rgba = frame.data;
    visited.fill(0);
    let head = 0;
    let tail = 0;

    // Remove only the near-white area connected to the frame edge.
    // Mocha's white fur remains opaque inside the dark outline.
    const enqueue = (position) => {
      if (visited[position]) return;
      visited[position] = 1;
      const offset = position * 4;
      const red = rgba[offset];
      const green = rgba[offset + 1];
      const blue = rgba[offset + 2];
      if (Math.min(red, green, blue) < 232 || Math.max(red, green, blue) - Math.min(red, green, blue) > 18) return;
      visited[position] = 2;
      queue[tail++] = position;
    };
    for (let x = 0; x < width; x++) {
      enqueue(x);
      enqueue((height - 1) * width + x);
    }
    for (let y = 1; y < height - 1; y++) {
      enqueue(y * width);
      enqueue(y * width + width - 1);
    }
    while (head < tail) {
      const position = queue[head++];
      const x = position % width;
      if (x) enqueue(position - 1);
      if (x < width - 1) enqueue(position + 1);
      if (position >= width) enqueue(position - width);
      if (position < pixelCount - width) enqueue(position + width);
    }
    for (let i = 0; i < tail; i++) rgba[queue[i] * 4 + 3] = 0;

    // Feather the compressed white pixels along the silhouette.
    for (let position = 0; position < pixelCount; position++) {
      if (visited[position] === 2) continue;
      const x = position % width;
      const bordersBackground = (x > 0 && visited[position - 1] === 2) ||
        (x < width - 1 && visited[position + 1] === 2) ||
        (position >= width && visited[position - width] === 2) ||
        (position < pixelCount - width && visited[position + width] === 2);
      if (!bordersBackground) continue;
      const offset = position * 4;
      const red = rgba[offset];
      const green = rgba[offset + 1];
      const blue = rgba[offset + 2];
      const minimum = Math.min(red, green, blue);
      if (minimum > 215 && Math.max(red, green, blue) - minimum < 24) {
        rgba[offset + 3] = Math.min(255, Math.max(0, (255 - minimum) * 7));
      }
    }
    context.putImageData(frame, 0, 0);
    // The source clip has a small stray mark at its upper-left edge.
    context.clearRect(0, 0, Math.round(width * .19), Math.round(height * .04));
    if (!canvas.classList.contains("is-ready")) {
      canvas.classList.add("is-ready");
      fallback.hidden = true;
    }
  };

  const stopFrames = () => {
    if (frameRequest === null) return;
    if (video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frameRequest);
    else window.cancelAnimationFrame(frameRequest);
    frameRequest = null;
  };
  const nextFrame = () => {
    frameRequest = null;
    if (!active || reducedMotion.matches) return;
    drawFrame();
    scheduleFrame();
  };
  function scheduleFrame() {
    if (frameRequest !== null || !active || reducedMotion.matches || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    frameRequest = video.requestVideoFrameCallback ? video.requestVideoFrameCallback(nextFrame) : window.requestAnimationFrame(nextFrame);
  }
  const syncVideo = () => {
    if (!processingAvailable) { video.pause(); return; }
    const visible = !screen.hidden && !layer.classList.contains("is-hidden") && !document.hidden;
    if (!visible) {
      active = false;
      showingStretch = false;
      stopFrames();
      video.pause();
      return;
    }
    if (!showingStretch) {
      showingStretch = true;
      try { video.currentTime = 0; } catch {}
    }
    active = true;
    if (reducedMotion.matches) {
      stopFrames();
      video.pause();
      drawFrame();
      return;
    }
    const playback = video.play();
    if (playback?.catch) playback.catch(() => {});
    scheduleFrame();
  };

  new MutationObserver(syncVideo).observe(screen, { attributes: true, attributeFilter: ["hidden"] });
  new MutationObserver(syncVideo).observe(layer, { attributes: true, attributeFilter: ["class"] });
  video.addEventListener("loadeddata", () => { drawFrame(); syncVideo(); });
  video.addEventListener("playing", scheduleFrame);
  document.addEventListener("visibilitychange", syncVideo);
  reducedMotion.addEventListener?.("change", syncVideo);
  window.addEventListener("pagehide", () => { active = false; stopFrames(); video.pause(); });
  window.addEventListener("pageshow", syncVideo);
  syncVideo();
})();