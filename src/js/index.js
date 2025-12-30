// --------------------------------------------------------------------------
// ---------------------- Glitch effect initialization ----------------------
// --------------------------------------------------------------------------

const initGlitch = () => {
	const sizeCursor =
		window.innerWidth > window.innerHeight ? "100vw" : "100vh";

	glitchGL({
		target: ".glitchGL",
		intensity: 4.0,
		interaction: {
			enabled: true,
			shape: "square",
			customSize: sizeCursor,
			effects: {
				pixelation: [],
				crt: [
					// "phosphorGlow",
					"curvature",
				],
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
				pixelSize: 7,
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
				lineSpeed: 0.0005,
				brightness: 0.27, // 0.225 is what I had when I used when the mouse affected this
				phosphorGlow: 1.25, // 0.9 is what I had when I used when the mouse affected this
				scanlineDirection: "down",
				scanlineIntensity: 0.3,
				scanlineThickness: 1.5,
				scanlineCount: 350,
				chromaticAberration: 0.7,
			},
			glitch: {
				enabled: true,
				rgbShift: 0,
				digitalNoise: 0.4,
				lineDisplacement: 0,
				bitCrushDepth: 2,
				signalDropoutFreq: 0.03,
				signalDropoutSize: 0.4,
				syncErrorFreq: 0.05, //0.085
				syncErrorAmount: 0.05, //0.141
				interferenceSpeed: 1,
				interferenceIntensity: 0.1,
				frameGhostAmount: 0.68,
				stutterFreq: 0.4,
				datamoshStrength: 1,
			},
		},
	});
};

// ----------------------------------------------------------------
// ---------------------- Lazy load section  ----------------------
// ----------------------------------------------------------------

const GLITCH_LIBS = {
	// three: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
	three: "./src/js/glitchGLFiles/three.min.js",
	glitch: "./src/js/glitchGLFiles/glitchGL.min.js",
};

const runWhenIdle = (fn, timeout = 2000) => {
	if ("requestIdleCallback" in window) {
		requestIdleCallback(fn, { timeout });
	} else {
		setTimeout(fn, 10);
	}
};

const scriptPromises = new Map();

const loadScript = (src) => {
	if (scriptPromises.has(src)) return scriptPromises.get(src);

	const p = new Promise((resolve, reject) => {
		const s = document.createElement("script");
		s.src = src;
		s.async = false; // keep ordered execution for three -> glitchGL
		s.onload = resolve;
		s.onerror = () => reject(new Error(`Failed to load: ${src}`));
		document.head.appendChild(s);
	});

	scriptPromises.set(src, p);
	return p;
};

const whenVideoCanPlay = (video) => {
	// 0 HAVE_NOTHING | 1 HAVE_METADATA | 2 HAVE_CURRENT_DATA |
	// 3 HAVE_FUTURE_DATA | 4 HAVE_ENOUGH_DATA
	if (video.readyState >= 2) return Promise.resolve();

	return new Promise((resolve) =>
		video.addEventListener("canplay", resolve, { once: true })
	);
};

const setGlitchReady = () => {
	const container = document.querySelector(".glitched-asset-container");

	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			container.classList.add("is-ready");
		});
	});
};

runWhenIdle(async () => {
	try {
		const video = document.getElementById("glitched-asset");

		await loadScript(GLITCH_LIBS.three);
		await loadScript(GLITCH_LIBS.glitch);

		await whenVideoCanPlay(video);

		initGlitch();
		setGlitchReady();
	} catch (err) {
		console.error(err);
	}
});

// ----------------------------------------------------------------
// ---------------------- ASCII Shift Effect ----------------------
// ----------------------------------------------------------------

window.initASCIIShift();

// ----------------------------------------------------------------
// ---------------------- Animation Fade Ins ----------------------
// ----------------------------------------------------------------

const fadeEls = document.querySelectorAll(".fade-in");
const fadeObserver = new IntersectionObserver((entries) => {
	entries.forEach((entry) => {
		if (entry.isIntersecting) {
			const el = entry.target;
			el.classList.add("is-visible");
			fadeObserver.unobserve(el);

			// ASCII hook
			const asciiTargets = el.querySelectorAll(".ascii-on-fade");
			asciiTargets.forEach((t) => {
				window.asciiInstances.get(t)?.triggerWave({
					at: 0.5,
					repeat: 5,
					interval: 100,
				});
			});
		}
	});
});

fadeEls.forEach((el) => fadeObserver.observe(el));

// ---------------------------------------------------------------
// ---------------------- My Links dropdown ----------------------
// ---------------------------------------------------------------

const linksContainer = document.querySelector(".links-container");
const linksContainerBtn = document.querySelector(".links-container-btn");
const socialMenu = document.querySelector("#social-menu");
let linksContainerOpen = false;
let suppressNextClickToggle = false;

function setMenu(state) {
	if (linksContainerOpen === state) return;

	linksContainer.classList.toggle("is-open", state);
	linksContainerBtn.setAttribute("aria-expanded", state ? "true" : "false");
	socialMenu.hidden = !state;
	linksContainerOpen = state;

	// console.log(linksContainerOpen)
}

linksContainerBtn.addEventListener("click", () => {
	if (suppressNextClickToggle) {
		suppressNextClickToggle = false;
		return;
	}
	setMenu(!linksContainerOpen);
});

linksContainerBtn.addEventListener("mouseenter", () => {
	if (!linksContainerOpen) suppressNextClickToggle = true;
	setMenu(true);
});

linksContainer.addEventListener("mouseleave", () => {
	if (!linksContainerOpen) return;
	setMenu(false);
	suppressNextClickToggle = false;
});

linksContainer.addEventListener("focusin", () => {
	setMenu(true);
});

linksContainer.addEventListener("focusout", () => {
	requestAnimationFrame(() => {
		if (!linksContainer.contains(document.activeElement)) {
			setMenu(false);
		}
	});
});

document.addEventListener("keydown", (e) => {
	if (e.key === "Escape") {
		setMenu(false);
		// linksContainerBtn.focus(); Note: Once other elements are in, might want to adjust this.
	}
});

// -------------------------------------------------------------------
// ---------------------- Logo Scroll Animation ----------------------
// -------------------------------------------------------------------

const logoImg = document.querySelector(".logo");
if (logoImg) {
	let ticking = false;

	const updateLogoRotation = () => {
		const scrollTop =
			window.scrollY || document.documentElement.scrollTop;
		const maxScroll =
			document.documentElement.scrollHeight - window.innerHeight || 1;

		const progress = scrollTop / maxScroll; // 0 -> 1
		const turns = 1; // 1 = 360°, 2 = 720°, etc.
		const deg = progress * 360 * turns;

		logoImg.style.transform = `rotate(${deg}deg)`;
		ticking = false;
	};

	const onScroll = () => {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(updateLogoRotation);
	};

	updateLogoRotation(); // set initial
	window.addEventListener("scroll", onScroll, { passive: true });
	window.addEventListener("resize", updateLogoRotation);
}

