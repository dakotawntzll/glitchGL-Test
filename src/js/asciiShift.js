// ---------------------- ASCII ripple animation ----------------------

// Constants for wave animation behavior (tweak feel here)
const WAVE_THRESH = 2;
const CHAR_MULT = 9;
const ANIM_STEP = 90;
const WAVE_BUF = 2;

/**
 * Create an ASCII ripple animation instance for a single element.
 * - Hovering spawns "waves" that temporarily swap nearby characters.
 * - Public API lets other systems (ex: fade-in observer) trigger waves.
 */
const createASCIIShift = (el, opts = {}) => {
	let originalText = el.textContent;
	let originalChars = originalText.split("");

	let isAnimating = false;
	let isHovering = false;
	let cursorIndex = 0;
	let waves = [];
	let rafId = null;

	// Cache layout reads (avoid getBoundingClientRect on every mousemove)
	let cachedRect = null;
	let lastRectUpdate = 0;

	const config = {
		durationMs: 700,
		chars: '_.,·-+:=*""||[]/!?&#23456789|',
		preserveSpaces: true,
		spread: 0.4,
		...opts,
	};

	const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

	const updateRectIfNeeded = (now, force = false) => {
		// Update at most ~4 times/second while hovering (unless forced)
		if (!force && now - lastRectUpdate < 250) return;
		cachedRect = el.getBoundingClientRect();
		lastRectUpdate = now;
	};

	const updateCursorIndex = (e) => {
		if (!cachedRect || cachedRect.width === 0) return;
		const x = e.clientX - cachedRect.left;
		const len = originalText.length;
		const idx = Math.round((x / cachedRect.width) * len);
		cursorIndex = clamp(idx, 0, Math.max(0, len - 1));
	};

	const startWaveAtCursor = (now) => {
		waves.push({
			startIndex: cursorIndex,
			startTime: now,
		});

		if (!isAnimating) start();
	};

	// Convenience helper for other systems (ex: on fade-in)
	const triggerWave = ({ at = 0.5, repeat = 1, interval = 80 } = {}) => {
		const len = originalText.length;
		cursorIndex = clamp(
			Math.round(at * (len - 1)),
			0,
			Math.max(0, len - 1)
		);

		const now = performance.now();
		startWaveAtCursor(now);

		for (let i = 1; i < repeat; i++) {
			setTimeout(
				() => startWaveAtCursor(performance.now()),
				i * interval
			);
		}
	};

	const cleanupWaves = (now) => {
		waves = waves.filter((w) => now - w.startTime < config.durationMs);
	};

	const calcWaveEffect = (charIndex, now) => {
		let shouldAnimate = false;
		let nextChar = originalChars[charIndex];

		for (const w of waves) {
			const age = now - w.startTime;
			const progress = Math.min(age / config.durationMs, 1);

			const dist = Math.abs(charIndex - w.startIndex);
			const maxDist = Math.max(
				w.startIndex,
				originalChars.length - w.startIndex - 1
			);
			const radius = (progress * (maxDist + WAVE_BUF)) / config.spread;

			if (dist <= radius) {
				shouldAnimate = true;

				const intensity = Math.max(0, radius - dist);
				if (intensity <= WAVE_THRESH && intensity > 0) {
					const seqIndex =
						(dist * CHAR_MULT + Math.floor(age / ANIM_STEP)) %
						config.chars.length;
					nextChar = config.chars[seqIndex];
				}
			}
		}

		return { shouldAnimate, char: nextChar };
	};

	const getScrambledText = (now) =>
		originalChars
			.map((ch, i) => {
				if (config.preserveSpaces && ch === " ") return " ";
				const { shouldAnimate, char } = calcWaveEffect(i, now);
				return shouldAnimate ? char : ch;
			})
			.join("");

	const stop = () => {
		el.textContent = originalText;
		el.classList.remove("as");
		isAnimating = false;
	};

	const start = () => {
		if (isAnimating) return;

		isAnimating = true;
		el.classList.add("as");

		const animate = () => {
			const now = performance.now();

			cleanupWaves(now);

			if (waves.length === 0) {
				stop();
				return;
			}

			el.textContent = getScrambledText(now);
			rafId = requestAnimationFrame(animate);
		};

		rafId = requestAnimationFrame(animate);
	};

	const resetToOriginal = () => {
		waves = [];

		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}

		stop();
	};

	const updateText = (newText) => {
		originalText = newText;
		originalChars = newText.split("");

		// Only overwrite DOM when we're not actively animating.
		if (!isAnimating) el.textContent = newText;
	};

	// Events: keep it simple, but support Pointer Events when available.
	const ENTER_EVT = window.PointerEvent ? "pointerenter" : "mouseenter";
	const MOVE_EVT = window.PointerEvent ? "pointermove" : "mousemove";
	const LEAVE_EVT = window.PointerEvent ? "pointerleave" : "mouseleave";

	const handleEnter = (e) => {
		isHovering = true;

		const now = performance.now();
		updateRectIfNeeded(now, true);
		updateCursorIndex(e);

		startWaveAtCursor(now);
	};

	const handleMove = (e) => {
		if (!isHovering) return;

		const now = performance.now();
		updateRectIfNeeded(now);

		const prev = cursorIndex;
		updateCursorIndex(e);

		if (cursorIndex !== prev) startWaveAtCursor(now);
	};

	const handleLeave = () => {
		isHovering = false;
		cachedRect = null;
	};

	const init = () => {
		el.addEventListener(ENTER_EVT, handleEnter);
		el.addEventListener(MOVE_EVT, handleMove, { passive: true });
		el.addEventListener(LEAVE_EVT, handleLeave);

		// If layout changes while hovering, refresh rect.
		window.addEventListener(
			"resize",
			() => {
				if (!isHovering) return;
				updateRectIfNeeded(performance.now(), true);
			},
			{ passive: true }
		);
	};

	const destroy = () => {
		resetToOriginal();
		el.removeEventListener(ENTER_EVT, handleEnter);
		el.removeEventListener(MOVE_EVT, handleMove);
		el.removeEventListener(LEAVE_EVT, handleLeave);
	};

	init();

	// Public API (used elsewhere in your file)
	return { updateText, resetToOriginal, destroy, triggerWave };
};

const asciiInstances = new Map();

const initASCIIShift = () => {
	// Preferred: just opt-in with classes.
	// - ascii-on-hover: enable hover ripple
	// - ascii-on-fade: allows fade-in code to trigger waves
	let targets = document.querySelectorAll(".ascii-on-hover, .ascii-on-fade");

	targets.forEach((el) => {
		if (!el.textContent.trim()) return;
		if (asciiInstances.has(el)) return;

		const inst = createASCIIShift(el, { durationMs: 700, spread: 1 });
		asciiInstances.set(el, inst);
	});
};


window.initASCIIShift = initASCIIShift;
window.asciiInstances = asciiInstances;