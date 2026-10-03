(() => {
  const screen = document.querySelector('[data-screen="home"]');
  const canvas = document.getElementById("homeForeground");
  const layer = screen?.closest(".onboarding-layer");
  const context = canvas?.getContext("2d", { alpha: true });
  if (!screen || !layer || !context) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const leafColors = ["#b8d9e3", "#8fbad0", "#c5dfe7", "#719db8", "#a6cbd8"];
  const tau = Math.PI * 2;
  let width = 0;
  let height = 0;
  let frame = 0;
  let lastFrame = 0;
  let seed = 71429;
  let lights = [];
  let leaves = [];

  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const makeLight = () => ({
    x: random() * width,
    y: random() * height,
    vx: (random() - .5) * 4,
    vy: 1.5 + random() * 4,
    radius: 1.1 + random() * 1.25,
    glow: 8 + random() * 7,
    brightness: .56 + random() * .38,
    phase: random() * tau,
    pulse: .65 + random() * .75,
    sway: 3 + random() * 7
  });

  const makeLeaf = (startAbove = false) => ({
    x: random() * (width + 60) - 30,
    y: startAbove ? -25 - random() * height * .5 : random() * height,
    vx: (random() - .5) * 18,
    vy: 18 + random() * 22,
    size: 12 + random() * 10,
    angle: random() * tau,
    spin: (random() - .5) * .9,
    sway: 8 + random() * 14,
    phase: random() * tau,
    color: leafColors[Math.floor(random() * leafColors.length)],
    opacity: .48 + random() * .25
  });

  const resize = () => {
    const nextWidth = screen.clientWidth;
    const nextHeight = screen.clientHeight;
    if (!nextWidth || !nextHeight || (nextWidth === width && nextHeight === height)) return;
    width = nextWidth;
    height = nextHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    seed = 71429;
    lights = Array.from({ length: 36 }, makeLight);
    leaves = Array.from({ length: 18 }, () => makeLeaf());
  };

  const drawLights = (seconds, delta) => {
    context.globalCompositeOperation = "screen";
    for (const light of lights) {
      light.x += light.vx * delta;
      light.y -= light.vy * delta;
      if (light.y < -20) { light.y = height + 18; light.x = random() * width; }
      if (light.x < -20) light.x = width + 18;
      if (light.x > width + 20) light.x = -18;
      const x = light.x + Math.sin(seconds * .65 + light.phase) * light.sway;
      const y = light.y;
      const edge = Math.min(1, Math.max(0, (y + 15) / 45), Math.max(0, (height + 15 - y) / 45));
      const twinkle = .65 + .35 * Math.sin(seconds * light.pulse + light.phase);
      const alpha = light.brightness * edge * twinkle;
      if (alpha <= 0) continue;
      const glow = context.createRadialGradient(x, y, 0, x, y, light.glow);
      glow.addColorStop(0, `rgba(255, 252, 227, ${alpha})`);
      glow.addColorStop(.18, `rgba(220, 239, 255, ${alpha * .5})`);
      glow.addColorStop(1, "rgba(188, 224, 251, 0)");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(x, y, light.glow, 0, tau);
      context.fill();
      context.fillStyle = `rgba(255, 252, 239, ${alpha * .9})`;
      context.beginPath();
      context.arc(x, y, light.radius, 0, tau);
      context.fill();
    }
    context.globalCompositeOperation = "source-over";
  };

  const drawLeaves = (seconds, delta) => {
    for (let index = 0; index < leaves.length; index += 1) {
      let leaf = leaves[index];
      leaf.x += leaf.vx * delta;
      leaf.y += leaf.vy * delta;
      leaf.angle += leaf.spin * delta;
      if (leaf.y > height + 35 || leaf.x < -60 || leaf.x > width + 60) {
        leaf = makeLeaf(true);
        leaves[index] = leaf;
      }
      const edge = Math.min(1, Math.max(0, (leaf.y + 20) / 55), Math.max(0, (height + 20 - leaf.y) / 55));
      if (edge <= 0) continue;
      const x = leaf.x + Math.sin(seconds * 1.25 + leaf.phase) * leaf.sway;
      context.save();
      context.translate(x, leaf.y);
      context.rotate(leaf.angle + Math.sin(seconds * .85 + leaf.phase) * .18);
      context.scale(leaf.size, leaf.size);
      context.globalAlpha = leaf.opacity * edge;
      context.fillStyle = leaf.color;
      context.beginPath();
      context.moveTo(-.7, .1);
      context.quadraticCurveTo(-.15, -.68, .7, -.13);
      context.quadraticCurveTo(.2, .58, -.7, .1);
      context.fill();
      context.strokeStyle = "rgba(42, 86, 112, .3)";
      context.lineWidth = .035;
      context.stroke();
      context.strokeStyle = "rgba(221, 239, 244, .58)";
      context.lineWidth = .045;
      context.beginPath();
      context.moveTo(-.56, .06);
      context.quadraticCurveTo(.08, -.08, .6, -.13);
      context.stroke();
      context.restore();
    }
  };

  const tick = (now) => {
    if (now - lastFrame >= 30) {
      const delta = Math.min((now - lastFrame) / 1000, .05);
      lastFrame = now;
      context.clearRect(0, 0, width, height);
      drawLights(now / 1000, delta);
      drawLeaves(now / 1000, delta);
    }
    frame = window.requestAnimationFrame(tick);
  };

  const sync = () => {
    const active = !screen.hidden && !layer.classList.contains("is-hidden") && !document.hidden && !reducedMotion.matches;
    if (active) {
      resize();
      if (!frame && width && height) {
        lastFrame = performance.now() - 32;
        frame = window.requestAnimationFrame(tick);
      }
    } else {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      context.clearRect(0, 0, width, height);
    }
  };

  new MutationObserver(sync).observe(screen, { attributes: true, attributeFilter: ["hidden"] });
  new MutationObserver(sync).observe(layer, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("resize", () => { resize(); sync(); });
  document.addEventListener("visibilitychange", sync);
  reducedMotion.addEventListener?.("change", sync);
  sync();
})();