/*
	wrapper-end.js
	Please note that this file is of invalid syntax if standalone.
*/

// Controls
audioLib.ADSREnvelope		= ADSREnvelope;
audioLib.StepSequencer		= StepSequencer;
audioLib.UIControl		= UIControl;


//Effects
audioLib.BiquadFilter	= BiquadFilter;
audioLib.BitCrusher	= BitCrusher;
audioLib.Chorus		= Chorus;
audioLib.CombFilter	= CombFilter;
audioLib.Compressor	= Compressor;
audioLib.Delay		= Delay;
audioLib.Distortion	= Distortion;
audioLib.GainController	= GainController;
audioLib.IIRFilter	= IIRFilter;
audioLib.Limiter	= Limiter;
audioLib.LP12Filter	= LP12Filter;
audioLib.Reverb		= Freeverb;


//Geneneration
audioLib.Oscillator	= Oscillator;
audioLib.Sampler	= Sampler;
audioLib.Noise		= Noise;


//Processing
audioLib.Amplitude		= Amplitude;
audioLib.AudioProcessingUnit	= AudioProcessingUnit;
audioLib.FFT			= FFT;


audioLib.AudioDevice	= audioLib.Sink = (function(){ return this; }()).Sink;

(function(names, i){
	function createBufferBased(channelCount){
		return new audioLib.BufferEffect(this, channelCount, [].slice.call(arguments, 1));
	}

	function effects(name, effect, prototype, argNames){
		if (effect){
			prototype	= prototype || effect.prototype;
			var	proto	= effect.prototype = new EffectClass();
			proto.name	= proto.fxid = name;
			effects[name]	= __class(name, effect, argNames);
			effects[name].createBufferBased = effect.createBufferBased = createBufferBased;
			for (argNames in prototype){
				if (prototype.hasOwnProperty(argNames)){
					proto[argNames] = prototype[argNames];
				}
			}
		}
		return effects[name];
	}



	audioLib.effects = effects;

	for (i=0; i<names.length; i++){
		audioLib[names[i]] = effects(names[i], audioLib[names[i]], audioLib[names[i]].prototype);
	}

	effects('BiquadHighPassFilter', BiquadFilter.HighPass);
	effects('BiquadLowPassFilter', BiquadFilter.LowPass);
	effects('BiquadAllPassFilter', BiquadFilter.AllPass);
	effects('BiquadBandPassFilter', BiquadFilter.BandPass);
}(['BiquadFilter', 'BitCrusher', 'Chorus', 'CombFilter', 'Compressor', 'Delay', 'Distortion', 'GainController', 'IIRFilter', 'Limiter', 'LP12Filter', 'Reverb', 'Amplitude', 'FFT']));

(function(names, i){
	function generators(name, effect, prototype, argNames){
		if (effect){
			prototype	= prototype || effect.prototype;
			var	proto	= effect.prototype = new GeneratorClass();
			proto.name	= proto.fxid = name;
			generators[name]= __class(name, effect, argNames);
			for (argNames in prototype){
				if (prototype.hasOwnProperty(argNames)){
					proto[argNames] = prototype[argNames];
				}
			}
		}
		return generators[name];
	}

	audioLib.generators = generators;

	for (i=0; i<names.length; i++){
		audioLib[names[i]] = generators(names[i], audioLib[names[i]], audioLib[names[i]].prototype);
	}
}(['Oscillator', 'Sampler', 'Noise', 'ADSREnvelope', 'StepSequencer', 'UIControl']));

Codec('wav', audioLib.PCMData);

audioLib.Automation			= Automation;
audioLib.BufferEffect			= BufferEffect;
audioLib.EffectChain			= EffectChain;
audioLib.EffectClass			= EffectClass;
audioLib.GeneratorClass			= GeneratorClass;
audioLib.codecs				= audioLib.Codec = Codec;
audioLib.plugins			= Plugin;

audioLib.version			= '0.5.0';

audioLib.BufferEffect.prototype.addAutomation	=
audioLib.EffectClass.prototype.addAutomation	=
audioLib.GeneratorClass.prototype.addAutomation	=
function addAutomation(){
	return audioLib.Automation.apply(audioLib, [this].concat([].slice.call(arguments)));
};

return audioLib;
}).call(typeof exports === 'undefined' ? {} : this, this.window || global, Math, Object, Array);
