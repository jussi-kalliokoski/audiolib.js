/*
	wrapper-end.js
	Please note that this file is of invalid syntax if standalone.
*/

/* Controls */
audioLib.ADSREnvelope	= ADSREnvelope;
audioLib.StepSequencer	= StepSequencer;
audioLib.UIControl	= UIControl;

/* Effects */
audioLib.BiquadFilter	= BiquadFilter;
audioLib.BitCrusher	= BitCrusher;
audioLib.Chorus		= Chorus;
audioLib.CombFilter	= CombFilter;
audioLib.Compressor	= Compressor;
audioLib.Convolution	= Convolution;
audioLib.Delay		= Delay;
audioLib.Distortion	= Distortion;
audioLib.GainController	= GainController;
audioLib.IIRFilter	= IIRFilter;
audioLib.LP12Filter	= LP12Filter;
audioLib.Limiter	= Limiter;
audioLib.Reverb		= Freeverb;

/* Geneneration */
audioLib.Noise		= Noise;
audioLib.Oscillator	= Oscillator;
audioLib.Sampler	= Sampler;

/* Processing */
audioLib.Amplitude	= Amplitude;
audioLib.FFT		= FFT;

/* Miscellaneous */

/* FIXME: The should be templated somehow as well */
audioLib.AudioDevice			= audioLib.Sink = (function () { return this; } () ).Sink;
audioLib.Automation			= Automation;
audioLib.BufferEffect			= BufferEffect;
audioLib.EffectClass			= EffectClass;
audioLib.GeneratorClass			= GeneratorClass;
audioLib.codecs				= audioLib.Codec = Codec;
audioLib.plugins			= Plugin;

/* Trigger the ready event (all is registered) */

while (onready.list.length) {
	onready.list.shift().call(audioLib);
}
onready = null;

/* Handle inheritance */

void function (names, i) {
	function effects (name, effect, prototype, argNames) {
		var proto, k;

		if (effect) {
			prototype = prototype || effect.prototype;
			proto = effect.prototype = new EffectClass();
			proto.name = proto.fxid = name;

			effects[name] = __class(name, effect, argNames);

			for (k in prototype) {
				if (prototype.hasOwnProperty(k)){
					proto[k] = prototype[k];
				}
			}

			for (k in EffectClass) {
				if (k !== 'prototype' && EffectClass.hasOwnProperty(k)) {
					effects[name][k] = EffectClass[k];
				}
			}
		}

		return effects[name];
	}



	audioLib.effects = effects;

	for (i=0; i<names.length; i++) {
		audioLib[names[i]] = effects(names[i], audioLib[names[i]], audioLib[names[i]].prototype);
	}

	effects('BiquadAllPassFilter',	BiquadFilter.AllPass);
	effects('BiquadBandPassFilter',	BiquadFilter.BandPass);
	effects('BiquadHighPassFilter',	BiquadFilter.HighPass);
	effects('BiquadLowPassFilter',	BiquadFilter.LowPass);
	effects('FreeverbAllPassFilter',Freeverb.AllPassFilter);
}(['BiquadFilter', 'BitCrusher', 'Chorus', 'CombFilter', 'Compressor', 'Convolution', 'Delay', 'Distortion', 'GainController', 'IIRFilter', 'LP12Filter', 'Limiter', 'Reverb', 'Amplitude', 'FFT']);

void function (names, i) {
	function generators (name, effect, prototype, argNames) {
		var proto, k;

		if (effect) {
			prototype = prototype || effect.prototype;
			proto = effect.prototype = new GeneratorClass();

			proto.name = proto.fxid = name;
			generators[name] = __class(name, effect, argNames);

			for (k in prototype) {
				if (prototype.hasOwnProperty(k)) {
					proto[k] = prototype[k];
				}
			}

			for (k in GeneratorClass) {
				if (k !== 'prototype' && GeneratorClass.hasOwnProperty(k)) {
					generators[name][k] = GeneratorClass[k];
				}
			}
		}
		return generators[name];
	}

	audioLib.generators = generators;

	for (i=0; i<names.length; i++) {
		audioLib[names[i]] = generators(names[i], audioLib[names[i]], audioLib[names[i]].prototype);
	}
}(['Noise', 'Oscillator', 'Sampler', 'ADSREnvelope', 'StepSequencer', 'UIControl']);

/* FIXME: Make this happen based on the features we have */
Codec('wav', audioLib.PCMData);

audioLib.version = '0.6.5';

return audioLib;
}).call(typeof exports === 'undefined' ? {} : this, this.window || global, Math, Object, Array);
