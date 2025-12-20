document.addEventListener("DOMContentLoaded", () => {

	const loadScript = (src) =>
		new Promise((resolve, reject) => {
			const s = document.createElement("script");
			s.src = src;
			s.async = true;
			s.onload = () => resolve();
			s.onerror = () => reject(new Error(`Failed to load: ${src}`));
			document.head.appendChild(s);
	});

	const runWhenIdle = (fn) => {
		if ("requestIdleCallback" in window) {
			requestIdleCallback(fn, { timeout: 2000 });
		} else {
			// Safari fallback
			setTimeout(fn, 1);
		}
	};

	const initGlitch = () => {
		glitchGL({
			target: ".glitchGL",
			intensity: 4.0,
			interaction: {
				enabled: true,
				shape: "square",
				customSize: "100vw",
				effects: {
					pixelation: [],
					crt: ["phosphorGlow", "curvature"],
					glitch: [
						"lineDisplacement",
						"signalDropout",
						"syncErrors",
						"frameGhosting",
						"stutterFreeze",
						"datamoshing",
					],
				},
			},
			effects: {
				pixelation: {
					enabled: true,
					pixelSize: 10,
					pixelShape: "square",
					bitDepth: "none",
					dithering: "bayer",
					pixelDirection: "square",
				},
				crt: {
					enabled: true,
					preset: "computer-monitor",
					curvature: 3,
					lineDirection: "down",
					lineMovement: true,
					lineSpeed: 0.001,
					brightness: 0.25,
					phosphorGlow: 1,
					scanlineIntensity: 0.45,
					scanlineThickness: 1,
					scanlineCount: 200,
					chromaticAberration: 0.7,
				},
				glitch: {
					enabled: true,
					rgbShift: 0,
					digitalNoise: 0.5,
					lineDisplacement: 0,
					bitCrushDepth: 4,
					signalDropoutFreq: 0.03,
					signalDropoutSize: 0.4,
					syncErrorFreq: 0.085,
					syncErrorAmount: 0.141,
					interferenceSpeed: 4.6,
					interferenceIntensity: 1,
					frameGhostAmount: 0.68,
					stutterFreq: 0.4,
					datamoshStrength: 1,
				},
			},
		});
	};


	const lazyLoadGlitchLibsAndInit = async () => {

		await new Promise((r) => requestAnimationFrame(r));

		await loadScript(
			"https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
		);
		await loadScript("./src/js/glitchGL.min.js");

		const video = document.querySelector(".glitched-asset");
		if (video && video.readyState < 2) {
			await new Promise((r) =>
				video.addEventListener("canplay", r, { once: true })
			);
		}

		initGlitch();
		requestAnimationFrame(() => {
			document
				.querySelector(".glitched-asset-container")
				?.classList.add("is-ready");
		});
	};

	runWhenIdle(() => {
		lazyLoadGlitchLibsAndInit().catch((err) => console.error(err));
	});


	

	// Constants for wave animation behavior
	const WAVE_THRESH = 2;
	const CHAR_MULT = 9;
	const ANIM_STEP = 90;
	const WAVE_BUF = 2;

	/**
	 * ASCII ripple animation instance for an element
	 */
	const createASCIIShift = (el, opts = {}) => {
		// State variables
		let origTxt = el.textContent;
		let origChars = origTxt.split("");
		let isAnim = false;
		let cursorPos = 0;
		let waves = [];
		let animId = null;
		let isHover = false;
		let origW = null;

		// options
		const cfg = {
			dur: 900,
			chars: '.,·-+:=*""|||[]/!?&#23456789',
			preserveSpaces: true,
			spread: 0.5,
			...opts,
		};

		/**
		 * Updates cursor position based on mouse move
		 */
		const updateCursorPos = (e) => {
			const rect = el.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const len = origTxt.length;
			const pos = Math.round((x / rect.width) * len);
			cursorPos = Math.max(0, Math.min(pos, len - 1));
		};

		/**
		 * Starts a new wave animation from current cursor pos
		 */
		const startWave = () => {
			waves.push({
				startPos: cursorPos,
				startTime: Date.now(),
				id: Math.random(),
			});

			if (!isAnim) start();
		};

		/**
		 * Clean up expired waves that have exceeded their duration
		 */
		const cleanupWaves = (t) => {
			waves = waves.filter((w) => t - w.startTime < cfg.dur);
		};

		/**
		 * Calculates wave fx for a character at given index
		 * Returns whether to animate and which character to show
		 */
		const calcWaveEffect = (charIdx, t) => {
			let shouldAnim = false;
			let resultChar = origChars[charIdx];

			for (const w of waves) {
				const age = t - w.startTime;
				const prog = Math.min(age / cfg.dur, 1);
				const dist = Math.abs(charIdx - w.startPos);
				const maxDist = Math.max(
					w.startPos,
					origChars.length - w.startPos - 1
				);
				const rad = (prog * (maxDist + WAVE_BUF)) / cfg.spread;

				if (dist <= rad) {
					shouldAnim = true;
					const intens = Math.max(0, rad - dist);

					// Chars in the wave zone shift through character sequence
					if (intens <= WAVE_THRESH && intens > 0) {
						const charIdx =
							(dist * CHAR_MULT + Math.floor(age / ANIM_STEP)) %
							cfg.chars.length;
						resultChar = cfg.chars[charIdx];
					}
				}
			}

			return { shouldAnim, char: resultChar };
		};

		/**
		 * Generates scrambled text based on current waves
		 */
		const genScrambledTxt = (t) =>
			origChars
				.map((char, i) => {
					if (cfg.preserveSpaces && char === " ") return " ";
					const res = calcWaveEffect(i, t);
					return res.shouldAnim ? res.char : char;
				})
				.join("");

		/**
		 * Stops the animation and resets to original text
		 */
		const stop = () => {
			el.textContent = origTxt;
			el.classList.remove("as");

			// Reset width to allow natural text flow
			if (origW !== null) {
				el.style.width = "";
				origW = null;
			}
			isAnim = false;
		};

		/**
		 * Start the animation loop
		 */
		const start = () => {
			if (isAnim) return;

			// Preserve original width to prevent layout shifts
			if (origW === null) {
				origW = el.getBoundingClientRect().width;
				el.style.width = `${origW}px`;
			}

			isAnim = true;
			el.classList.add("as");

			const animate = () => {
				const t = Date.now();

				// Clean up expired waves first
				cleanupWaves(t);

				if (waves.length === 0) {
					stop();
					return;
				}

				// Generate scrambled text
				el.textContent = genScrambledTxt(t);
				animId = requestAnimationFrame(animate);
			};

			animId = requestAnimationFrame(animate);
		};

		/**
		 * Event handlers
		 */
		const handleEnter = (e) => {
			isHover = true;
			updateCursorPos(e);
			startWave();
		};

		const handleMove = (e) => {
			if (!isHover) return;
			const old = cursorPos;
			updateCursorPos(e);
			if (cursorPos !== old) startWave();
		};

		const handleLeave = () => {
			isHover = false;
		};

		/**
		 * Initializes event listeners
		 */
		const init = () => {
			const events = [
				["mouseenter", handleEnter],
				["mousemove", handleMove],
				["mouseleave", handleLeave],
			];
			events.forEach(([evt, handler]) =>
				el.addEventListener(evt, handler)
			);
		};

		/**
		 * Resets animation to original state
		 */
		const resetToOrig = () => {
			waves = [];
			if (animId) {
				cancelAnimationFrame(animId);
				animId = null;
			}

			// Reset width preservation
			if (origW !== null) {
				el.style.width = "";
				origW = null;
			}
			stop();
		};

		/**
		 * Updates the text content
		 */
		const updateTxt = (newTxt) => {
			origTxt = newTxt;
			origChars = newTxt.split("");
			if (!isAnim) el.textContent = newTxt;
		};

		/**
		 * Destroys the instance and cleans up event listeners
		 */
		const destroy = () => {
			resetToOrig();
			["mouseenter", "mousemove", "mouseleave"].forEach((evt, i) =>
				el.removeEventListener(
					evt,
					[handleEnter, handleMove, handleLeave][i]
				)
			);
		};

		// Initialize the instance
		init();

		// public API
		return { updateTxt, resetToOrig, destroy };
	};

	const initASCIIShift = () => {
		// Apply to the H1 and the highlighted span only (so we don't destroy the subtitle's inner span markup)
		const targets = document.querySelectorAll(
			".hero-text-title, .hero-text-inverse"
		);

		targets.forEach((el) => {
			if (!el.textContent.trim()) return;
			createASCIIShift(el, { dur: 1000, spread: 1 });
		});
	};
	initASCIIShift(); // end ASCII shift init


});
