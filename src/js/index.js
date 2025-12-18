console.log("THREE exists?", typeof THREE);
console.log("glitchGL exists?", typeof glitchGL);

document.addEventListener("DOMContentLoaded", () => {

	const glitchEffect = glitchGL({
		target: ".glitchGL",
		intensity: 4.0,
		interaction: {
			enabled: true,
			shape: "square",
			customSize: "200vw",
			effects: {
				pixelation: [],
				crt: [
					"chromaticAberration",
					"phosphorGlow",
					"curvature",
					"scanlines",
				],
				glitch: [
					"rgbShift",
					"lineDisplacement",
					"signalDropout",
					"syncErrors",
					"interferenceLines",
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
				dithering: "floyd-steinberg",
				pixelDirection: "square",
			},
			crt: {
				enabled: true,
				preset: "computer-monitor",
				curvature: 1,
				lineDirection: "left",
				lineMovement: true,
				lineSpeed: 0.3,
				brightness: 0.15,
        		phosphorGlow: 2.5,
				scanlineIntensity: 0.2,
			},
			glitch: {
				enabled: true,
				rgbShift: 0,
				digitalNoise: 0.35,
				lineDisplacement: 0,
				bitCrushDepth: 7,
				signalDropoutFreq: 0.03,
				signalDropoutSize: 0.4,
				syncErrorFreq: 0.085,
				syncErrorAmount: 0.141,
				interferenceSpeed: 4.6,
				interferenceIntensity: 1,
				frameGhostAmount: 0.68,
				stutterFreq: 0.4,
				datamoshStrength: 0.7,
			},
		},
		on: {
			init: function (instance) {
				console.log(
					"glitchGL digital glitch demo initialized!",
					instance
				);
			},
		},
	});
});
