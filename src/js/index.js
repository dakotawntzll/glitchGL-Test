const stack = document.getElementById("stack");
const warp = document.getElementById("noiseWarp");

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

let hover = false;
let last = null;

let target = 0;
let current = 0;

// TUNING (keep these at top)
const MAX_SCALE = 8;      // lower = subtler
const SPEED_MULT = 0.6;   // lower = needs faster movement
const SMOOTH = 0.12;      // lower = slower response
const DECAY_HOVER = 0.90; // higher = lingers longer
const DECAY_OUT = 0.80;   // higher = lingers longer after leaving

stack.addEventListener("pointerenter", (e) => {
  hover = true;
  last = { x: e.clientX, y: e.clientY, t: performance.now() };
});

stack.addEventListener("pointerleave", () => {
  hover = false;
  last = null;
});

stack.addEventListener("pointermove", (e) => {
  if (!hover || !last) return;

  const now = performance.now();
  const dx = e.clientX - last.x;
  const dy = e.clientY - last.y;
  const dt = Math.max(1, now - last.t);

  const speed = Math.hypot(dx, dy) / dt;           // px/ms
  const s = clamp(speed * SPEED_MULT, 0, 1);       // 0..1
  const eased = 1 - Math.pow(1 - s, 3);            // easeOutCubic
  target = eased * MAX_SCALE;

  last = { x: e.clientX, y: e.clientY, t: now };
});

function tick() {
  target *= hover ? DECAY_HOVER : DECAY_OUT;
  if (!hover && target < 0.01) target = 0;

  current = lerp(current, target, SMOOTH);
  warp.setAttribute("scale", current.toFixed(2));

  requestAnimationFrame(tick);
}

tick();


