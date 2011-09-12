/*
	audiolib.js
	Jussi Kalliokoski
	https://github.com/jussi-kalliokoski/audiolib.js
	MIT license
*/

/*
	wrapper-start.js
	Please note that the file is not of valid syntax when standalone.
*/

this.audioLib = (function AUDIOLIB(global, Math, Object, Array){

var	arrayType	= global.Float32Array || Array,
	audioLib	= this;

function Float32Array(length){
	var array = new arrayType(length);
	array.subarray = array.subarray || array.slice;
	return array;
}

audioLib.Float32Array = Float32Array;

var __define = (function(){

	if (Object.defineProperty){
		return Object.defineProperty;
	} else if (Object.prototype.__defineGetter__){
		return function(obj, prop, desc){
			desc.get && obj.__defineGetter__(prop, desc.get);
			desc.set && obj.__defineSetter__(prop, desc.set);
		}
	}

}());

function __defineConst(obj, prop, value, enumerable){
	if (__define){
		__define(obj, prop, {
			get: function(){
				return value;
			},
			enumerable: !!enumerable
		});
	} else {
		// Cheap...
		obj[prop] = value;
	}
}

__defineConst(audioLib, '__define', __define);
__defineConst(audioLib, '__defineConst', __defineConst);

function __extend(obj){
	var	args	= arguments,
		l	= args.length,
		i, n;
	for (i=1; i<l; i++){
		for (n in args[i]){
			if (args[i].hasOwnProperty(n)){
				obj[n] = args[i][n];
			}
		}
	}
	return obj;
}

__defineConst(audioLib, '__extend', __extend);

function __enum(obj, callback, unignoreInherited){
	var i;
	for (i in obj){
		(obj.hasOwnProperty(i) || unignoreInherited) && callback.call(obj, obj[i], i);
	}
	return obj;
}

__defineConst(audioLib, '__enum', __enum);

function __class(name, constructor, args){
	var	i, cls;
	if (!args){
		args	= [];
		i	= /^\s*function\s*\w*\s*\(([^\)]+)/.exec(constructor);
		if (i){
			i[1].replace(/[a-z$_0-9]+/ig, function(i){
				args.push(i);
			});
		} else {
			for (i=0; i<constructor.length; i++){
				args[i] = Array(i+2).join('_');
			}
		}
	}
	cls = Function('var __q;return function ' + name + '(' + args.join() + '){var i; if(__q){__q=!__q}else if(this instanceof ' + name +')this.__CLASSCONSTRUCTOR.apply(this,arguments);else{__q=!__q;i=new ' + name + ';i.__CLASSCONSTRUCTOR.apply(i,arguments);return i}};')();
	cls.prototype = constructor.prototype;
	cls.prototype.__CLASSCONSTRUCTOR = constructor;
	__extend(cls, constructor);
	return cls;
}

__defineConst(audioLib, '__class', __class);
/**
 * Creates an ADSR envelope.
 *
 * @constructor
 * @this {ADSREnvelope}
 * @param {number} sampleRate Sample Rate (hz).
 * @param {number} attack (Optional) Attack (ms).
 * @param {number} decay (Optional) Decay (ms).
 * @param {number} sustain (Optional) Sustain (unsigned double).
 * @param {number} release (Optional) Release (ms).
 * @param {number} sustainTime (Optional) The time the sustain mode lasts (ms).
 * @param {number} releaseTime (Optional) The time the release mode lasts (ms).
*/
function ADSREnvelope(sampleRate, attack, decay, sustain, release, sustainTime, releaseTime){
	this.sampleRate		= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.attack		= isNaN(attack) ? this.attack : attack;
	this.decay		= isNaN(decay) ? this.decay : decay;
	this.sustain		= isNaN(sustain) ? this.sustain : sustain;
	this.release		= isNaN(release) ? this.release : release;
	this.sustainTime	= isNaN(sustainTime) ? null : sustainTime;
	this.releaseTime	= isNaN(releaseTime) ? null : releaseTime;
}

ADSREnvelope.prototype = {
	/** The sample rate of the envelope */
	sampleRate:	44100,
	/** The attack of the envelope, in ms */
	attack:		50,
	/** The decay of the envelope, in ms */
	decay:		50,
	/** The value for the sustain state of the envelope, 0.0 - 1.0 */
	sustain:	1,
	/** The release of the envelope, in ms */
	release:	50,
	/** The current value of the envelope */
	value:		0,
	/** The current state of the envelope */
	state:		3,
	/** The state of the gate of the envelope, open being true */
	gate:		false,
	/** The time the sustain phase should be sustained before launching release. If null, will wait for triggerGate. */
	sustainTime:	null,
	/** The time the release phase should be sustained before relaunching attack. If null, will wait for triggerGate. */
	releaseTime:	null,
/**
 * Private variable for timing the timed sustain and release.
 *
 * @private
*/
	_st: 0,
/**
 * Moves the envelope status one sample further in sample-time.
 *
 * @return {Number} The current value of the envelope.
*/
	generate: function(){
		this.states[this.state].call(this);
		return this.value;
	},
/**
 * Returns the current value of the envelope.
 *
 * @return {Number} The current value of the envelope.
*/
	getMix: function(){
		return this.value;
	},
/**
 * Sets the state of the envelope's gate.
 *
 * @param {Boolean} isOpen The new state of the gate.
*/
	triggerGate: function(isOpen){
		isOpen		= typeof isOpen === 'undefined' ? !this.gate : isOpen;
		this.gate	= isOpen;
		this.state	= isOpen ? 0 : this.releaseTime === null ? 3 : 5;
		this._st	= 0;
	},
/**
 * Array of functions for handling the different states of the envelope.
*/
	states: [
		function(){ // Attack
			this.value += 1000 / this.sampleRate / this.attack;
			if (this.value >= 1){
				this.state = 1;
			}
		},
		function(){ // Decay
			this.value -= 1000 / this.sampleRate / this.decay * this.sustain;
			if (this.value <= this.sustain){
				if (this.sustainTime === null){
					this.state	= 2;
				} else {
					this._st	= 0;
					this.state	= 4;
				}
			}
		},
		function(){ // Sustain
			this.value = this.sustain;
		},
		function(){ // Release
			this.value = Math.max(0, this.value - 1000 / this.sampleRate / this.release);
		},
		function(){ // Timed sustain
			this.value = this.sustain;
			if (this._st++ >= this.sampleRate * 0.001 * this.sustainTime){
				this._st	= 0;
				this.state	= this.releaseTime === null ? 3 : 5;
			}
		},
		function(){ // Timed release
			this.value = Math.max(0, this.value - 1000 / this.sampleRate / this.release);
			if (this._st++ >= this.sampleRate * 0.001 * this.releaseTime){
				this._st	= 0;
				this.state	= 0;
			}
		}
	]
};
/**
 * Creates a StepSequencer.
 *
 * @constructor
 * @this {StepSequencer}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} stepLength (Optional) Step Length (ms).
 * @param {Array} steps (Optional) Array of steps (unsigned double) for the sequencer to iterate.
 * @param {number} attack (Optional) Attack.
*/
function StepSequencer(sampleRate, stepLength, steps, attack){
	var	self	= this,
		phase	= 0;

	this.sampleRate		= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.stepLength		= isNaN(stepLength) ? this.stepLength : stepLength;
	this.steps		= steps || [1, 0];
	this.attack		= isNaN(attack) ? this.attack : attack;
}

StepSequencer.prototype = {
	/** The sample rate of the step sequencer */
	sampleRate:	44100,
	/** The length a single step of the step sequencer, in ms */
	stepLength:	200,
	/** An array of the steps of the step sequencer */
	steps:		null,
	/** The current value of the step sequencer */
	value:		0,
	/** Transition time between steps, measured in steps */
	attack:		0,
	/** The current phase of the step sequencer */
	phase:		0,

/**
 * Moves the step sequencer one sample further in sample time.
 *
 * @return {Number} The current value of the step sequencer.
*/
	generate: function(){
		var	self		= this,
			stepLength	= self.sampleRate / 1000 * self.stepLength,
			steps		= self.steps,
			sequenceLength	= stepLength * steps.length,
			step, overStep, prevStep, stepDiff,
			val;
		self.phase	= (self.phase + 1) % sequenceLength;
		step		= self.phase / sequenceLength * steps.length;
		overStep	= step % 1;
		step		= Math.floor(step);
		prevStep	= (step || steps.length) - 1;
		stepDiff	= steps[step] - steps[prevStep];
		val		= steps[step];
		if (overStep < self.attack){
			val -= stepDiff - stepDiff / self.attack * overStep;
		}
		self.value = val;
		return val;
	},
/**
 * Returns the current value of the step sequencer.
 *
 * @return {Number} The current value of the step sequencer.
*/
	getMix: function(){
		return this.value;
	},
/** Triggers the gate for the step sequencer, resetting its phase to zero. */
	triggerGate: function(){
		this.phase = 0;
	}
};
/**
 * UIControl is a tool for creating smooth, latency-balanced UI controls to interact with audio.
 *
 * @constructor
 * @this {UIControl}
 * @param {Number} sampleRate The sample rate of the UI control.
 * @param {Number} value The initial value of the UI control.
*/
function UIControl(sampleRate, value){
	this.sampleRate	= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.schedule	= [];
	this.reset(value);
}

UIControl.prototype = {
	/** The sample rate of the UI control */
	sampleRate:	44100,
	/** The value of the UI control */
	value:		1,
	/** The internal schedule array of the UI control */
	schedule:	null,
	/** The internal clock of the UI control, indicating the previous time of a buffer callback */
	clock:		0,
/**
 * Returns the current value of the UI control
 *
 * @return {Number} The current value of the UI control
*/
	getMix:		function(){
		return this.value;
	},
	/** Moves the UI control one sample forward in the sample time */
	generate:	function(){
		var i;
		for (i=0; i<this.schedule.length; i++){
			if (this.schedule[i].t--){
				this.value = this.schedule[i].v;
				this.schedule.splice(i--, 1);
			}
		}
	},
/**
 * Sets the value of the UI control, latency balanced
 *
 * @param {Number} value The new value.
*/
	setValue:	function(value){
		this.schedule.push({
			v:	value,
			t:	~~((+new Date - this.clock) / 1000 * this.sampleRate)
		});
	},
	reset: function(value){
		this.value	= isNaN(value) ? this.value : value;
		this.clock	= +new Date;
	}
};
// Adapted from http://www.musicdsp.org/files/Audio-EQ-Cookbook.txt

/**
 * A Custom Biquad Filter Effect
 * http://en.wikipedia.org/wiki/Digital_biquad_filter
 * 
 * @constructor
 * @this {BiquadFilter}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} b0 Biquadratic difference equation parameter
 * @param {number} b1 Biquadratic difference equation parameter
 * @param {number} b2 Biquadratic difference equation parameter
 * @param {number} a1 Biquadratic difference equation parameter
 * @param {number} a2 Biquadratic difference equation parameter
*/
function BiquadFilter(sampleRate, b0, b1, b2, a1, a2){
	this.reset.apply(this, arguments)
}

/**
 * A generic Biquad Filter class, used internally to create BiquadFilter classes.
 * @constructor
 * @this BiquadFilterClass
*/
BiquadFilter.BiquadFilterClass = function BiquadFilterClass(){
	var k;
	for (k in BiquadFilterClass.prototype){
		if (BiquadFilterClass.prototype.hasOwnProperty){
			this[k] = this[k];
		}
	}
};

BiquadFilter.BiquadFilterClass.prototype = {
	sampleRate:	44100,
	sample:		0,
	inputs:		null,
	outputs:	null,
	coefs:		null,
	pushSample: function(s){
		var	c	= this.coefs,
			i	= this.inputs,
			o	= this.outputs;
		this.sample = c.b0 * s + c.b1 * i[0] + c.b2 * i[1] - c.a1 * o[0] - c.a2 * o[1];
		i.pop();
		i.unshift(s);
		o.pop();
		o.unshift(this.sample);
		return this.sample;
	},
	getMix: function(){
		return this.sample;
	},
	reset: function(sampleRate, b0, b1, b2, a1, a2){
		this.inputs = [0,0];
		this.outputs = [0,0];
		this.sampleRate = isNaN(sampleRate) ? this.sampleRate : sampleRate;
		if (arguments.length > 1){
			this.coefs	= { b0:b0, b1:b1, b2:b2, a1:a1, a2:a2 };
		}
	}
};

/**
 * Creates a Biquad Low-Pass Filter Effect
 * 
 * @constructor
 * @this {BiquadFilter}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} cutoff Low-pass cutoff frequency (hz).
 * @param {number} Q Filter Q-factor (Q<0.5 filter underdamped, Q>0.5 filter overdamped)
*/
BiquadFilter.LowPass = function(sampleRate, cutoff, Q){
	var	w0	= 2* Math.PI*cutoff/sampleRate,
		cosw0	= Math.cos(w0),
		sinw0   = Math.sin(w0),
		alpha   = sinw0/(2*Q),
		b0	=  (1 - cosw0)/2,
		b1	=   1 - cosw0,
		b2	=   b0,
		a0	=   1 + alpha,
		a1	=  -2*cosw0,
		a2	=   1 - alpha;
	this.reset(sampleRate, b0/a0, b1/a0, b2/a0, a1/a0, a2/a0);
};

/**
 * Creates a Biquad High-Pass Filter Effect
 * 
 * @constructor
 * @this {BiquadFilter}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} cutoff High-pass cutoff frequency (hz).
 * @param {number} Q Filter Q-factor (Q<0.5 filter underdamped, Q>0.5 filter overdamped)
*/
BiquadFilter.HighPass = function(sampleRate, cutoff, Q){
	var	w0	= 2* Math.PI*cutoff/sampleRate,
		cosw0   = Math.cos(w0),
		sinw0   = Math.sin(w0),
		alpha   = sinw0/(2*Q),
		b0	=  (1 + cosw0)/2,
		b1	= -(1 + cosw0),
		b2	=   b0,
		a0	=   1 + alpha,
		a1	=  -2*cosw0,
		a2	=   1 - alpha;
	this.reset(sampleRate, b0/a0, b1/a0, b2/a0, a1/a0, a2/a0);
};

/**
 * Creates a Biquad All-Pass Filter Effect
 * 
 * @constructor
 * @this {BiquadFilter}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} f0 Significant frequency: filter will cause a phase shift of 180deg at f0 (hz).
 * @param {number} Q Filter Q-factor (Q<0.5 filter underdamped, Q>0.5 filter overdamped)
*/
BiquadFilter.AllPass = function(sampleRate, f0, Q){
	var	w0	= 2* Math.PI*f0/sampleRate,
		cosw0   = Math.cos(w0),
		sinw0   = Math.sin(w0),
		alpha   = sinw0/(2*Q),
		b0	=  1 - alpha,
		b1	= -2*cosw0,
		b2	=  1 + alpha,
		a0	=  b2,
		a1	=  b1,
		a2	=  b0;
	this.reset(sampleRate, b0/a0, b1/a0, b2/a0, a1/a0, a2/a0);
};

/**
 * Creates a Biquad Band-Pass Filter Effect
 * 
 * @constructor
 * @this {BiquadFilter}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} centerFreq Center frequency of filter: 0dB gain at center peak
 * @param {number} bandwidthInOctaves Bandwitdth of the filter (between -3dB points), specified in octaves
*/
BiquadFilter.BandPass = function(sampleRate, centerFreq, bandwidthInOctaves){
	var	w0	= 2* Math.PI*centerFreq/sampleRate,
		cosw0	= Math.cos(w0),
		sinw0	= Math.sin(w0),
		toSinh	= Math.log(2)/2 * bandwidthInOctaves * w0/sinw0,
		alpha	= sinw0*(Math.exp(toSinh) - Math.exp(-toSinh))/2,
		b0	= alpha,
		b1	= 0,
		b2	= -alpha,
		a0	= 1 + alpha,
		a1	= -2 * cosw0,
		a2	= 1 - alpha;
	this.reset(sampleRate, b0/a0, b1/a0, b2/a0, a1/a0, a2/a0);
};

(function(classes, i){
for (i=0; i<classes.length; i++){
	classes[i].prototype = new BiquadFilter.BiquadFilterClass();
}
}([BiquadFilter, BiquadFilter.LowPass, BiquadFilter.HighPass, BiquadFilter.AllPass, BiquadFilter.BandPass]));
// Adapted from http://www.musicdsp.org/archive.php?classid=4#139

/**
 * Creates a Bit Crusher Effect
 * 
 * @constructor
 * @this {BitCrusher}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} bits (Optional) Bit resolution of output signal. Defaults to 8.
*/
function BitCrusher(sampleRate, bits){
	var	self	= this,
		sample  = 0.0;
	self.sampleRate	= sampleRate;
	self.resolution	= bits ? Math.pow(2, bits-1) : Math.pow(2, 8-1); // Divided by 2 for signed samples (8bit range = 7bit signed)
	self.pushSample	= function(s){
		sample	= Math.floor(s*self.resolution+0.5)/self.resolution
		return sample;
	};
	self.getMix = function(){
		return sample;
	};
}
// Depends on oscillator.

/**
 * Creates a Chorus effect.
 *
 * @constructor
 * @this {Chorus}
 * @param {number} sampleRate Sample Rate (hz).
 * @param {number} delayTime (Optional) Delay time (ms).
 * @param {number} depth (Optional) Depth.
 * @param {number} freq (Optional) Frequency (hz) of the LFO.
*/
function Chorus(sampleRate, delayTime, depth, freq){
	var	self		= this,
		buffer, bufferPos, sample;

	self.delayTime	= delayTime || 30;
	self.depth	= depth	|| 3;
	self.freq	= freq || 0.1;

	function calcCoeff(){
		buffer = new Float32Array(self.sampleRate * 0.1);
		bufferPos = 0;
		var i, l = buffer.length;
		for (i=0; i<l; i++){
			buffer[i] = 0.0;
		}
	}

	self.sampleRate = sampleRate;
	self.osc = new Oscillator(sampleRate, freq);
	self.calcCoeff = calcCoeff;
	self.pushSample = function(s){
		if (++bufferPos >= buffer.length){
			bufferPos = 0;
		}
		buffer[bufferPos] = s;
		self.osc.generate();

		var delay = self.delayTime + self.osc.getMix() * self.depth;
		delay *= self.sampleRate / 1000;
		delay = bufferPos - Math.floor(delay);
		while(delay < 0){
			delay += buffer.length;
		}

		sample = buffer[delay];
		return sample;
	};
	self.getMix = function(){
		return sample;
	};

	calcCoeff();
}

/**
 * Creates a Comb Filter effect.
 *
 * @constructor
 * @this {CombFilter}
 * @param {number} sampleRate Sample Rate (hz).
 * @param {number} delaySize Size (in samples) of the delay line buffer.
 * @param {number} feedback (Optional) Amount of feedback (0.0-1.0). Defaults to 0.84 (Freeverb default)
 * @param {number} damping (Optional) Amount of damping (0.0-1.0). Defaults to 0.2 (Freeverb default)
*/
function CombFilter(sampleRate, delaySize, feedback, damping){
	var	self	= this;
	self.sampleRate	= sampleRate;
	self.buffer	= new Float32Array(isNaN(delaySize) ? 1200 : delaySize);
	self.bufferSize	= self.buffer.length;
	self.feedback	= isNaN(feedback) ? self.feedback : feedback;
	self.damping	= isNaN(damping) ? self.damping : damping;
	self.invDamping	= 1 - self.damping;
}

CombFilter.prototype = {
	sample:		0.0,
	index:		0,
	store:		0,

	feedback:	0.84,
	damping:	0.2,

	pushSample: function(s){
		var	self	= this;
		self.sample	= self.buffer[self.index];
		self.store	= self.sample * self.invDamping + self.store * self.damping;
		self.buffer[self.index++] = s + self.store * self.feedback;
		if (self.index >= self.bufferSize) {
			self.index = 0;
		}
		return self.sample;
	},
	getMix: function(){
		return this.sample;
	},
	reset: function(){
		this.index	= this.store = 0;
		this.samples	= 0.0;
		this.buffer	= new Float32Array(this.bufferSize);
	},
	setParam: function(param, value){
		switch (param){
		case 'damping':
			this.damping	= value;
			this.invDamping	= 1 - value;
			break;
		default:
			this[param] = value;
			break;
		}
	}

};
/**
 * Creates a Compressor Effect
 * 
 * @constructor
 * @this {Compressor}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} scaleBy (Optional) Signal scaling factor. If mixing n unscaled waveforms, use scaleBy=n.
 * @param {number} gain (Optional) Gain factor (1.0 - 2.0).
*/
function Compressor(sampleRate, scaleBy, gain){
	var	self	= this,
		sample  = 0.0;
	self.sampleRate	= sampleRate;
	self.scale	= scaleBy || 1;
	self.gain	= gain || 0.5;
	self.pushSample = function(s){
		s	/= self.scale;
		sample	= (1 + self.gain) * s - self.gain * s * s * s;
		return sample;
	};
	self.getMix = function(){
		return sample;
	};
}
/**
 * Creates a Delay effect.
 *
 * @constructor
 * @this {Delay}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} time (Optional) Delay time (ms).
 * @param {number} feedback (Optional) Feedback (unsigned double).
*/
function Delay(sampleRate, time, feedback){
	var	self	= this;
	self.time	= isNaN(time) ? self.time : time;
	self.feedback	= isNaN(feedback) ? self.feedback : feedback;
	self.reset(sampleRate);
}

Delay.prototype = {
	/** Sample rate on which the Delay operatos on. */
	sampleRate:	1,
	/** Buffer position of the Delay. */
	bufferPos:	0,
	/** AudioBuffer in which the delay line is stored. */
	buffer:		null,
	/** Time between delays, in milliseconds. */
	time:		1000,
	/** Feedback of the Delay */
	feedback:	0,
	/** Current output of the Delay */
	sample:		0,

/**
 * Reverse sample time factor
 *
 * @private
*/
	_rstf:		1,
/**
 * Adds a new sample to the delay line, moving the effect one sample forward in sample time.
 *
 * @param {Float32} sample The sample to be added to the delay line.
 * @return {Float32} Current output of the Delay.
*/
	pushSample: function(s){
		var	self	= this,
			buffer	= self.buffer;
		buffer[self.bufferPos++] += s;
		if (self.bufferPos > self.time * self._rstf){
			self.bufferPos = 0;
		}
		self.sample = buffer[self.bufferPos];
		buffer[self.bufferPos] *= self.feedback;
		return self.sample;
	},
/**
 * Returns the current output of the Delay.
 *
 * @return {Float32} Current output of the Delay.
*/
	getMix: function(){
		return this.sample;
	},
/**
 * Changes the time value of the Delay and resamples the delay line accordingly.
 *
 * @param {Uint} time The new time value for the Delay.
 * @return {AudioBuffer} The new delay line audio buffer.
*/
// Requires Sink
	resample: function(time){
		var	self	= this,
			ratio	= self.time / time;
		self.buffer	= audioLib.Sink.resample(self.buffer, time);
		self.time	= time;
		self.bufferPos	= Math.round(ratio * self.bufferPos);
		return self.buffer;
	},
/**
 * Resets the delay line, to recover from sample rate changes or such.
 *
 * @param {Number} sampleRate The new sample rate. (Optional)
 * @param {Boolean} resample Determines whether to resample and apply the old buffer. (Requires Sink)
 * @return {AudioBuffer} The new delay line audio buffer.
*/
	reset: function(sampleRate, resample){
		var	self	= this,
			buf	= self.buffer,
			i, ratio;
		sampleRate	= isNaN(sampleRate) ? self.sampleRate : sampleRate;
		ratio		= self.sampleRate / sampleRate;
		self.buffer	= new Float32Array(sampleRate * Delay.MAX_DELAY);
		self.bufferPos	= Math.round(ratio * self.bufferPos);
		self._rstf	= 1 / 1000 * sampleRate;
		if (resample){
			buf = audioLib.Sink.resample(buf, ratio);
			for (i=0; i<buf.length && i<self.buffer.length; i++){
				self.buffer[i] = buf[i];
			}
		}
		return self.buffer;
	}
};

/** The size that will be allocated for delay line buffers on initialization, in seconds */
Delay.MAX_DELAY = 2;
// Requires IIRFilter

/**
 * Creates a Distortion effect.
 *
 * @constructor
 * @this {Distortion}
 * @param {number} sampleRate Sample Rate (hz).
*/
function Distortion(sampleRate) // Based on the famous TubeScreamer.
{
	var	hpf1	= new IIRFilter(sampleRate, 720.484),
		lpf1	= new IIRFilter(sampleRate, 723.431),
		hpf2	= new IIRFilter(sampleRate, 1.0),
		smpl	= 0.0;
	this.gain = 4;
	this.master = 1;
	this.sampleRate = sampleRate;
	this.filters = [hpf1, lpf1, hpf2];
	this.pushSample = function(s){
		hpf1.pushSample(s);
		smpl = hpf1.getMix(1) * this.gain;
		smpl = Math.atan(smpl) + smpl;
		if (smpl > 0.4){
			smpl = 0.4;
		} else if (smpl < -0.4) {
			smpl = -0.4;
		}
		lpf1.pushSample(smpl);
		hpf2.pushSample(lpf1.getMix(0));
		smpl = hpf2.getMix(1) * this.master;
		return smpl;
	};
	this.getMix = function(){
		return smpl;
	};
}
/**
 * Creates a Reverb Effect, based on the Freeverb algorithm
 * 
 * @constructor
 * @this {Freeverb}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} channelCount (Optional)  Channel count. Defaults to 2.
 * @param {number} wet (Optional)  The gain of the reverb signal output. Defaults to 0.5.
 * @param {number} dry (Optional)  The gain of the original signal output. Defaults to 0.55.
 * @param {number} roomSize (Optional)  The size of the simulated reverb area. Defaults to 0.5. (0.0 - 1.0)
 * @param {number} damping (Optional) Reverberation damping parameter. Defaults to 0.2223. (0.0 - 1.0)
 * @param {Object} tuningOverride (Optional) Freeverb tuning overwrite object
*/
function Freeverb(sampleRate, channelCount, wet, dry, roomSize, damping, tuningOverride){
	var	self		= this;
	self.sampleRate		= sampleRate;
	self.channelCount	= isNaN(channelCount) ? self.channelCount : channelCount;
	self.wet		= isNaN(wet) ? self.wet: wet;
	self.dry		= isNaN(dry) ? self.dry: dry;
	self.roomSize		= isNaN(roomSize) ? self.roomSize: roomSize;
	self.damping		= isNaN(damping) ? self.damping: damping;
	self.tuning		= new Freeverb.Tuning(tuningOverride || self.tuning);
	
	self.sample	= (function(){
		var	sample	= [],
			c;
		for(c=0; c<self.channelCount; c++){
			sample[c] = 0.0;
		}
		return sample;
	}());

	self.CFs	= (function(){
		var 	combs	= [],
			channel	= [],
			num	= self.tuning.combCount,
			damp	= self.damping * self.tuning.scaleDamping,
			feed	= self.roomSize * self.tuning.scaleRoom + self.tuning.offsetRoom,
			sizes	= self.tuning.combTuning,
			i, c;
		for(c=0; c<self.channelCount; c++){
			for(i=0; i<num; i++){
				channel.push(new audioLib.CombFilter(self.sampleRate, sizes[i] + c * self.tuning.stereoSpread, feed, damp));
			}
			combs.push(channel);
			channel = [];
		}
		return combs;
	}());
	self.numCFs	= self.CFs[0].length;
	
	self.APFs	= (function(){
		var 	apfs	= [],
			channel	= [],
			num	= self.tuning.allPassCount,
			feed	= self.tuning.allPassFeedback,
			sizes	= self.tuning.allPassTuning,
			i, c;
		for(c=0; c<self.channelCount; c++){
			for(i=0; i<num; i++){
				channel.push(new Freeverb.AllPassFilter(self.sampleRate, sizes[i] + c * self.tuning.stereoSpread, feed));
			}
			apfs.push(channel);
			channel = [];
		}
		return apfs;
	}());
	self.numAPFs	= self.APFs[0].length;
}

Freeverb.prototype = {
	channelCount: 	2,
	sample:		[0.0, 0.0],

	wet:		0.5,
	dry:		0.55,
	damping:	0.2223,
	roomSize:	0.5,

	tuning: {
	},

	pushSample: function(s, channel){
		var	input	= s * this.tuning.fixedGain,
			output	= 0,
			i;
		for(i=0; i < this.numCFs; i++){
			output += this.CFs[channel][i].pushSample(input);
		}
		for(i=0; i < this.numAPFs; i++){
			output = this.APFs[channel][i].pushSample(output);
		}
		this.sample[channel] = output * this.wet + s * this.dry;
	},

	getMix: function(channel){
		return this.sample[channel];
	},

	reset: function(){
		var	i,
			c;
		for(c=0; c < this.channelCount; c++){
			for(i=0; i < this.numCFs; i++){
				this.CFs[c][i].reset();
			}
			for(i=0; i < this.numAPFs; i++){
				this.APFs[c][i].reset();
			}
			this.sample[c] = 0.0;
		}		
	},

	setParam: function(param, value){
		var	combFeed,
			combDamp,
			i,
			c;
		switch (param){
		case 'roomSize':
			this.roomSize	= value;
			combFeed	= this.roomSize * this.tuning.scaleRoom + this.tuning.offsetRoom;
			for(c=0; c < this.channelCount; c++){
				for(i=0; i < this.numCFs; i++){
					this.CFs[c][i].setParam('feedback', combFeed);
				}
			}
			break;
		case 'damping':
			this.damping	= value;
			combDamp	= this.damping * this.tuning.scaleDamping;
			for(c=0; c < this.channelCount; c++){
				for(i=0; i < this.numCFs; i++){
					this.CFs[c][i].setParam('damping', combDamp);
				}
			}
			break;
		default:
			this[param] = value;
		}
	}

	
};

/**
 * Creates a Freeverb tuning configurement object.
 *
 * @constructor
 * @this {Freeverb.Tuning}
 * @param {Object} overrides The object containing the values to be overwritten.
*/

Freeverb.Tuning = function FreeverbTuning(overrides){
	var k;
	if (overrides){
		for (k in overrides){
			if (overrides.hasOwnProperty(k)){
				this[k] = overrides[k];
			}
		}
	}
};

Freeverb.Tuning.prototype = {
	combCount:		8,
	combTuning:		[1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617],

	allPassCount:		4,
	allPassTuning:		[556, 441, 341, 225],
	allPassFeedback:	0.5,

	fixedGain:		0.015,
	scaleDamping:		0.9,

	scaleRoom:		0.28,
	offsetRoom:		0.7,
	
	stereoSpread:		23
};

/**
 * Creates an All-Pass Filter Effect, based on the Freeverb APF.
 * 
 * @constructor
 * @this {Freeverb.AllPassFilter}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} delaySize Size (in samples) of the delay line buffer.
 * @param {number} feedback (Optional) Amount of feedback (0.0-1.0). Defaults to 0.5 (Freeverb default)
*/
Freeverb.AllPassFilter = function AllPassFilter(sampleRate, delaySize, feedback){
	var	self	= this;
	self.sampleRate	= sampleRate;
	self.buffer	= new Float32Array(isNaN(delaySize) ? 500 : delaySize);
	self.bufferSize	= self.buffer.length;
	self.feedback	= isNaN(feedback) ? self.feedback : feedback;
};

Freeverb.AllPassFilter.prototype = {
	sample:		0.0,
	index:		0,
	feedback:	0.5,

	pushSample: function(s){
		var	self		= this;
			bufOut		= self.buffer[self.index];
		self.sample		= -s + bufOut;
		self.buffer[self.index++] = s + bufOut * self.feedback;
		if (self.index >= self.bufferSize) {
			self.index = 0;
		}
		return self.sample;
	},
	getMix: function(){
		return this.sample;
	},
	reset: function(){
		this.index	= 0;
		this.sample	= 0.0;
		this.buffer	= new Float32Array(this.bufferSize);
	}
}
/**
 * Creates a Gain Controller effect.
 *
 * @constructor
 * @this GainController
 * @param {Number} sampleRate The sample rate for the gain controller.
 * @param {Number} gain The gain for the gain controller.
*/
function GainController(sampleRate, gain){
	this.sampleRate	= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.gain	= isNaN(gain) ? this.gain : gain;
}

GainController.prototype = {
	/** The sample rate of the gain controller */
	sampleRate:	44100,
	/** The gain parameter of the gain controller */
	gain:		1,
	/** The current output sample of the gain controller */
	sample:		0,
/**
 * Processes provided sample, moves the gain controller one sample forward in the sample time.
 *
 * @param {Number} s The input sample for the gain controller.
 * @return {Number} The current output sample of the controller.
*/
	pushSample:	function(s){
		this.sample	= s * this.gain;
		return this.sample;
	},
/**
 * Returns the current output sample of the controller.
 *
 * @return {Number} The current output sample of the controller.
*/
	getMix:		function(){
		return this.sample;
	}
};
// Adapted from Corban Brook's dsp.js

/**
 * Creates a IIRFilter effect.
 *
 * @constructor
 * @this {IIRFilter}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} cutoff (Optional) The cutoff frequency (hz).
 * @param {number} resonance (Optional) Resonance (unsigned double).
 * @param {number} type (Optional) The type of the filter [uint2] (LowPass, HighPass, BandPass, Notch).
*/
function IIRFilter(samplerate, cutoff, resonance, type){
	var	self	= this,
		f	= [0.0, 0.0, 0.0, 0.0],
		freq, damp,
		prevCut, prevReso,

		sin	= Math.sin,
		min	= Math.min,
		pow	= Math.pow;

	self.cutoff = !cutoff ? 20000 : cutoff; // > 40
	self.resonance = !resonance ? 0.1 : resonance; // 0.0 - 1.0
	self.samplerate = samplerate;
	self.type = type || 0;

	function calcCoeff(){
		freq = 2 * sin(Math.PI * min(0.25, self.cutoff / (self.samplerate * 2)));
		damp = min(2 * (1 - pow(self.resonance, 0.25)), min(2, 2 / freq - freq * 0.5));
	}

	self.pushSample = function(sample){
		if (prevCut !== self.cutoff || prevReso !== self.resonance){
			calcCoeff();
			prevCut = self.cutoff;
			prevReso = self.resonance;
		}

		f[3] = sample - damp * f[2];
		f[0] = f[0] + freq * f[2];
		f[1] = f[3] - f[0];
		f[2] = freq * f[1] + f[2];

		f[3] = sample - damp * f[2];
		f[0] = f[0] + freq * f[2];
		f[1] = f[3] - f[0];
		f[2] = freq * f[1] + f[2];

		return f[self.type];
	};

	self.getMix = function(type){
		return f[type || self.type];
	};
}
// Adapted from Corban Brook's dsp.js

/**
 * Creates a LP12Filter effect.
 *
 * @constructor
 * @this {LP12Filter}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} cutoff (Optional) The cutoff frequency (hz).
 * @param {number} resonance (Optional) Resonance (1.0 - 20.0).
*/
function LP12Filter(samplerate, cutoff, resonance){
	var	self		= this,
		vibraSpeed	= 0,
		vibraPos	= 0,
		pi2		= Math.PI * 2,
		w, q, r, c,
		prevCut, prevReso;

	self.cutoff = !cutoff ? 20000 : cutoff; // > 40
	self.resonance = !resonance ? 1 : resonance; // 1 - 20
	self.samplerate = samplerate;

	function calcCoeff(){
		w = pi2 * self.cutoff / self.samplerate;
		q = 1.0 - w / (2 * (self.resonance + 0.5 / (1.0 + w)) + w - 2);
		r = q * q;
		c = r + 1 - 2 * Math.cos(w) * q;
	}

	self.pushSample = function(sample){
		if (prevCut !== self.cutoff || prevReso !== self.resonance){
			calcCoeff();
			prevCut = self.cutoff;
			prevReso = self.resonance;
		}
		vibraSpeed += (sample - vibraPos) * c;
		vibraPos += vibraSpeed;
		vibraSpeed *= r;
		return vibraPos;
	};

	self.getMix = function(){
		return vibraPos;
	};

	calcCoeff();
}
function Noise(){
	this.reset.apply(this, arguments);
}

Noise.prototype = {
	/* The sample rate of the Noise. */
	sampleRate:	44100,
	/* The color of the Noise. */
	color:		'white',
	b0:		0,
	b1:		0,
	b2:		0,
	b3:		0,
	b4:		0,
	b5:		0,
	c1:		null,
	c2:		null,
	c3:		null,
	c4:		null,
	q:		15,
	q0:		null,
	q1:		null,
	/* Brown seed. */
	brownQ:		0,
	/* Current value of the Noise. */
	value:		0,
	reset: function(sampleRate, color){
		this.sampleRate		= isNaN(sampleRate) ? this.sampleRate : sampleRate;
		this.color		= typeof color === 'string' ? color : this.color;
		this.c1			= (1 << this.q) - 1;
		this.c2			= (~~(this.c1 /3)) + 1;
		this.c3			= 1 / this.c1;
		this.c1			= this.c2 * 6;
		this.c4			= 3 * (this.c2 - 1);
		this.q0			= Math.exp(-200 * Math.PI / this.sampleRate);
		this.q1			= 1 - this.q0;
	},
	generate: function(){
		this.value	= this[this.color]();
	},
	getMix: function(){
		return this.value;
	},
	white: function(){
		var r = Math.random();
		return (r * this.c1 - this.c4) * this.c3;
	},
	pink: function(){
		var	w	= this.white();
		this.b0 = 0.997 * this.b0 + 0.029591 * w;
		this.b1 = 0.985 * this.b1 + 0.032534 * w;
		this.b2 = 0.950 * this.b2 + 0.048056 * w;
		this.b3 = 0.850 * this.b3 + 0.090579 * w;
		this.b4 = 0.620 * this.b4 + 0.108990 * w;
		this.b5 = 0.250 * this.b5 + 0.255784 * w;
		return 0.55 * (this.b0 + this.b1 + this.b2 + this.b3 + this.b4 + this.b5);
	},
	brown: function(){
		var	w	= this.white();
		this.brownQ	= (this.q1 * w + this.q0 * this.brownQ);
		return 6.2 * this.brownQ;
	}
};
/**
 * Creates a new Oscillator.
 *
 * @constructor
 * @this {Oscillator}
 * @param {Number} sampleRate The samplerate to operate the Oscillator on.
 * @param {Number} frequency The frequency of the Oscillator. (Optional)
*/function Oscillator(sampleRate, freq)
{
	var	self	= this;
	self.frequency	= isNaN(freq) ? 440 : freq;
	self.waveTable	= new Float32Array(1);
	self.sampleRate = sampleRate;
	self.waveShapes	= self.waveShapes.slice(0);
}

(function(FullPI, waveshapeNames, proto, i){

proto = Oscillator.prototype = {
	/** Determines the sample rate on which the Oscillator operates */
	sampleRate:	1,
	/** Determines the frequency of the Oscillator */
	frequency:	440,
	/** Phase of the Oscillator */
	phase:		0,
	/** Phase offset of the Oscillator */
	phaseOffset:	0,
	/** Pulse width of the Oscillator */
	pulseWidth:	0.5,
	/** Frequency modulation of the Oscillator */
	fm:		0,
	/** Wave shape of the Oscillator */
	waveShape:	'sine',
/**
 * The relative of phase of the Oscillator (pulsewidth, phase offset, etc applied).
 *
 * @private
*/
	_p:		0,

/**
 * Moves the Oscillator's phase forward by one sample.
*/
	generate: function(){
		var	self	= this,
			f	= +self.frequency,
			pw	= self.pulseWidth,
			p	= self.phase;
		f += f * self.fm;
		self.phase	= (p + f / self.sampleRate / 2) % 1;
		p		= (self.phase + self.phaseOffset) % 1;
		self._p		= p < pw ? p / pw : (p-pw) / (1-pw);
	},
/**
 * Returns the output signal sample of the Oscillator.
 *
 * @return {Float32} The output signal sample.
*/
	getMix: function(){
		return this[this.waveShape]();
	},
/**
 * Returns the relative phase of the Oscillator (pulsewidth, phaseoffset, etc applied).
 *
 * @return {Float32} The relative phase.
*/
	getPhase: function(){
		return this._p;
	},
/**
 * Resets the Oscillator phase (AND RELATIVE PHASE) to a specified value.
 *
 * @param {Float32} phase The phase to reset the values to. (Optional, defaults to 0).
*/
	reset: function(p){
		this.phase = this._p = isNaN(p) ? 0 : p;
	},
/**
 * Specifies a wavetable for the Oscillator.
 *
 * @param {AudioBuffer} wavetable The wavetable to be assigned to the Oscillator.
 * @return {Boolean} Succesfulness of the operation.
*/
	setWavetable: function(wt){
		this.waveTable = wt;
		return true;
	},
/**
 * Returns sine wave output of the Oscillator.
 * @return {Float32} Sample.
*/
// Phase for root of the function: 0.0, 0.5
	sine: function(){
		return Math.sin(this._p * FullPI);
	},
/**
 * Returns triangle wave output of the Oscillator, phase zero representing the top of the triangle.
 * @return {Float32} Sample.
*/
// Phase for root of the function: 0.25, 0.75
	triangle: function(){
		return this._p < 0.5 ? 4 * this._p - 1 : 3 - 4 * this._p;
	},
/**
 * Returns square wave output of the Oscillator, phase zero being the first position of the positive side.
 * @return {Float32} Sample.
*/
// Phase for root of the function: 0.0, 0.5
	square: function(){
		return this._p < 0.5 ? -1 : 1;
	},
/**
 * Returns sawtooth wave output of the Oscillator, phase zero representing the negative peak.
 * @return {Float32} Sample.
*/
// Phase for root of the function: 0.5
	sawtooth: function(){
		return 1 - this._p * 2;
	},
/**
 * Returns invert sawtooth wave output of the Oscillator, phase zero representing the positive peak.
 * @return {Float32} Sample.
*/
// Phase for root of the function: 0.5
	invSawtooth: function(){
		return this._p * 2 - 1;
	},
/**
 * Returns pulse wave output of the Oscillator, phase zero representing slope starting point.
 * @return {Float32} Sample.
*/
// Phase for root of the function: 0.125, 0.325
	pulse: function(){
		return this._p < 0.5 ?
			this._p < 0.25 ?
				this._p * 8 - 1 :
				1 - (this._p - 0.25) * 8 :
			-1;
	},
/**
 * Returns wavetable output of the Oscillator.
 * @return {Float32} Sample.
*/
	// Requires Sink
	wavetable: function(){
		return audioLib.Sink.interpolate(this.wavetable, this._p * this.wavetable.length);
	},
	waveShapes: []
};

for(i=0; i<waveshapeNames.length; i++){
	proto[i] = proto[waveshapeNames[i]];
	proto.waveShapes.push(proto[i]);
}

/**
 * Creates a new wave shape and attaches it to Oscillator.prototype by a specified name.
 *
 * @param {String} name The name of the wave shape.
 * @param {Function} algorithm The algorithm for the wave shape. If omitted, no changes are made.
 * @return {Function} The algorithm assigned to Oscillator.prototype by the specified name.
*/

Oscillator.WaveShape = function(name, algorithm){
	if (algorithm){
		this.prototype[name] = algorithm;
	}
	return this.prototype[name];
};

/**
 * Creates a new wave shape that mixes existing wave shapes into a new waveshape and attaches it to Oscillator.prototype by a specified name.
 *
 * @param {String} name The name of the wave shape.
 * @param {Array} waveshapes Array of the wave shapes to mix, wave shapes represented as objects where .shape is the name of the wave shape and .mix is the volume of the wave shape.
 * @return {Function} The algorithm created.
*/

Oscillator.createMixWave = function(name, waveshapes){
	var	l = waveshapes.length,
		smpl, i;
	return this.WaveShape(name, function(){
		smpl = 0;
		for (i=0; i<l; i++){
			smpl += this[waveshapes[i].shape]() * waveshapes[i].mix;
		}
		return smpl;
	});
};

}(Math.PI * 2, ['sine', 'triangle', 'pulse', 'sawtooth', 'invSawtooth', 'square']));
/**
 * Creates a new Sampler.
 *
 * @constructor
 * @this {Sampler}
 * @param {Number} sampleRate The samplerate to operate the Sampler on.
 * @param {Number} pitch The pitch of the Sampler. (Optional)
*/
function Sampler(sampleRate, pitch){
	var	self	= this;
	self.voices	= [];
	self.sampleRate	= sampleRate;
	self.pitch	= isNaN(pitch) ? 440 : self.pitch;
}

Sampler.prototype = {
	/** The sample rate the Sampler operates on. */
	sampleRate:	1,
	/** The relative pitch used to compare noteOn pitches to and adjust playback speed. */
	pitch:		440,
	/** Time in seconds to start the playback of the sample from. */
	delayStart:	0,
	/** Time in seconds to end the playback of the sample before the end of the sample. */
	delayEnd:	0,
	/** The maximum amount of voices allowed to be played simultaneously. */
	maxVoices:	1 / 0,
	/** The length of a single channel of the sample loaded into Sampler, in samples. */
	sampleSize:	0,
	/** An array containing information of all the voices playing currently. */
	voices:		null,
	/** The AudioBuffer representation of the sample used by the sampler. */
	sample:		null,
	/** An array containing the sample, resampled and split by channels as AudioBuffers. */
	samples:	null,
	/** An AudioData object representation of the sample used by the sampler. */
	data:		null,
/**
 * Adds a new voice to the sampler and disbands voices that go past the maxVoices limit.
 *
 * @param {Number} frequency Determines the frequency the voice should be played at, relative to the Sampler's pitch. (Optional)
 * @param {Number} velocity The relative volume of the voice. (Optional)
 * @return {Voice} The voice object created.
*/
	noteOn: function(frequency, velocity){
		frequency	= isNaN(frequency) ? this.pitch : frequency;
		var	self	= this,
			speed	= frequency / self.pitch,
			rate	= self.sampleRate,
			start	= rate * self.delayStart,
			end	= self.sampleSize - rate * self.delayEnd - 1,
			note	= {
				f:	frequency,
				p:	start,
				s:	speed,
				l:	end,
				v:	isNaN(velocity) ? 1 : velocity
			};
		self.voices.push(note);
		while (self.voices.length > self.maxVoices){
			end = self.voices.shift();
			end.onend && end.onend();
		}
		return note;
	},
/**
 * Moves all the voices one sample position further and disbands the voices that have ended.
*/
	generate: function(){
		var	voices = this.voices,
			i, voice;
		for (i=0; i<voices.length; i++){
			voice = voices[i];
			voice.p += voice.s;
			voice.p > voice.l && voices.splice(i--, 1) && voice.onend && voice.onend();
		}
	},
/**
 * Returns the mix of the voices, by a specific channel.
 *
 * @param {Int} channel The number of the channel to be returned. (Optional)
 * @return {Float32} The current output of the Sampler's channel number channel.
*/
	getMix: function(ch){
		var	voices	= this.voices,
			smpl	= 0,
			i;
		ch = ch || 0;
		if (this.samples[ch]){
			for (i=0; i<voices.length; i++){
				smpl	+= audioLib.Sink.interpolate(this.samples[ch], voices[i].p) * voices[i].v;
			}
		}
		return smpl;
	},
/**
 * Load an AudioData object to the sampler and resample if needed.
 *
 * @param {AudioData} data The AudioData object representation of the sample to be loaded.
 * @param {Boolean} resample Determines whether to resample the sample to match the sample rate of the Sampler.
*/
	load: function(data, resample){
		var	self	= this,
			samples	= self.samples = audioLib.Sink.deinterleave(data.data, data.channelCount),
			i;
		if (resample){
			for (i=0; i<samples.length; i++){
				samples[i] = audioLib.Sink.resample(samples[i], data.sampleRate, self.sampleRate);
			}
		}
		self.sample	= data.data;
		self.samples	= samples;
		self.data	= data;
		self.sampleSize = samples[0].length;
	}
};
(function(){
function inject(){
	var	args	= arguments,
		l	= args.length,
		code, i;
	for (i=0; i<l; i++){
		code = args[i];
		this.postMessage({type: 'injection', code: code instanceof Function ? '(' + String(code) + ').call(this);' : code });
	}
}

audioLib.AudioWorker = function(code, injectable){
	var	blob	= new (window.MozBlobBuilder || window.BlobBuilder)(),
		url, worker;
	blob.append('var audioLib = (' + String(AUDIOLIB) + '(this, Math, Object, Array));\n');
	for (url = 0; url < audioLib.plugins._pluginList.length; url++){
		blob.append('(' + String(audioLib.plugins._pluginList[url]) + '());\n');
	}
	injectable && blob.append('this.addEventListener("message",function(e){e.data&&e.data.type==="injection"&&Function(e.data.code).call(this)}, true);\n');
	blob.append(code instanceof Function ? '(' + String(code) + ').call(this);' : code);
	url	= window.URL.createObjectURL(blob.getBlob());
	worker	= new Worker(url);
	worker._terminate	= worker.terminate;
	worker.terminate	= function(){
		window.URL.revokeObjectURL(id);
		return worker._terminate.call(worker, arguments);
	};
	if (injectable){
		worker.inject = inject;
	}
	return worker;
};

}());
/*
pcmdata.js
Uses binary.js and stream.js to parse PCM wave data.
On GitHub:
 * pcmdata.js	http://goo.gl/4uu06
 * binary.js	http://goo.gl/ZaWqK

binary.js repository also includes stream.js

MIT License
*/

(function(global, Math){

	var	fromCharCode	= String.fromCharCode,
		// the following two aren't really *performance optimization*, but compression optimization.
		y		= true,
		n		= false;

	function convertToBinaryLE(num, size){
		return size ? fromCharCode(num & 255) + convertToBinaryLE(num >> 8, size - 1) : '';
	}

	function convertToBinaryBE(num, size){ // I don't think this is right
		return size ? convertToBinaryBE(num >> 8, size - 1) + fromCharCode(255 - num & 255) : '';
	}

	function convertToBinary(num, size, bigEndian){
		return bigEndian ? convertToBinaryBE(num, size) : convertToBinaryLE(num, size);
	}

	function convertFromBinary(str, bigEndian){
		var	l	= str.length,
			last	= l - 1,
			n	= 0,
			pow	= Math.pow,
			i;
		if (bigEndian){
			for (i=0; i<l; i++){
				n += (255 - str.charCodeAt(i)) * pow(256, last - i);
			}
		} else {
			for (i=0; i < l; i++){
				n += str.charCodeAt(i) * pow(256, i);
			}
		}
		return n;
	}

	// The main function creates all the functions used.
	function Binary(bitCount, signed, /* false === unsigned */ isQ, from /* false === to */){

		// This is all just for major optimization benefits.
		var	pow			= Math.pow,
			floor			= Math.floor,
			convertFromBinary	= Binary.convertFromBinary,
			convertToBinary		= Binary.convertToBinary,
			byteCount		= bitCount / 8,
			bitMask			= pow(2, bitCount),
			semiMask		= bitMask / 2,
			intMask			= semiMask - 1,
			invSemiMask		= 1 / semiMask,
			invIntMask		= 1 / intMask;

		return from ?
			isQ ?
				signed ? function(num, bigEndian){
					num = floor(num < 0 ? num * semiMask + bitMask : num * intMask);
					return convertToBinary(
						num,
						byteCount,
						bigEndian
					);
				} : function(num, bigEndian){
					return convertToBinary(
						floor(num * intMask),
						byteCount,
						bigEndian
					);
				}
			:
				signed ? function(num, bigEndian){
					return convertToBinary(
						num < 0 ? num + bitMask : num,
						byteCount,
						bigEndian
					);
				} : function(num, bigEndian){
					return convertToBinary(
						num,
						byteCount,
						bigEndian
					);
				}
		:
			isQ ?
				signed ? function(str, bigEndian){
					var num = convertFromBinary(str, bigEndian);
					return num > intMask ? (num - bitMask) * invSemiMask : num * invIntMask;
				} : function(str, bigEndian){
					return convertFromBinary(str, bigEndian) * invIntMask;
				}
			:
				signed ? function(str, bigEndian){
					var num = convertFromBinary(str, bigEndian);
					return num > intMask ? num - bitMask : num;
				} : function(str, bigEndian){
					return convertFromBinary(str, bigEndian);
				};
	}

	Binary.convertToBinary		= convertToBinary;
	Binary.convertFromBinary	= convertFromBinary;
	// these are deprecated because JS doesn't support 64 bit uint, so the conversion can't be performed.
/*
	Binary.fromQ64			= Binary(64, y, y, y);
	Binary.toQ64			= Binary(64, y, y, n);
*/
	Binary.fromQ32			= Binary(32, y, y, y);
	Binary.toQ32			= Binary(32, y, y, n);
	Binary.fromQ24			= Binary(24, y, y, y);
	Binary.toQ24			= Binary(24, y, y, n);
	Binary.fromQ16			= Binary(16, y, y, y);
	Binary.toQ16			= Binary(16, y, y, n);
	Binary.fromQ8			= Binary( 8, y, y, y);
	Binary.toQ8			= Binary( 8, y, y, n);
	Binary.fromInt32		= Binary(32, y, n, y);
	Binary.toInt32			= Binary(32, y, n, n);
	Binary.fromInt16		= Binary(16, y, n, y);
	Binary.toInt16			= Binary(16, y, n, n);
	Binary.fromInt8			= Binary( 8, y, n, y);
	Binary.toInt8			= Binary( 8, y, n, n);
	Binary.fromUint32		= Binary(32, n, n, y);
	Binary.toUint32			= Binary(32, n, n, n);
	Binary.fromUint16		= Binary(16, n, n, y);
	Binary.toUint16			= Binary(16, n, n, n);
	Binary.fromUint8		= Binary( 8, n, n, y);
	Binary.toUint8			= Binary( 8, n, n, n);

	global.Binary = Binary;
}(this, Math));
(function(global, Binary){

function Stream(data){
	this.data = data;
}

var	proto	= Stream.prototype = {
		read:		function(length){
			var	self	= this,
				data	= self.data.substr(0, length);
			self.skip(length);
			return data;
		},
		skip:		function(length){
			var	self	= this,
				data	= self.data	= self.data.substr(length);
			self.pointer	+= length;
			return data.length;
		},
		readBuffer:	function(buffer, bitCount, type){
			var	self		= this,
				converter	= 'read' + type + bitCount,
				byteCount	= bitCount / 8,
				l		= buffer.length,
				i		= 0;
			while (self.data && i < l){
				buffer[i++] = self[converter]();
			}
			return i;
		}
	},
	i, match;

function newType(type, bitCount, fn){
	var	l	= bitCount / 8;
	proto['read' + type + bitCount] = function(bigEndian){
		return fn(this.read(l), bigEndian);
	};
}

for (i in Binary){
	match	= /to([a-z]+)([0-9]+)/i.exec(i);
	match && newType(match[1], match[2], Binary[i]);
}

global.Stream	= Stream;
Stream.newType	= newType;

}(this, this.Binary));
this.PCMData = (function(Binary, Stream){

function PCMData(data){
	return (typeof data === 'string' ? PCMData.decode : PCMData.encode)(data);
}

PCMData.decodeFrame = function(frame, bitCount, result){
	if (bitCount === 8){
		var buffer	= new (window.Uint8Array || Array)(result.length);
		(new Stream(frame)).readBuffer(buffer, 8, 'Uint');
		for (bitCount=0; bitCount<result.length; bitCount++){
			result[bitCount] = (buffer[bitCount] - 127.5) * 127.5;
		}
	} else {
		(new Stream(frame)).readBuffer(result, bitCount, 'Q');
	}
	return result;
};

PCMData.encodeFrame = function(frame, bitCount){
	var	properWriter	= Binary[(bitCount === 8 ? 'fromUint' : 'fromQ') + bitCount],
		l		= frame.length,
		r		= '',
		i;
	if (bitCount === 8){
		for (i=0; i<l; i++){
			r += properWriter(frame[i] * 127.5 + 127.5);
		}
	} else {
		for (i=0; i<l; i++){
			r += properWriter(frame[i]);
		}
	}
	return r;
};

PCMData.decode	= function(data, asyncCallback){
	var	stream			= new Stream(data),
		sGroupID1		= stream.read(4),
		dwFileLength		= stream.readUint32();
		stream			= new Stream(stream.read(dwFileLength));
	var	sRiffType		= stream.read(4),
		sGroupID2		= stream.read(4),
		dwChunkSize1		= stream.readUint32(),
		formatChunk		= new Stream(stream.read(dwChunkSize1)),
		wFormatTag		= formatChunk.readUint16(),
		wChannels		= formatChunk.readUint16(),
		dwSamplesPerSec		= formatChunk.readUint32(),
		dwAvgBytesPerSec	= formatChunk.readUint32(),
		wBlockAlign		= formatChunk.readUint16(),
		sampleSize		= wBlockAlign / wChannels,
		dwBitsPerSample		= /* dwChunkSize1 === 16 ? */ formatChunk.readUint16() /* : formatChunk.readUint32() */,
		sGroupID,
		dwChunkSize,
		sampleCount,
		chunkData,
		samples,
		dataTypeList,
		i,
		chunks	= {},
		output	= {
			channelCount:	wChannels,
			bytesPerSample:	wBlockAlign / wChannels,
			sampleRate:	dwAvgBytesPerSec / wBlockAlign,
			chunks:		chunks,
			data:		samples
		};

	function readChunk(){
		sGroupID		= stream.read(4);
		dwChunkSize		= stream.readUint32();
		chunkData		= stream.read(dwChunkSize);
		dataTypeList		= chunks[sGroupID] = chunks[sGroupID] || [];
		if (sGroupID === 'data'){
			sampleCount		= ~~(dwChunkSize / sampleSize);
			samples			= output.data = new (typeof Float32Array !== 'undefined' ? Float32Array : Array)(sampleCount);
			PCMData.decodeFrame(chunkData, sampleSize * 8, samples);
		} else {
			dataTypeList.push(chunkData);
		}
		asyncCallback && (stream.data ? setTimeout(readChunk, 1) : asyncCallback(output));
	}

	if (asyncCallback){
		stream.data ? readChunk() : asyncCallback(output);
	} else {
		while(stream.data){
			readChunk();
		}
	}
	return output;
}

PCMData.encode	= function(data, asyncCallback){
	var	
		dWord		= Binary.fromUint32,
		sWord		= Binary.fromUint16,
		samples		= data.data,
		sampleRate	= data.sampleRate,
		channelCount	= data.channelCount || 1,
		bytesPerSample	= data.bytesPerSample || 1,
		bitsPerSample	= bytesPerSample * 8,
		blockAlign	= channelCount * bytesPerSample,
		byteRate	= sampleRate * blockAlign,
		length		= samples.length,
		dLength		= length * bytesPerSample,
		padding		= Math.pow(2, bitsPerSample - 1) - 1,
		chunks		= [],
		chunk		= '',
		chunkType,
		i, n, chunkData;

		
		chunks.push(
			'fmt '				+	// sGroupID		4 bytes		char[4]
			dWord(16)			+	// dwChunkSize		4 bytes		uint32 / dword
			sWord(1)			+	// wFormatTag		2 bytes		uint16 / ushort
			sWord(channelCount)		+	// wChannels		2 bytes		uint16 / ushort
			dWord(sampleRate)		+	// dwSamplesPerSec	4 bytes		uint32 / dword
			dWord(byteRate)			+	// dwAvgBytesPerSec	4 bytes		uint32 / dword
			sWord(blockAlign)		+	// wBlockAlign		2 bytes		uint16 / ushort
			sWord(bitsPerSample)			// dwBitsPerSample	2 or 4 bytes	uint32 / dword OR uint16 / ushort
		);

		chunks.push(
			'data'				+	// sGroupID		4 bytes		char[4]
			dWord(dLength)			+	// dwChunkSize		4 bytes		uint32 / dword
			PCMData.encodeFrame(samples, bitsPerSample)
		);
		chunkData = data.chunks;
		if (chunkData){
			for (i in chunkData){
				if (chunkData.hasOwnProperty(i)){
					chunkType = chunkData[i];
					for (n=0; n<chunkType.length; n++){
						chunk = chunkType[n];
						chunks.push(i + dWord(chunk.length) + chunk);
					}
				}
			}
		}
		chunks = chunks.join('');
		chunks = 'RIFF'			+	// sGroupId		4 bytes		char[4]
			dWord(chunks.length)	+	// dwFileLength		4 bytes		uint32 / dword
			'WAVE'			+	// sRiffType		4 bytes		char[4]
			chunks;
		asyncCallback && setTimeout(function(){
			asyncCallback(chunks);
		}, 1);
		return chunks;
}

return PCMData;

}(this.Binary, this.Stream));
(function (global){
/**
 * Creates a Sink according to specified parameters, if possible.
 *
 * @param {Function} readFn A callback to handle the buffer fills.
 * @param {number} channelCount Channel count.
 * @param {number} preBufferSize (Optional) Specifies a pre-buffer size to control the amount of latency.
 * @param {number} sampleRate Sample rate (ms).
*/
function Sink(readFn, channelCount, preBufferSize, sampleRate){
	var	sinks	= Sink.sinks,
		dev;
	for (dev in sinks){
		if (sinks.hasOwnProperty(dev) && sinks[dev].enabled){
			try{
				return new sinks[dev](readFn, channelCount, preBufferSize, sampleRate);
			} catch(e1){}
		}
	}

	throw "No audio sink available.";
}

/**
 * A Recording class for recording sink output.
 *
 * @private
 * @this {Recording}
 * @constructor
 * @param {Object} bindTo The sink to bind the recording to.
*/

function Recording(bindTo){
	this.boundTo = bindTo;
	this.buffers = [];
	bindTo.activeRecordings.push(this);
}

Recording.prototype = {
/**
 * Adds a new buffer to the recording.
 *
 * @param {Array} buffer The buffer to add.
*/
	add: function(buffer){
		this.buffers.push(buffer);
	},
/**
 * Empties the recording.
*/
	clear: function(){
		this.buffers = [];
	},
/**
 * Stops the recording and unbinds it from it's host sink.
*/
	stop: function(){
		var	recordings = this.boundTo.activeRecordings,
			i;
		for (i=0; i<recordings.length; i++){
			if (recordings[i] === this){
				recordings.splice(i--, 1);
			}
		}
	},
/**
 * Joins the recorded buffers into a single buffer.
*/
	join: function(){
		var	bufferLength	= 0,
			bufPos		= 0,
			buffers		= this.buffers,
			newArray,
			n, i, l		= buffers.length;

		for (i=0; i<l; i++){
			bufferLength += buffers[i].length;
		}
		newArray = new Float32Array(bufferLength);
		for (i=0; i<l; i++){
			for (n=0; n<buffers[i].length; n++){
				newArray[bufPos + n] = buffers[i][n];
			}
			bufPos += buffers[i].length;
		}
		return newArray;
	}
};

function SinkClass(){
}

Sink.SinkClass		= SinkClass;

SinkClass.prototype = {
/**
 * The sample rate of the Sink.
*/
	sampleRate: 44100,
/**
 * The channel count of the Sink.
*/
	channelCount: 2,
/**
 * The amount of samples to pre buffer for the sink.
*/
	preBufferSize: 4096,
/**
 * Write position of the sink, as in how many samples have been written per channel.
*/
	writePosition: 0,
/**
 * The default mode of writing to the sink.
*/
	writeMode: 'async',
/**
 * The mode in which the sink asks the sample buffers to be channeled in.
*/
	channelMode: 'interleaved',
/**
 * The previous time of a callback.
*/
	previousHit: 0,
/**
 * The ring buffer array of the sink. If null, ring buffering will not be applied.
*/
	ringBuffer: null,
/**
 * The current position of the ring buffer.
 * @private
*/
	ringOffset: 0,
/**
 * Does the initialization of the sink.
 * @private
*/
	start: function(readFn, channelCount, preBufferSize, sampleRate){
		this.channelCount	= isNaN(channelCount) ? this.channelCount: channelCount;
		this.preBufferSize	= isNaN(preBufferSize) ? this.preBufferSize : preBufferSize;
		this.sampleRate		= isNaN(sampleRate) ? this.sampleRate : sampleRate;
		this.readFn		= readFn;
		this.activeRecordings	= [];
		this.previousHit	= +new Date;
		this.asyncBuffers	= [];
		this.syncBuffers	= [];
	},
/**
 * The method which will handle all the different types of processing applied on a callback.
 * @private
*/
	process: function(soundData, channelCount){
		this.ringBuffer && (this.channelMode === 'interleaved' ? this.ringSpin : this.ringSpinInterleaved).apply(this, arguments);
		this.writeBuffersSync.apply(this, arguments);
		if (this.readFn){
			if (this.channelMode === 'interleaved'){
				this.readFn.apply(this, arguments);
			} else {
				var soundDataSplit = Sink.deinterleave(soundData, this.channelCount);
				this.readFn.apply(this, [soundDataSplit].concat([].slice.call(arguments, 1)));
				Sink.interleave(soundDataSplit, this.channelCount, soundData);
			}
		}
		this.writeBuffersAsync.apply(this, arguments);
		this.recordData.apply(this, arguments);
		this.previousHit = +new Date;
		this.writePosition += soundData.length / channelCount;
	},
/**
 * Starts recording the sink output.
 *
 * @return {Recording} The recording object for the recording started.
*/
	record: function(){
		return new Recording(this);
	},
/**
 * Private method that handles the adding the buffers to all the current recordings.
 *
 * @private
 * @param {Array} buffer The buffer to record.
*/
	recordData: function(buffer){
		var	activeRecs	= this.activeRecordings,
			i, l		= activeRecs.length;
		for (i=0; i<l; i++){
			activeRecs[i].add(buffer);
		}
	},
/**
 * Private method that handles the mixing of asynchronously written buffers.
 *
 * @private
 * @param {Array} buffer The buffer to write to.
*/
	writeBuffersAsync: function(buffer){
		var	buffers		= this.asyncBuffers,
			l		= buffer.length,
			buf,
			bufLength,
			i, n, offset;
		if (buffers){
			for (i=0; i<buffers.length; i++){
				buf		= buffers[i];
				bufLength	= buf.b.length;
				offset		= buf.d;
				buf.d		-= Math.min(offset, l);
				
				for (n=0; n + offset < l && n < bufLength; n++){
					buffer[n + offset] += buf.b[n];
				}
				buf.b = buf.b.subarray(n + offset);
				i >= bufLength && buffers.splice(i--, 1);
			}
		}
	},
/**
 * A private method that handles mixing synchronously written buffers.
 *
 * @private
 * @param {Array} buffer The buffer to write to.
*/
	writeBuffersSync: function(buffer){
		var	buffers		= this.syncBuffers,
			l		= buffer.length,
			i		= 0,
			soff		= 0;
		for(;i<l && buffers.length; i++){
			buffer[i] += buffers[0][soff];
			if (buffers[0].length <= soff){
				buffers.splice(0, 1);
				soff = 0;
				continue;
			}
			soff++;
		}
		if (buffers.length){
			buffers[0] = buffers[0].subarray(soff);
		}
	},
/**
 * Writes a buffer asynchronously on top of the existing signal, after a specified delay.
 *
 * @param {Array} buffer The buffer to write.
 * @param {Number} delay The delay to write after. If not specified, the Sink will calculate a delay to compensate the latency.
 * @return {Number} The number of currently stored asynchronous buffers.
*/
	writeBufferAsync: function(buffer, delay){
		buffer			= this.mode === 'deinterleaved' ? Sink.interleave(buffer, this.channelCount) : buffer;
		var	buffers		= this.asyncBuffers;
		buffers.push({
			b: buffer,
			d: isNaN(delay) ? ~~((+new Date - this.previousHit) / 1000 * this.sampleRate) : delay
		});
		return buffers.length;
	},
/**
 * Writes a buffer synchronously to the output.
 *
 * @param {Array} buffer The buffer to write.
 * @return {Number} The number of currently stored synchronous buffers.
*/
	writeBufferSync: function(buffer){
		buffer			= this.mode === 'deinterleaved' ? Sink.interleave(buffer, this.channelCount) : buffer;
		var	buffers		= this.syncBuffers;
		buffers.push(buffer);
		return buffers.length;
	},
/**
 * Writes a buffer, according to the write mode specified.
 *
 * @param {Array} buffer The buffer to write.
 * @param {Number} delay The delay to write after. If not specified, the Sink will calculate a delay to compensate the latency. (only applicable in asynchronous write mode)
 * @return {Number} The number of currently stored (a)synchronous buffers.
*/
	writeBuffer: function(){
		this[this.writeMode === 'async' ? 'writeBufferAsync' : 'writeBufferSync'].apply(this, arguments);
	},
/**
 * Gets the total amount of yet unwritten samples in the synchronous buffers.
 *
 * @return {Number} The total amount of yet unwritten samples in the synchronous buffers.
*/
	getSyncWriteOffset: function(){
		var	buffers		= this.syncBuffers,
			offset		= 0,
			i;
		for (i=0; i<buffers.length; i++){
			offset += buffers[i].length;
		}
		return offset;
	},
/**
 * Get the current output position, defaults to writePosition - preBufferSize.
 *
 * @return {Number} The position of the write head, in samples, per channel.
*/
	getPlaybackTime: function(){
		return this.writePosition - this.preBufferSize;
	},
/**
 * A private method that applies the ring buffer contents to the specified buffer, while in interleaved mode.
 *
 * @private
 * @param {Array} buffer The buffer to write to.
*/
	ringSpin: function(buffer){
		var	ring	= this.ringBuffer,
			l	= buffer.length,
			m	= ring.length,
			off	= this.ringOffset,
			i;
		for (i=0; i<l; i++){
			buffer[i] += ring[off];
			off = (off + 1) % m;
		}
		this.ringOffset = off;
	},
/**
 * A private method that applies the ring buffer contents to the specified buffer, while in deinterleaved mode.
 *
 * @private
 * @param {Array} buffer The buffers to write to.
*/
	ringSpinDeinterleaved: function(buffer){
		var	ring	= this.ringBuffer,
			l	= buffer.length,
			ch	= ring.length,
			m	= ring[0].length,
			len	= ch * m,
			off	= this.ringOffset,
			i, n;
		for (i=0; i<l; i+=ch){
			for (n=0; n<ch; n++){
				buffer[i + n] += ring[n][off];
			}
			off = (off + 1) % m;
		}
		this.ringOffset = n;
	}
};

/**
 * The container for all the available sinks. Also a decorator function for creating a new Sink class and binding it.
 *
 * @param {String} type The name / type of the Sink.
 * @param {Function} constructor The constructor function for the Sink.
 * @param {Object} prototype The prototype of the Sink. (optional)
 * @param {Boolean} disabled Whether the Sink should be disabled at first.
*/

function sinks(type, constructor, prototype, disabled){
	prototype = prototype || constructor.prototype;
	constructor.prototype = new Sink.SinkClass();
	constructor.prototype.type = type;
	constructor.enabled = !disabled;
	for (disabled in prototype){
		if (prototype.hasOwnProperty(disabled)){
			constructor.prototype[disabled] = prototype[disabled];
		}
	}
	sinks[type] = constructor;
}

/**
 * A Sink class for the Mozilla Audio Data API.
*/

sinks('moz', function(){
	var	self			= this,
		currentWritePosition	= 0,
		tail			= null,
		audioDevice		= new Audio(),
		written, currentPosition, available, soundData,
		timer; // Fix for https://bugzilla.mozilla.org/show_bug.cgi?id=630117
	self.start.apply(self, arguments);
	// TODO: All sampleRate & preBufferSize combinations don't work quite like expected, fix this.
	self.preBufferSize = isNaN(arguments[2]) ? self.sampleRate / 2 : self.preBufferSize;

	function bufferFill(){
		if (tail){
			written = audioDevice.mozWriteAudio(tail);
			currentWritePosition += written;
			if (written < tail.length){
				tail = tail.subarray(written);
				return tail;
			}
			tail = null;
		}

		currentPosition = audioDevice.mozCurrentSampleOffset();
		available = Number(currentPosition + self.preBufferSize * self.channelCount - currentWritePosition);
		if (available > 0){
			soundData = new Float32Array(available);
			self.process(soundData, self.channelCount);
			written = audioDevice.mozWriteAudio(soundData);
			if (written < soundData.length){
				tail = soundData.subarray(written);
			}
			currentWritePosition += written;
		}
	}

	audioDevice.mozSetup(self.channelCount, self.sampleRate);

	self.kill = Sink.doInterval(bufferFill, 20);
	self._bufferFill	= bufferFill;
	self._audio		= audioDevice;
}, {
	getPlaybackTime: function(){
		return this._audio.mozCurrentSampleOffset() / this.channelCount;
	}
});

/**
 * A sink class for the Web Audio API
*/

sinks('webkit', function(readFn, channelCount, preBufferSize, sampleRate){
	var	self		= this,
		// For now, we have to accept that the AudioContext is at 48000Hz, or whatever it decides.
		context		= new (window.AudioContext || webkitAudioContext)(/*sampleRate*/),
		node		= context.createJavaScriptNode(preBufferSize, 0, channelCount);
	self.start.apply(self, arguments);

	function bufferFill(e){
		var	outputBuffer	= e.outputBuffer,
			channelCount	= outputBuffer.numberOfChannels,
			i, n, l		= outputBuffer.length,
			size		= outputBuffer.size,
			channels	= new Array(channelCount),
			soundData	= new Float32Array(l * channelCount);

		for (i=0; i<channelCount; i++){
			channels[i] = outputBuffer.getChannelData(i);
		}

		self.process(soundData, self.channelCount);

		for (i=0; i<l; i++){
			for (n=0; n < channelCount; n++){
				channels[n][i] = soundData[i * self.channelCount + n];
			}
		}
	}

	node.onaudioprocess = bufferFill;
	node.connect(context.destination);

	self.sampleRate		= context.sampleRate;
	/* Keep references in order to avoid garbage collection removing the listeners, working around http://code.google.com/p/chromium/issues/detail?id=82795 */
	self._context		= context;
	self._node		= node;
	self._callback		= bufferFill;
}, {
	//TODO: Do something here.
	kill: function(){
	},
	getPlaybackTime: function(){
		return this._context.currentTime * this.sampleRate;
	},
});

/**
 * A dummy Sink. (No output)
*/

sinks('dummy', function(){
	var 	self		= this;
	self.start.apply(self, arguments);
	
	function bufferFill(){
		var	soundData = new Float32Array(self.preBufferSize * self.channelCount);
		self.process(soundData, self.channelCount);
	}

	self.kill = Sink.doInterval(bufferFill, self.preBufferSize / self.sampleRate * 1000);

	self._callback		= bufferFill;
}, null, true);

Sink.sinks		= Sink.devices = sinks;
Sink.Recording		= Recording;

Sink.doInterval		= function(callback, timeout){
	var	BlobBuilder	= typeof window === 'undefined' ? undefined : window.MozBlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder || window.OBlobBuilder || window.BlobBuilder,
		timer, id, prev;
	if ((Sink.doInterval.backgroundWork || Sink.devices.moz.backgroundWork) && BlobBuilder){
		try{
			prev	= new BlobBuilder();
			prev.append('setInterval(function(){ postMessage("tic"); }, ' + timeout + ');');
			id	= (window.MozURL || window.webkitURL || window.MSURL || window.OURL || window.URL).createObjectURL(prev.getBlob());
			timer	= new Worker(id);
			timer.onmessage = function(){
				callback();
			};
			return function(){
				timer.terminate();
				(window.MozURL || window.webkitURL || window.MSURL || window.OURL || window.URL).revokeObjectURL(id);
			};
		} catch(e){};
	}
	timer = setInterval(callback, timeout);
	return function(){
		clearInterval(timer);
	};
};

Sink.doInterval.backgroundWork = true;

(function(){

/**
 * If method is supplied, adds a new interpolation method to Sink.interpolation, otherwise sets the default interpolation method (Sink.interpolate) to the specified property of Sink.interpolate.
 *
 * @param {String} name The name of the interpolation method to get / set.
 * @param {Function} method The interpolation method. (Optional)
*/

function interpolation(name, method){
	if (name && method){
		interpolation[name] = method;
	} else if (name && interpolation[name] instanceof Function){
		Sink.interpolate = interpolation[name];
	}
	return interpolation[name];
}

Sink.interpolation = interpolation;


/**
 * Interpolates a fractal part position in an array to a sample. (Linear interpolation)
 *
 * @param {Array} arr The sample buffer.
 * @param {number} pos The position to interpolate from.
 * @return {Float32} The interpolated sample.
*/
interpolation('linear', function(arr, pos){
	var	first	= Math.floor(pos),
		second	= first + 1,
		frac	= pos - first;
	second		= second < arr.length ? second : 0;
	return arr[first] * (1 - frac) + arr[second] * frac;
});

/**
 * Interpolates a fractal part position in an array to a sample. (Nearest neighbour interpolation)
 *
 * @param {Array} arr The sample buffer.
 * @param {number} pos The position to interpolate from.
 * @return {Float32} The interpolated sample.
*/
interpolation('nearest', function(arr, pos){
	return pos >= arr.length - 0.5 ? arr[0] : arr[Math.round(pos)];
});

interpolation('linear');

}());


/**
 * Resamples a sample buffer from a frequency to a frequency and / or from a sample rate to a sample rate.
 *
 * @param {Float32Array} buffer The sample buffer to resample.
 * @param {number} fromRate The original sample rate of the buffer, or if the last argument, the speed ratio to convert with.
 * @param {number} fromFrequency The original frequency of the buffer, or if the last argument, used as toRate and the secondary comparison will not be made.
 * @param {number} toRate The sample rate of the created buffer.
 * @param {number} toFrequency The frequency of the created buffer.
*/
Sink.resample	= function(buffer, fromRate /* or speed */, fromFrequency /* or toRate */, toRate, toFrequency){
	var
		argc		= arguments.length,
		speed		= argc === 2 ? fromRate : argc === 3 ? fromRate / fromFrequency : toRate / fromRate * toFrequency / fromFrequency,
		l		= buffer.length,
		length		= Math.ceil(l / speed),
		newBuffer	= new Float32Array(length),
		i, n;
	for (i=0, n=0; i<l; i += speed){
		newBuffer[n++] = Sink.interpolate(buffer, i);
	}
	return newBuffer;
};

/**
 * Splits a sample buffer into those of different channels.
 *
 * @param {Float32Array} buffer The sample buffer to split.
 * @param {number} channelCount The number of channels to split to.
 * @return {Array} An array containing the resulting sample buffers.
*/

Sink.deinterleave = function(buffer, channelCount){
	var	l	= buffer.length,
		size	= l / channelCount,
		ret	= [],
		i, n;
	for (i=0; i<channelCount; i++){
		ret[i] = new Float32Array(size);
		for (n=0; n<size; n++){
			ret[i][n] = buffer[n * channelCount + i];
		}
	}
	return ret;
};

/**
 * Joins an array of sample buffers into a single buffer.
 *
 * @param {Array} buffers The buffers to join.
 * @param {Number} channelCount The number of channels. Defaults to buffers.length
 * @param {Array} buffer The output buffer. (optional)
*/

Sink.interleave = function(buffers, channelCount, buffer){
	channelCount		= channelCount || buffers.length;
	var	l		= buffers[0].length,
		bufferCount	= buffers.length,
		i, n;
	buffer			= buffer || new Float32Array(l * channelCount);
	for (i=0; i<bufferCount; i++){
		for (n=0; n<l; n++){
			buffer[i + n * channelCount] = buffers[i][n];
		}
	}
	return buffer;
};

/**
 * Mixes two or more buffers down to one.
 *
 * @param {Array} buffer The buffer to append the others to.
 * @param {Array} bufferX The buffers to append from.
*/

Sink.mix = function(buffer){
	var	buffers	= [].slice.call(arguments, 1),
		l, i, c;
	for (c=0; c<buffers.length; c++){
		l = Math.max(buffer.length, buffers[c].length);
		for (i=0; i<l; i++){
			buffer[i] += buffers[c][i];
		}
	}
	return buffer;
};

/**
 * Resets a buffer to all zeroes.
 *
 * @param {Array} buffer The buffer to reset.
*/

Sink.resetBuffer = function(buffer){
	var	l	= buffer.length,
		i;
	for (i=0; i<l; i++){
		buffer[i] = 0;
	}
	return buffer;
};

/**
 * Copies the content of an array to another array.
 *
 * @param {Array} buffer The buffer to copy from.
 * @param {Array} result The buffer to copy to. Optional.
*/

Sink.clone = function(buffer, result){
	var	l	= buffer.length,
		i;
	result = result || new Float32Array(l);
	for (i=0; i<l; i++){
		result[i] = buffer[i];
	}
	return result;
};

/**
 * Creates an array of buffers of the specified length and the specified count.
 *
 * @param {Number} length The length of a single channel.
 * @param {Number} channelCount The number of channels.
 * @return {Array} The array of buffers.
*/

Sink.createDeinterleaved = function(length, channelCount){
	var	result	= new Array(channelCount),
		i;
	for (i=0; i<channelCount; i++){
		result[i] = new Float32Array(length);
	}
	return result;
};

global.Sink = Sink;
}(function(){ return this; }()));
/**
 * A helper class for buffer-based audio analyzers, such as FFT.
 *
 * @param {Number} bufferSize Size of the buffer (a power of 2)
*/

function AudioProcessingUnit(bufferSize){
	var k;
	for (k in AudioProcessingUnit.prototype){
		if (AudioProcessingUnit.prototype.hasOwnProperty(k)){
			this[k] = AudioProcessingUnit.prototype[k];
		}
	}
	this.resetBuffer.apply(this, arguments);
}

AudioProcessingUnit.prototype = {
	bufferPos:	-1,
	pushSample: function(s){
		this.bufferPos = (this.bufferPos + 1) % this.buffer.length;
		this.bufferPos === 0 && this.process(this.buffer);
		this.buffer[this.bufferPos] = s;
		return s;
	},
	getMix: function(){
		return this.buffer[this.bufferPos];
	},
	resetBuffer: function(bufferSize){
		this.bufferSize	= isNaN(bufferSize) ? this.bufferSize : bufferSize;
		this.buffer	= new Float32Array(this.bufferSize);
		this.bufferPos	= -1;
	}
};
var FFT = (function(){

var	sin	= Math.sin,
	cos	= Math.cos,
	pi2	= Math.PI * 2;

function twiddle(output, i, n, inverse){
	var	phase	= (inverse ? pi2 : -pi2) * i / n;
	output[0]	= cos(phase);
	output[1]	= sin(phase);
}

function pass2(input, output, inverse, product){
	var	size		= input.length * .5,
		i		= 0,
		j		= 0,
		factor		= 2,
		m		= size / factor,
		q		= size / product,
		product1	= product / factor,
		jump		= (factor - 1) * product1,
		twidlz		= new Float32Array(2),
		k, k1, z0r, z0i, z1r, z1i, x0r, x0i, x1r, x1i;
		for (k=0; k<q; k++, j+= jump){
			twiddle(twidlz, k, q * factor, inverse);

			for (k1=0; k1<product1; k1++, i++, j++){
				z0r	= input[2 * i    ];
				z0i	= input[2 * i + 1];
				z1r	= input[2 * (i + m)    ];
				z1i	= input[2 * (i + m) + 1];
				x0r	= z0r + z1r;
				x0i	= z0i + z1i;
				x1r	= z0r - z1r;
				x1i	= z0i - z1i;

				output[2 * j    ]		= x0r;
				output[2 * j + 1]		= x0i;
				output[2 * (j + product1)    ]	= twidlz[0] * x1r - twidlz[1] * x1i;
				output[2 * (j + product1) + 1]	= twidlz[0] * x1i + twidlz[1] * x1r;
			}
		}
}

function fft(value, scratch, factors, inverse){
	var	product		= 1,
		state		= 0,
		size		= value.length * .5,
		factorCount	= factors.length,
		inp, out, factor, i;

	for (i=0; i<factorCount; i++){
		factor		= factors[i];
		product		*= factor;
		
		state === 0 ? (inp = value, out = scratch, state = 1) : (inp = scratch, out = value, state = 0);
		factor === 2 && pass2(inp, out, inverse, product);
	}
	if (inverse){
		if (state === 1){
			for (i=0; i<size; i++){
				value[2 * i    ]	= scratch[2 * i    ];
				value[2 * i + 1]	= scratch[2 * i + 1];
			}
		}
	} else {
		if (state === 1){
			for (i=0; i<size; i++){
				value[2 * i    ]	= scratch[2 * i    ] / size;
				value[2 * i + 1]	= scratch[2 * i + 1] / size;
			}
		} else {
			for (i=0; i<size; i++){
				value[2 * i    ]	= value[2 * i    ] / size;
				value[2 * i + 1]	= value[2 * i + 1] / size;
			}
		}
	}
}

function FFT(){
	this.reset.apply(this, arguments);
}

FFT.prototype = {
	factors: null,
	scratch: null,
	bufferSize: 2048,
	reset: function(bufferSize){
		this.bufferSize	= isNaN(bufferSize) ? this.bufferSize : this.bufferSize;
		this.factors	= [2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
		this.scratch	= new Float32Array(this.bufferSize);
	},
	forward: function(input){
		fft(input, this.scratch, this.factors, true);
	},
	backward: function(input){
		fft(input, this.scratch, this.factors, false);
	}
};

return FFT;

}());

(function(proto){

proto.resetFFT = proto.reset;

proto.reset = function(sampleRate, bufferSize){
	audioLib.FourierTransform.apply(this, arguments);
	this.resetBuffer.apply(this, [].slice.call(arguments, 1));
	this.resetFT.apply(this, arguments);
	this.resetFFT.apply(this, [].slice.call(arguments, 1));
};

proto.process = function(buffer){
	this[this.method](buffer || this.buffer);
	return this.calculateSpectrum();
};

proto.sampleRate	= 44100;
proto.method		= 'forward';

}(FFT.prototype));
/**
 * Adapted from DSP.js https://github.com/corbanbrook/dsp.js/blob/master/dsp.js
*/

this.FourierTransform = (function(){

var	sin		= Math.sin,
	cos		= Math.cos,
	sqrt		= Math.sqrt,
	floor		= Math.floor,
	pow		= Math.pow,
	log		= Math.log,
	ln2		= Math.ln2,
	pi		= Math.PI,
	tau		= pi * 2;

/**
 * A general purpose FourierTransform class, from which FFT and others inherit from.
 *
 * @param {Number} sampleRate The sample rate of the FFT.
 * @param {Number} bufferSize The buffer size of the FFT. Must be a power of 2.
*/

function FourierTransform(sampleRate, bufferSize){
	var k;
	for (k in FourierTransform.prototype){
		if (FourierTransform.prototype.hasOwnProperty){
			this[k] = FourierTransform.prototype[k];
		}
	}
	AudioProcessingUnit.apply(this, [].slice.call(arguments, 1));
	this.resetFT.apply(this, arguments);
}

FourierTransform.prototype = {
	/** Resets the parameters of the FT */
	resetFT: function(sampleRate){
		var self = this;
		self.sampleRate		= isNaN(sampleRate) ? self.sampleRate : sampleRate;
		self.bandWidth		= 2 / self.bufferSize * self.sampleRate * 0.5;
		self.spectrum		= new Float32Array(self.bufferSize * 0.5);
		self.peakBand		= 0;
		self.peak		= 0;
	},
/**
 * Gets the frequency of a specified band.
 *
 * @param {Number} index The index of the band.
 * @return {Number} The frequency.
*/
	getBandFrequency: function(index){
		return this.bandwidth * index + this.bandWidth * 0.5;
	},
	/** Calculates the spectrum of the FT */
	calculateSpectrum: function(){
		var	self		= this,
			spectrum	= self.spectrum,
			bSi		= 2 / self.bufferSize,
			N		= self.bufferSize / 2,
			rval, ival, mag, i, n;

		for (i=0; i<N; i++){
			n	= i * 2,
			rval	= self.buffer[  i * 2  ];
			ival	= self.buffer[i * 2 + 1];
			mag	= bSi * sqrt(rval * rval + ival * ival);

			if (mag > self.peak){
				self.peakBand	= i;
				self.peak	= mag;
			}

			spectrum[i] = mag;
		}
	}
};

return FourierTransform;
}());
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
audioLib.LP12Filter	= LP12Filter;
audioLib.Reverb		= Freeverb;


//Geneneration
audioLib.Oscillator	= Oscillator;
audioLib.Sampler	= Sampler;
audioLib.Noise		= Noise;


//Processing
audioLib.AudioProcessingUnit	= AudioProcessingUnit;
audioLib.FFT			= FFT;


audioLib.AudioDevice	= audioLib.Sink = (function(){ return this; }()).Sink;


function EffectClass(){
}

EffectClass.prototype = {
	type:		'effect',
	sink:		true,
	source:		true,
	mix:		0.5,
	channelCount:	1,
	append: function(buffer, channelCount){
		var	l	= buffer.length,
			i, n;
		channelCount	= channelCount || this.channelCount;
		for (i=0; i<l; i+=channelCount){
			for (n=0; n<channelCount; n++){
				this.pushSample(buffer[i + n], n);
				buffer[i + n] = this.getMix(n) * this.mix + buffer[i + n] * (1 - this.mix);
			}
		}
		return buffer;
	},
	join:	function(){
		return EffectChain.apply(0, [this].concat(Array.prototype.splice.call(arguments, 0)));
	},
	addPreProcessing: function(callback){
		callback.pushSample = this.pushSample;
		this.pushSample = function(){
			callback.apply(this, arguments);
			return callback.pushSample.apply(this, arguments);
		};
	},
	removePreProcessing: function(callback){
		var f;
		while (f = this.pushSample.pushSample){
			if (f === callback || !callback){
				this.pushSample		= f;
				callback.pushSample	= null;
			}
		}
	},
	addAutomation: function(){
		return audioLib.Automation.apply(audioLib, [this].concat([].slice.call(arguments)));
	},
	setParam: function(param, value){
		this[param] = value;
	}
};

function EffectChain(){
	var	arr	= Array.prototype.splice.call(arguments, 0),
		proto	= arr.prototype = EffectChain.prototype;
	for (i in proto){
		if (proto.hasOwnProperty(i)){
			arr[i] = proto[i];
		}
	}
	return arr;
}

(function(proto){
	EffectChain.prototype = proto;
	proto.pushSample = function(sample){
		var	self	= this,
			mix,
			i;
		for (i=0; i<self.length; i++){
			mix	= self[i].mix;
			sample	= self[i].pushSample(sample) * mix + sample * (1 - mix);
		}
		return sample;
	};
}(new EffectClass()));

function BufferEffect(effect, channelCount, args){
	this.channelCount	= isNaN(channelCount) ? this.channelCount : channelCount;
	this.effects		= [];

	function fx(){
		effect.apply(this, args);
	}
	fx.prototype = effect.prototype;

	while (channelCount--){
		this.effects.push(new fx());
	}
}

BufferEffect.prototype = {
	mix:		0.5,
	type:		'buffereffect',
	channelCount:	2,
	append:	function(buffer){
		var	self	= this,
			ch	= self.channelCount,
			l	= buffer.length,
			i, n;
		for (i=0; i<l; i+=ch){
			for (n=0; n<ch; n++){
				self.effects[n].pushSample(buffer[i + n], 0);
				buffer[i + n] = self.effects[n].getMix(0) * self.mix + buffer[i + n] * (1 - self.mix);
			}
		}
		return buffer;
	},
	join:	function(){
		return BufferEffectChain.apply(0, [this].concat(Array.prototype.splice.call(arguments, 0)));
	},
	addPreProcessing: function(){
		var i;
		for (i=0; i<this.effects.length; i++){
			this.effects[i].addPreProcessing.apply(this.effects[i], arguments);
		}
	},
	removePreProcessing: function(){
		var i;
		for (i=0; i<this.effects.length; i++){
			this.effects[i].removePreProcessing.apply(this.effects[i], arguments);
		}
	},
	addAutomation: function(){
		return audioLib.Automation.apply(audioLib, [this].concat([].slice.call(arguments)));
	},
	setParam: function(param, value){
		var	l	= this.effects.length,
			i;
		for (i=0; i<l; i++){
			this.effects[i].setParam(param, value);
		}
	}
};


function GeneratorClass(){
}

GeneratorClass.prototype = {
	type:			'generator',
	source:			true,
	mix:			1,
	generatedBuffer:	null,
	channelCount:		1,
	append: function(buffer, channelCount){
		var	l	= buffer.length,
			i, n;
		channelCount	= channelCount || this.channelCount;
		for (i=0; i<l; i+=channelCount){
			this.generate();
			for (n=0; n<channelCount; n++){
				buffer[i + n] = this.getMix(n) * this.mix + buffer[i + n];
			}
		}
		return buffer;
	},
	addPreProcessing: function(callback){
		callback.generate = this.generate;
		this.generate = function(){
			callback.apply(this, arguments);
			return callback.generate.apply(this, arguments);
		};
	},
	removePreProcessing: function(callback){
		var f;
		while (f = this.generate.generate){
			if (f === callback || !callback){
				this.generate		= f;
				callback.generate	= null;
			}
		}
	},
	addAutomation: function(){
		return audioLib.Automation.apply(audioLib, [this].concat([].slice.call(arguments)));
	},
	generateBuffer: function(length, chCount){
		this.generatedBuffer = new Float32Array(length);
		this.append(this.generatedBuffer, chCount || 1);
	},
	setParam: function(param, value){
		this[param] = value;
	}
};

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
			effects[name].createBufferBased = createBufferBased;
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
}(['BiquadFilter', 'BitCrusher', 'Chorus', 'CombFilter', 'Compressor', 'Delay', 'Distortion', 'GainController', 'IIRFilter', 'LP12Filter', 'Reverb', 'FFT']));

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

function Codec(name, codec){
	var nameCamel = name[0].toUpperCase() + name.substr(1).toLowerCase();
	Codec[name] = codec;
	if (codec.decode){
		audioLib.Sampler.prototype['load' + nameCamel] = function(filedata){
			this.load.apply(this, [Codec[name].decode(filedata)].concat([].slice.call(arguments, 1)));
		};
	}
	if (codec.encode){
		audioLib.AudioDevice.Recording.prototype['to' + nameCamel] = function(bytesPerSample){
			return Codec[name].encode({
				data:		this.join(),
				sampleRate:	this.boundTo.sampleRate,
				channelCount:	this.boundTo.channelCount,
				bytesPerSample:	bytesPerSample
			});
		};
	}
	return codec;
}

Codec('wav', audioLib.PCMData);

function Plugin(name, plugin){
	Plugin[name] = plugin;
	Plugin._pluginList.push({
		plugin: plugin,
		name:	name
	});
}

__defineConst(Plugin, '_pluginList', [], false);

function AutomationClass(parameter, automation, amount, type){
	this.parameter	= parameter;
	this.automation	= automation;
	this.amount	= isNaN(amount) ? this.amount : amount;
	this.setType(type);
}

AutomationClass.prototype = {
	parameter:	'',
	automation:	null,
	amount:		1,
	type:		'modulation',
	mode:		null,
	setType: function(type){
		if (type){
			if (typeof type === 'function'){
				this.type = type.name || 'custom';
				this.mode = type;
			}
			this.type	= type;
			this.mode	= Automation.modes[type];
		} else {
			this.mode	= this.mode || Automation.modes[this.type];
		}
	}
};

function Automation(fx, parameter, automation, amount, type){
	if (!fx.automation){
		fx.automation = [];
		switch (fx.type){
		case 'generator':
			fx.append = Automation.generatorAppend;		break;
		case 'effect':
			fx.append = Automation.effectAppend;		break;
		case 'buffereffect':
			fx.append = Automation.bufferEffectAppend;	break;
		}
	}
	var automation = new AutomationClass(parameter, automation, amount, type);
	fx.automation.push(automation);
	return automation;
}

Automation.generatorAppend = function(buffer, channelCount){
	var	self	= this,
		l	= buffer.length,
		k	= self.automation.length,
		def	= [],
		z, i, n, m, a;
	channelCount	= channelCount || self.channelCount;
	for (m=0; m<k; m++){
		def.push(self[self.automation[m].parameter]);
	}
	for (i=0, z=0; i<l; i+=channelCount, z++){
		for (m=0; m<k; m++){
			self[self.automation[m].parameter] = def[m];
		}
		for (m=0; m<k; m++){
			a = self.automation[m];
			a.mode(self, a.parameter, a.amount * a.automation.generatedBuffer[z]);
		}

		self.generate();

		for (n=0; n<channelCount; n++){
			buffer[i + n] = self.getMix(n) * self.mix + buffer[i + n];
		}
	}
	for (m=0; m<k; m++){
		self[self.automation[m].parameter] = def[m];
	}
	return buffer;
};

Automation.effectAppend = function(buffer, channelCount){
	var	self	= this,
		l	= buffer.length,
		k	= self.automation.length,
		def	= [],
		z, i, n, m, a;
	channelCount	= channelCount || self.channelCount;
	for (m=0; m<k; m++){
		def.push(self[self.automation[m].parameter]);
	}
	for (i=0, z=0; i<l; i+=channelCount, z++){
		for (m=0; m<k; m++){
			self[self.automation[m].parameter] = def[m];
		}
		for (m=0; m<k; m++){
			a = self.automation[m];
			a.mode(self, a.parameter, a.amount * a.automation.generatedBuffer[z]);
		}

		for (n=0; n<channelCount; n++){
			self.pushSample(buffer[i + n], n);
			buffer[i + n] = self.getMix(n) * self.mix + buffer[i + n] * (1 - self.mix);
		}
	}
	for (m=0; m<k; m++){
		self[self.automation[m].parameter] = def[m];
	}
	return buffer;
};

Automation.bufferEffectAppend = function(buffer, channelCount){
	var	self	= this,
		ch	= channelCount || self.channelCount,
		l	= buffer.length,
		k	= self.automation.length,
		def	= [],
		i, n, m, z, a, x;
	for (m=0; m<k; m++){
		def.push([]);
		for (n=0; n<ch; n++){
			def[m].push(self.effects[n][self.automation[m].parameter]);
		}
	}
	for (x=0, i=0; i<l; i+=ch, x++){
		for (n=0; n<ch; n++){
			for (m=0; m<k; m++){
				a = self.automation[m];
				self.effects[n][a.parameter] = def[m][n];
				a.mode(self.effects[n], a.parameter, a.amount * a.automation.generatedBuffer[x]);
			}
			buffer[i + n] = self.effects[n].pushSample(buffer[i + n]) * self.mix + buffer[i + n] * (1 - self.mix);
		}
	}
	for (m=0; m<k; m++){
		for (n=0; n<ch; n++){
			self.effects[n][self.automation[m].parameter] = def[m][n];
		}
	}
	return buffer;
};

Automation.modes = {
	modulation: function(fx, param, value){
		fx.setParam(param, fx[param] * value);
	},
	addition: function(fx, param, value){
		fx.setParam(param, fx[param] + value);
	},
	subtraction: function(fx, param, value){
		fx.setParam(param, fx[param] - value);
	},
	additiveModulation: function(fx, param, value){
		fx.setParam(param, fx[param] + fx[param] * value);
	},
	subtractiveModulation: function(fx, param, value){
		fx.setParam(param, fx[param] - fx[param] * value);
	},
	assignment: function(fx, param, value){
		fx.setParam(param, value);
	},
	absoluteAssignment: function(fx, param, value){
		fx.setParam(param, Math.abs(value));
	},
};

Automation.__constructror		= AutomationClass;

audioLib.Automation			= Automation;

audioLib.EffectChain			= EffectChain;
audioLib.EffectClass			= EffectClass;
audioLib.BufferEffect			= BufferEffect;
audioLib.GeneratorClass			= GeneratorClass;
audioLib.codecs				= audioLib.Codec = Codec;
audioLib.plugins			= Plugin;

audioLib.version			= '0.5.0';

return audioLib;
}).call(typeof exports === 'undefined' ? {} : this, this.window || global, Math, Object, Array);
