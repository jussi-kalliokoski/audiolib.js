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

this.audioLib = (function AUDIOLIB(global, Math){

var	arrayType	= global.Float32Array || Array,
	audioLib	= this;

function Float32Array(length){
	var array = new arrayType(length);
	array.subarray = array.subarray || array.slice;
	return array;
}

audioLib.Float32Array = Float32Array;
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
*/
function ADSREnvelope(sampleRate, attack, decay, sustain, release){
	this.attack	= attack	|| 50; // ms
	this.decay	= decay		|| 50; // ms
	this.sustain	= sustain	|| 1; // 0.0 - 1.0
	this.release	= release	|| 50; // ms

	this.value = 0;

	var	self	= this,
		state	= 3,
		gate	= false,
		states	= [function(){ // 0: Attack
				self.value += 1000 / self.sampleRate / self.attack;
				if (self.value >= 1){
					state = 1;
				}
			}, function(){ // 1: Decay
				self.value -= 1000 / self.sampleRate / self.decay * self.sustain;
				if (self.value <= self.sustain){
					state = 2;
				}
			}, function(){ // 2: Sustain
				self.value = self.sustain;
			}, function(){ // 3: Release
				self.value = Math.max(0, self.value - 1000 / self.sampleRate / self.release);
		}];

	this.generate = function(){
		states[state]();
		return this.value;
	};

	this.triggerGate = function(open){
		gate = open;
		state = gate ? 0 : 3;
	}

	this.sampleRate = sampleRate;
}
/**
 * Creates a MidiEventTracker to control voices from MIDI events.
 *
 * @constructor
 * @this MidiEventTracker
*/

function MidiEventTracker(){
	var	self		= this,
		pressedKeys	= [];
	this.velocity = 0; // 0.0 - 1.0
	this.legato = 0; // ['Last', 'Lowest', 'Highest']
	this.retrigger = 0; // ['Always', 'First Note']
	this.polyphony = 1;
	this.activeKeys = [];
	this.voices = [];
	this.pitchBend = 0;

	function voice(key, velocity){
		this.key = key;
		this.velocity = velocity;
		this.noteOff = function(){};
		this.onKeyChange = function(){};
		this.changeKey = function(k, v){
			this.key = k;
			this.v = v;
			this.onKeyChange();
		};
		this.getFrequency = function(){
			return self.getFrequencyForKey(this.key);
		};
		self.voice.apply(this);
	}

	function removePressedKey(key){
		var i;
		for (i=0; i<pressedKeys.length; i++){
			if (pressedKeys[i].key === key){
				pressedKeys.splice(i--, 1);
			}
		}
	}

	function addPressedKey(key, velocity){
		removePressedKey(key);
		pressedKeys.push({key: key, velocity: velocity});
	}

	function selectActiveKeys(){
		var i, n, selected = [];

		if (self.legato === 0){
			selected = pressedKeys.slice(0);
		} else if (self.legato === 1) {
			for (i=0; i<pressedKeys.length; i++){
				for (n=0; n<selected.length; n++){
					if (n === pressedKeys.length - 1 || (selected[n-1].key > pressedKeys[i].key && selected[n].key < pressedKeys[i].key)){
						selected.splice(n, 0, pressedKeys[i]);
						break;
					}
				}
			}
		} else if (self.legato === 2) {
			for (i=0; i<pressedKeys.length; i++) {
				for (n=0; n<selected.length; n++) {
					if (n === pressedKeys.length - 1 || (selected[n-1].key < pressedKeys[i].key && selected[n].key > pressedKeys[i].key)){
						selected.splice(n, 0, pressedKeys[i]);
						break;
					}
				}
			}
		}

		self.activeKeys = selected.slice(-self.polyphony);
	}

	function selectVoices(){
		if (!self.voice){
			return;
		}
		var i, n, isActive;
		if (self.polyphony === 1 && self.activeKeys.length > 0){
			i = self.activeKeys.length - 1;
			if (self.voices.length === 0){
				self.voices.push(new voice(self.activeKeys[i].key, self.activeKeys[i].velocity));
			} else {
				self.voices[0].changeKey(self.activeKeys[i].key, self.activeKeys[i].velocity);
			}
		} else {
			for (n=0; n<self.activeKeys.length; n++){
				isActive = false;
				for (i=0; i<self.voices.length; i++){
					if (self.voices[i].key === self.activeKeys[n].key){
						isActive = true;
						break;
					}
				}
				if (!isActive){
					self.voices.push(new voice(self.activeKeys[i].key, self.activeKeys[i].velocity));
				}
			}
		}

		for (i=0; i<self.voices.length; i++){
			isActive = false;
			for (n=0; n<self.activeKeys.length; n++){
				if (self.voices[i].key === self.activeKeys[n].key){
					isActive = true;
					break;
				}
			}
			if (!isActive){
				self.voices[i].noteOff();
				self.voices.splice(i--, 1);
			}
		}
				
			
	}

	function noteOn(key, velocity){
		var previouslyPressed = self.activeKeys.length;
		addPressedKey(key, velocity);
		selectActiveKeys();
		selectVoices();
		self.onNoteOn(key, velocity);
		if (self.retrigger === 0 || (previouslyPressed === 0 && self.activeKeys.length > 0)){
			self.onTrigger();
		}
/*		document.title = (previouslyPressed == 0 && self.activeKeys.length > 0);
		if (self.retrigger == 0 || (previouslyPressed == 0 && self.activeKeys.length > 0))
			self.onTrigger();*/
	}

	function noteOff(key, velocity){
		removePressedKey(key, velocity);
		selectActiveKeys();
		selectVoices();
		self.onNoteOff(key, velocity);
		if (self.activeKeys === 0){
			self.onRelease();
		}
	}

	this.onMidi = function(midievent){
		switch(midievent.status){
			case 9: // NOTE ON (0x1001)
				noteOn(midievent.data1, midievent.data2/127);
				break;

			case 8: // NOTE OFF (0x1000)
				noteOff(midievent.data1, midievent.data2/127);
				break;
			case 14: // PITCH BEND (0x1110)
				self.pitchBend = (midievent.data1 * 128 + midievent.data2 - 8192) / 8192;
				break;
		}
	};

	this.getFrequencyForKey = function(key){
		return 440 * Math.pow(1.059, key-69);
	};

	this.getFrequency = function(){
		var frequencies = [], i;
		for (i=0; i<self.activeKeys.length; i++){
			frequencies.push(self.getFrequencyForKey(self.activeKeys[i].key));
		}
		if (frequencies.length > 2){
			return frequencies[0];
		}
		return frequencies;
	};

	this.onTrigger = function(){};
	this.onRelease = function(){};
	this.onNoteOn = function(){};
	this.onNoteOff = function(){};
	this.voice = null;

	this.listener = function(midievent)
	{
		self.onMidi(midievent);
	};
}
/**
 * Creates a StepSequencer.
 *
 * @constructor
 * @this {StepSequencer}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} stepLength (Optional) Step Length (ms).
 * @param {Array} steps (Optional) Array of steps (unsigned double) for the sequencer to iterate.
 * @param {number} attack (Optional) Attack (ms).
*/
function StepSequencer(sampleRate, stepLength, steps, attack){
	var	self	= this,
		phase	= 0;

	self.sampleRate		= sampleRate;
	self.stepLength		= stepLength || 200; // ms
	self.steps		= steps || [1,0];
	self.value		= 0;
	self.attack		= attack || 0;


	self.generate = function(){
		var	stepLength	= self.sampleRate / 1000 * self.stepLength,
			steps		= self.steps,
			sequenceLength	= stepLength * steps.length,
			step, overStep, prevStep, stepDiff,
			val;
		if (++phase === sequenceLength){
			phase = 0;
		}
		step		= phase / sequenceLength * steps.length;
		overStep	= step % 1;
		step		= Math.floor(step);
		prevStep	= (step || steps.length) - 1;
		stepDiff	= steps[step] - steps[prevStep];
		val = steps[step];
		if (overStep < self.attack){
			val -= stepDiff - stepDiff / self.attack * overStep;
		}
		self.value = val;
		return val;
	}

	self.triggerGate = function(){
		phase = 0;
	}
}
/**
 * Creates an AllPassFilter effect.
 *
 * @constructor
 * @this {AllPassFilter}
 * @param {number} sampleRate Sample Rate (hz).
 * @param {number} maxDelay The maximum delay (spl).
 * @param {number} delay The delay (spl).
 * @param {number} volume Effect intensity (unsigned double).
*/

function AllPassFilter(sampleRate, maxDelay, delay, volume){
	var	self		= this,
		buffer		= new Float32Array(maxDelay),
		bufferMax	= maxDelay - 1,
		inputPointer	= delay,
		outputPointer	= 0,
		sample		= 0.0;

	this.volume	= self.volume || 1;

	self.sampleRate = sampleRate;

	self.pushSample	= function(s){
		buffer[inputPointer++] = s;
		sample	= buffer[outputPointer++] * self.volume;
		if (inputPointer	>= bufferMax){
			inputPointer	= 0;
		}
		if (outputPointer	>= bufferMax){
			outputPointer	= 0;
		}
		return sample;
	}

	self.getMix = function(){
		return sample;
	}
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
 * Creates a Delay effect.
 *
 * @constructor
 * @this {Delay}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} time (Optional) Delay time (ms).
 * @param {number} feedback (Optional) Feedback (unsigned double).
*/
function Delay(samplerate, time, feedback)
{
	var	self		= this,
		bufferSize	= (!samplerate ? 44100 : samplerate) * 2,
		buffer		= new Float32Array(bufferSize),
		bufferPos	= 0,
		speed		= 0,
		prevTime	= 0,
		sample		= 0.0,

		floor		= Math.floor;

	function calcCoeff(){
		speed = bufferSize / self.samplerate / self.time * 1000;
		prevTime = self.time;
	}

	function fillBuffer(sample, from, to){
		var i = from;
		while (i++ !== to){
			if (i >= bufferSize){
				i=0;
			}
			buffer[i] = sample;
		}
	}

	function algo0(s){
		buffer[bufferPos++] += s;
		if (bufferPos > self.time / 1000 * self.samplerate){
			bufferPos = 0;
		}
		buffer[bufferPos] = buffer[bufferPos] * self.feedback;
	}

	function algo1(s){
		var startPos = floor(bufferPos);
		if (prevTime !== self.time){
			calcCoeff();
		}
		bufferPos += speed;
		if (bufferPos >= bufferSize){
			bufferPos -= bufferSize;
		}
		fillBuffer(s + buffer[floor(bufferPos)] * self.feedback, startPos, floor(bufferPos));
	}

	this.time = !time ? 1000 : time; //ms
	this.feedback = 0.0; // 0.0 - 1.0
	this.algorithm = 0; // ['No resampling(faster)', 'Resampling (slower, beta)']
	this.samplerate = samplerate;

	this.pushSample = function(s){
		if (this.algorithm === 0){
			algo0(s);
		} else {
			algo1(s);
		}
		sample = buffer[floor(bufferPos)];
		return sample;
	};

	this.getMix = function(){
		return sample;
	};
}
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
(function(global, audioLib){

audioLib.Capper = function(sampleRate, cap){
	var	self	= this,
		sample	= 0.0;
	self.sampleRate = sampleRate;
	self.cap = cap || 1;
	self.pushSample = function(s){
		sample = s > self.cap ? 2 * self.cap - s : s < -self.cap ? -2 * self.cap - s : s;
		return sample;
	};
	self.getMix = function(){
		return sample;
	};
};

audioLib.Expo = function(sampleRate, param){
	var	self	= this;
		sample	= 0.0;
	self.sampleRate = sampleRate;
	self.param = param || 0.8;
	self.pushSample = function(s){
		sample = (s < 0 ? -Math.pow(self.param * 2, -s) : Math.pow(self.param * 2, s) ) / 10;
		return sample;
	};
	self.getMix = function(){
		return sample;
	};
}

}(this, audioLib));
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
// A simple and fast low pass filter. Also low quality...

/**
 * Creates a LowPassFilter effect.
 *
 * @constructor
 * @this {LowPassFilter}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} freq (Optional) The cutoff frequency (hz).
 * @param {number} reso (Optional) Resonance (unsigned double).
*/
function LowPassFilter(samplerate, freq, reso){
	var	self	= this,
		smpl	= [0.0, 0.0];
	self.cutoff	= !freq ? 20000 : freq; // > 40
	self.resonance	= !reso ? 0.0 : reso; // 0.0 - 1.0
	self.samplerate	= samplerate;

	self.pushSample = function(s){
		var	cut_lp	= self.cutoff * 2 / self.samplerate,
			fb_lp	= self.resonance + self.resonance / (1-cut_lp);
		smpl[0] = smpl[0] + cut_lp * (s - smpl[0] + fb_lp * (smpl[0] - smpl[1]));
		smpl[1] = smpl[1] + cut_lp * (smpl[0] - smpl[1]);
		return smpl[1];
	};

	self.getMix = function(){
		return smpl[1];
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
function Oscillator(samplerate, freq)
{
	var	phase		= 0,
		p		= 0,
		FullPI		= Math.PI * 2,
		wavetable	= new Float32Array(1),
		waveShapes;
	this.frequency = 440;
	if (freq){
		this.frequency = freq;
	}
	this.phaseOffset = 0;
	this.pulseWidth = 0.5;
	this.waveShape = 0; // ['Sine', 'Triangle', 'Pulse', 'Sawtooth', 'Invert Sawtooth', 'Square']
	this.samplerate = samplerate;
	this.generate = function(/* FM1, FM2, ... FMX */){
		var	f	= this.frequency + 0,
			pw	= this.pulseWidth,
			i, l	= arguments.length;
		for (i=0; i<l; i++){
			f += f * arguments[i];
		}
		phase = (phase + f / this.samplerate / 2) % 1;
		p = (phase + this.phaseOffset) % 1;
		p = p < pw ? p / pw : (p-pw) / (1-pw);
	};
	this.getMix = function(){
		return waveShapes[this.waveShape]();
	};
	this.getPhase = function(){
		return p;
	}; // For prototype extensions, otherwise use the p variable
	this.reset = function(){
		phase = 0.0;
	};
	this.setWavetable = function(wt){
		wavetable = wt;
		return true;
	};
	this.sine = function(){
		return Math.sin(p * FullPI);
	};
	this.triangle = function(){
		if (p < 0.5){
			return 4 * p - 1;
		}
		return 3 - 4 * p;
	};
	this.square = function(){
		return (p < 0.5) ? -1 : 1;
	};
	this.sawtooth = function(){
		return 1 - p * 2;
	};
	this.invSawtooth = function(){
		return p * 2 - 1;
	};
	this.pulse = function(){
		if (p < 0.5){
			if (p < 0.25){
				return p * 8 - 1;
			} else {
				return 1 - (p - 0.25) * 8;
			}
		}
		return -1;
	};
	this.wavetable = function(){
		return wavetable[Math.floor(p * wavetable.length)];
	};

	waveShapes = this.waveShapes = [this.sine, this.triangle, this.pulse, this.sawtooth, this.invSawtooth, this.square];
}
function Sampler(sampleRate, sample, pitch){
	var	self	= this,
		voices	= [],
		smpl;
	self.sampleRate	= sampleRate;
	self.sample	= sample;
	self.pitch	= pitch || 440;
	self.delayStart	= 0;
	self.delayEnd	= 0;
	self.maxVoices	= 0;
	self.noteOn	= function(frequency){
		frequency	= frequency || self.pitch;
		var	speed	= frequency / self.pitch,
			rate	= self.sampleRate,
			start	= rate * self.delayStart,
			end	= self.sample.length - rate * self.delayEnd,
			note	= {
			f:	frequency,
			p:	start,
			s:	speed,
			l:	end
		};
		voices.push(note);
		return note;
	};
	self.generate	= function(){
		var	i, voice;
		for (i=0; i<voices.length; i++){
			voice = voices[i];
			voice.p += voice.s;
			voice.p > voice.l && voices.splice(i--, 1) && voice.onend && voice.onend();
		}
	};
	self.getMix	= function(ch){
		var	smpl	= 0,
			i;
		ch = ch || 0;
		for (i=0; i<voices.length; i++){
			smpl	+= Sampler.interpolate(self.samples[ch], voices[i].p);
		}
		return smpl;
	};
	self.load	= function(data, resample){
		var	samples = self.samples = Sampler.splitChannels(data.data, data.channelCount),
			i;
		if (resample){
			for (i=0; i<samples.length; i++){
				samples[i] = Sampler.resample(samples[i], data.sampleRate, 1, self.sampleRate, 1);
			}
		}
		self.sample	= resample ? Sampler.resample(samples, data.sampleRate, 1, self.sampleRate, 1) : samples;
	};
}

/**
 * Interpolates a fractal part position in an array to a sample.
 *
 * @param {Array} arr The sample buffer.
 * @param {number} pos The position to interpolate from.
 * @return {Float32} The interpolated sample.
*/
Sampler.interpolate	= function(arr, pos){
	var	first	= Math.floor(pos),
		second	= first + 1,
		frac	= pos - first;
	 second		= second < arr.length ? second : 0;
	return arr[first] * (1 - frac) + arr[second] * frac;
};

/**
 * Resamples a sample buffer from a frequency to a frequency and / or from a sample rate to a sample rate.
 *
 * @param {Float32Array} buffer The sample buffer to resample.
 * @param {number} fromRate The original sample rate of the buffer.
 * @param {number} fromFrequency The original frequency of the buffer.
 * @param {number} toRate The sample rate of the created buffer.
 * @param {number} toFrequency The frequency of the created buffer.
*/
Sampler.resample	= function(buffer, fromRate, fromFrequency, toRate, toFrequency){
	var
		speed		= toRate / fromRate * toFrequency / fromFrequency,
		l		= buffer.length,
		length		= Math.ceil(l / speed),
		newBuffer	= new Float32Array(length),
		i, n;
	for (i=0, n=0; i<l; i += speed){
		newBuffer[n++] = Sampler.interpolate(buffer, i);
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

Sampler.splitChannels	= function(buffer, channelCount){
	var	l	= buffer.length,
		size	= l / channelCount,
		ret	= [],
		i, n;
	for (i=0; i<channelCount; i++){
		ret[i] = new Float32Array(size);
		for (n=0; n<size; n++){
			ret[i][n] = buffer[i * channelCount + n];
		}
	}
	return ret;
};

/**
 * Joins an array of sample buffers in a single buffer.
 *
 * @param {Array} buffers The buffers to join.
*/

Sampler.joinChannels	= function(buffers){
	var	channelCount	= buffers.length,
		l		= buffers[0].length,
		buffer		= new Float32Array(l * channelCount),
		i, n;
	for (i=0; i<channelCount; i++){
		for (n=0; n<l; n++){
			buffer[i + n * channelCount] = buffers[i][n];
		}
	}
	return buffer;
};
(function (global){
/**
 * Enumerates contents of an array as properties of an object, defined as true.
 *
 * @param {Array} arr The array to be enumerated.
 * @return {Object} The resulting object.
*/
	function propertyEnum(arr){
		var	i, l	= arr.length,
			result	= {};
		for (i=0; i<l; i++){
			result[arr[i]] = true;
		}
		return result;
	}

	var	allowedBufferSizes	= propertyEnum([256, 512, 1024, 2048, 4096, 8192, 16384]),
		allowedSampleRates	= propertyEnum([48000, 44100, 22050]),

		intToStr		= String.fromCharCode;

/**
 * Creates an AudioDevice according to specified parameters, if possible.
 *
 * @param {Function} readFn A callback to handle the buffer fills.
 * @param {number} channelCount Channel count.
 * @param {number} preBufferSize (Optional) Specifies a pre-buffer size to control the amount of latency.
 * @param {number} sampleRate Sample rate (ms).
*/
	function AudioDevice(readFn, channelCount, preBufferSize, sampleRate){
		var	devices	= AudioDevice.devices,
			dev;
		for (dev in devices){
			if (devices.hasOwnProperty(dev) && devices[dev].enabled){
				try{
					return new devices[dev](readFn, channelCount, preBufferSize, sampleRate);
				} catch(e1){};
			}
		}

		throw "No audio device available.";
	}

	function Recording(bindTo){
		this.boundTo = bindTo;
		this.buffers = [];
		bindTo.activeRecordings.push(this);
	}

	Recording.prototype = {
		add: function(buffer){
			this.buffers.push(buffer);
		}, clear: function(){
			this.buffers = [];
		}, stop: function(){
			var	recordings = this.boundTo.activeRecordings,
				i;
			for (i=0; i<recordings.length; i++){
				if (recordings[i] === this){
					recordings.splice(i--, 1);
				}
			}
		}, join: function(){
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

	function audioDeviceClass(type){
		this.type = type;
	}


	audioDeviceClass.prototype = {
		record: function(){
			return new Recording(this);
		}, recordData: function(buffer){
			var	activeRecs	= this.activeRecordings,
				i, l		= activeRecs.length;
			for (i=0; i<l; i++){
				activeRecs[i].add(buffer);
			}
		}, writeBuffers: function(buffer){
			var	
				buffers		= this.buffers,
				l		= buffer.length,
				buf,
				bufLength,
				i, n;
			if (buffers){
				for (i=0; i<buffers.length; i++){
					buf		= buffers[i];
					bufLength	= buf.length;
					for (n=0; n < l && n < bufLength; n++){
						buffer[n] += buf[n];
					}
					buffers[i] = buf.subarray(n);
					i >= bufLength && buffers.splice(i--, 1);
				}
			}
		}, writeBuffer: function(buffer){
			var	buffers		= this.buffers = this.buffers || [];
			buffers.push(buffer);
			return buffers.length;
		}
	};

	function mozAudioDevice(readFn, channelCount, preBufferSize, sampleRate){
		sampleRate	= allowedSampleRates[sampleRate] ? sampleRate : 44100;
		preBufferSize	= allowedBufferSizes[preBufferSize] ? preBufferSize : sampleRate / 2;
		var	self			= this,
			currentWritePosition	= 0,
			tail			= null,
			audioDevice		= new Audio(),
			written, currentPosition, available, soundData,
			timer; // Fix for https://bugzilla.mozilla.org/show_bug.cgi?id=630117

		function doInterval(callback, timeout){
			var timer, id, prev;
			if (mozAudioDevice.backgroundWork){
				if (window.MozBlobBuilder){
					prev	= new MozBlobBuilder();
					prev.append('setInterval(function(){ postMessage("tic"); }, ' + timeout + ');');
					id	= window.URL.createObjectURL(prev.getBlob());
					timer	= new Worker(id);
					timer.onmessage = function(){
						callback();
					};
					return function(){
						timer.terminate();
						window.URL.revokeObjectURL(id);
					};
				}
				id = prev = +new Date + '';
				function messageListener(e){
					if (e.source === window && e.data === id && prev < +new Date){
						prev = +new Date + timeout;
						callback();
					}
					window.postMessage(id, '*');
				}
				window.addEventListener('message', messageListener, true);
				window.postMessage(id, '*');
				return function(){
					window.removeEventListener('message', messageListener);
				};
			} else {
				timer = setInterval(callback, timeout);
				return function(){
					clearInterval(timer);
				};
			}
		}

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
			available = Number( currentPosition + preBufferSize * channelCount - currentWritePosition) + 0;
			if (available > 0){
				soundData = new Float32Array(available);
				readFn && readFn(soundData, self.channelCount);
				self.writeBuffers(soundData);
				self.recordData(soundData);
				written = audioDevice.mozWriteAudio(soundData);
				if (written < soundData.length){
					tail = soundData.subarray(written);
				}
				currentWritePosition += written;
			}
		}

		audioDevice.mozSetup(channelCount, sampleRate);
		timer = doInterval(bufferFill, 20);

		this.kill = function(){
			timer();
		};
		this.activeRecordings = [];

		this.sampleRate		= sampleRate;
		this.channelCount	= channelCount;
		this.type		= 'moz';
	}

	mozAudioDevice.enabled		= true;
	mozAudioDevice.backgroundWork	= false;
	mozAudioDevice.prototype	= new audioDeviceClass('moz');

	function webkitAudioDevice(readFn, channelCount, preBufferSize, sampleRate){
		sampleRate	= allowedSampleRates[sampleRate] ? sampleRate : 44100;
		preBufferSize	= allowedBufferSizes[preBufferSize] ? preBufferSize : 4096;
		var	self		= this,
			context		= new (window.AudioContext || webkitAudioContext)(),
			node		= context.createJavaScriptNode(preBufferSize, 0, channelCount),
			// For now, we have to accept that the AudioContext is at 48000Hz, or whatever it decides, and that we have to use a dummy buffer source.
			inputBuffer	= context.createBufferSource(/* sampleRate */);

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

			readFn && readFn(soundData, channelCount);
			self.writeBuffers(soundData);
			self.recordData(soundData);

			for (i=0; i<l; i++){
				for (n=0; n < channelCount; n++){
					channels[n][i] = soundData[i * channelCount + n];
				}
			}
		}

		node.onaudioprocess = bufferFill;
		// Connect the dummy buffer to the JS node to get a push.
		inputBuffer.connect(node);
		node.connect(context.destination);

		this.kill = function(){
			// ??? I have no idea how to do this.
		};
		this.activeRecordings = [];

		this.sampleRate		= context.sampleRate;
		this.channelCount	= channelCount;
		this.type		= 'webkit';
	}

	webkitAudioDevice.enabled	= true;
	webkitAudioDevice.prototype	= new audioDeviceClass('webkit');

	function dummyAudioDevice(readFn, channelCount, preBufferSize, sampleRate){
		sampleRate	= allowedSampleRates[sampleRate] ? sampleRate : 44100;
		preBufferSize	= allowedBufferSizes[preBufferSize] ? bufferSize : 8192;
		var 	self		= this,
			timer;

		function bufferFill(){
			var	soundData = new Float32Array(preBufferSize * channelCount);
			readFn && readFn(soundData, self.channelCount);
			self.writeBuffers(soundData);
			self.recordData(soundData);
		}

		this.kill = function(){
			clearInterval(timer);
		}
		this.activeRecordings = [];

		setInterval(bufferFill, preBufferSize / sampleRate * 1000);

		this.sampleRate		= sampleRate;
		this.channelCount	= channelCount;
		this.type		= 'dummy';
	}

	dummyAudioDevice.enabled	= true;
	dummyAudioDevice.prototype	= new audioDeviceClass('dummy');

	AudioDevice.deviceClass		= audioDeviceClass;
	AudioDevice.propertyEnum	= propertyEnum;
	AudioDevice.devices		= {
		moz:		mozAudioDevice,
		webkit:		webkitAudioDevice,
		dummy:		dummyAudioDevice
	};

	AudioDevice.Recording		= Recording;

	global.AudioDevice = AudioDevice;
}(this));
// Requires AudioDevice

this.AudioDevice.createScheduled = function(callback){
	var	schedule	= [],
		previousCall	= 0,
		dev;

	function fn(buffer, channelCount){
		var	l		= buffer.length / channelCount,
			chunkSize	= dev.chunkSize,
			chunkLength	= chunkSize * channelCount,
			n, i, ptr;
		previousCall = +new Date;
		for (i=0; i<l; i += chunkSize){
			for (n=0; n<schedule.length; n++){
				schedule[n].t -= chunkSize;
				if (schedule[n].t <= 0){
					schedule[n].f.apply(schedule[n].x, schedule[n].a);
					schedule.splice(n--, 1);
				}
			}
			ptr = i * chunkLength;
			callback(buffer.subarray(ptr, ptr + chunkLength), channelCount);
		}
	}

	dev = this.apply(this, [fn].concat(Array.prototype.splice.call(arguments, 1)));
	dev.schedule = function(callback, context, args){
		schedule.push({
			f: callback,
			x: context,
			a: args,
			t: ((new Date - previousCall) * 0.001 * this.sampleRate)
		});
	};
	dev.chunkSize = 1;
	return dev;
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
	blob.append('var audioLib = (' + String(AUDIOLIB) + '(this, Math));\n');
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
	function Binary(bitCount, signed, /* false === unsigned */ isFloat, from /* false === to */){

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
			isFloat ?
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
			isFloat ?
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
	Binary.fromFloat64		= Binary(64, y, y, y);
	Binary.toFloat64		= Binary(64, y, y, n);
*/
	Binary.fromFloat32		= Binary(32, y, y, y);
	Binary.toFloat32		= Binary(32, y, y, n);
	Binary.fromFloat24		= Binary(24, y, y, y);
	Binary.toFloat24		= Binary(24, y, y, n);
	Binary.fromFloat16		= Binary(16, y, y, y);
	Binary.toFloat16		= Binary(16, y, y, n);
	Binary.fromFloat8		= Binary(8, y, y, y);
	Binary.toFloat8			= Binary(8, y, y, n);
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
	(new Stream(frame)).readBuffer(result, bitCount, 'Float');
	return result;
};

PCMData.encodeFrame = function(frame, bitCount){
	var	properWriter	= Binary['fromFloat' + bitCount],
		l		= frame.length,
		r		= '',
		i;
	for (i=0; i<l; i++){
		r += properWriter(frame[i]);
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
		dwBitsPerSample		= dwChunkSize1 === 16 ? formatChunk.readUint16() : formatChunk.readUint32(),
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
(function(global, Math){

// Make Math functions local.
var	sin		= Math.sin,
	cos		= Math.cos,
	sqrt		= Math.sqrt,
	floor		= Math.floor,
	pow		= Math.pow,
	ln2		= Math.ln2,
	pi		= Math.PI,
	tau		= pi * 2;

function InheritFT(obj, sampleRate, bufferSize){
	obj.sampleRate	= sampleRate;
	obj.bufferSize	= bufferSize;
	obj.bandWidth	= .5 * bufferSize * sampleRate * .5;
	obj.spectrum	= new Float32Array(bufferSize * .5);
	obj.real	= new Float32Array(bufferSize);
	obj.imag	= new Float32Array(bufferSize);
	obj.peakBand	=
	obj.peak	= 0;
	obj.getBandFrequency = function(index){
		return this.bandwidth * index + this.bandwidth * .5;
	};
	obj.calculateSpectrum = function(){
		var	self		= this,
			spectrum	= self.spectrum,
			real		= self.real,
			imag		= self.imag,
			bSi		= .5 * self.bufferSize,
			sq		= sqrt,
			N		= bufferSize * .5,
			rval, ival, mag, i;

		for (i=0; i<N; i++){
			rval	= real[i];
			ival	= imag[i];
			mag	= bSi * sq(rval * rval + ival * ival);

			if (mag > self.peak){
				self.peakBand	= i;
				self.peak	= mag;
			}
		}
	}
}

function FourierTransform(type, sampleRate, bufferSize){
	return new FourierTransform[type](sampleRate, bufferSize);
}

function DFT(sampleRate, bufferSize){
	var	self		= this,
		N		= bufferSize * bufferSize * .5,
		sinTable	= new Float32Array(N),
		cosTable	= new Float32Array(N),
		i;

	InheritFT(self, sampleRate, bufferSize);

	for (i=0; i<N; i++){
		sinTable[i] = sin(i * tau / bufferSize);
		cosTable[i] = cos(i * tau / bufferSize);
	}

	self.forward = function(buffer){
		var	self	= this,
			real	= self.real,
			imag	= self.imag,
			N	= self.bufferSize * .5,
			l	= buffer.length,
			rval, ival, k, n, kn;

		for (k=0; k<N; k++){
			rval = ival = 0.0;
			for (n=0; n<l; n++){
				rval	+= cosTable[kn = k*n]	* buffer[n];
				ival	+= sinTable[kn]		* buffer[n];
			}

			real[k]	= rval;
			imag[k] = ival;
		}

		return self.calculateSpectrum();
	}
}

global.FourierTransform	= FourierTransform;
FourierTransform.DFT	= DFT;
}(this, Math));
/*
	wrapper-end.js
	Please note that this file is of invalid syntax if standalone.
*/

// Controls
audioLib.ADSREnvelope		= ADSREnvelope;
audioLib.MidiEventTracker	= MidiEventTracker;
audioLib.StepSequencer		= StepSequencer;

//Effects
audioLib.AllPassFilter	= AllPassFilter;
audioLib.Chorus		= Chorus;
audioLib.Delay		= Delay;
audioLib.Distortion	= Distortion;
audioLib.IIRFilter	= IIRFilter;
audioLib.LowPassFilter	= LowPassFilter;
audioLib.LP12Filter	= LP12Filter;


//Geneneration
audioLib.Oscillator	= Oscillator;
audioLib.Sampler	= Sampler;

function EffectClass(){
}

EffectClass.prototype = {
	type:	'effect',
	sink:	true,
	source:	true,
	mix:	0.5,
	join:	function(){
		return EffectChain.apply(0, [this].concat(Array.prototype.splice.call(arguments, 0)));
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
	this.channelCount	= channelCount;
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
	mix: 0.5,
	append:	function(buffer){
		var	self	= this,
			ch	= self.channelCount,
			l	= buffer.length,
			i, n;
		for (i=0; i<l; i+=ch){
			for (n=0; n<ch; n++){
				buffer[i + n] = self.effects[n].pushSample(buffer[i + n]) * self.mix + buffer[i + n] * (1 - self.mix);
			}
		}
		return buffer;
	},
	join:	function(){
		return BufferEffectChain.apply(0, [this].concat(Array.prototype.splice.call(arguments, 0)));
	}
};

(function(names, i, effects, name, proto){
	effects = audioLib.effects = {};

	function createBufferBased(channelCount){
		return new audioLib.BufferEffect(this, channelCount, [].slice.call(arguments, 1));
	}

	for (i=0; i<names.length; i++){
		name = names[i];
		effects[name]	= audioLib[name];
		proto		= effects[name].prototype = new EffectClass();
		proto.name	= proto.fxid = name;
		effects[name].createBufferBased = createBufferBased;
	}
}(['AllPassFilter', 'Chorus', 'Delay', 'Distortion', 'IIRFilter', 'LowPassFilter', 'LP12Filter']));

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

audioLib.EffectChain	= EffectChain;
audioLib.EffectClass	= EffectClass;
audioLib.BufferEffect	= BufferEffect;
audioLib.codecs		= audioLib.Codec = Codec;

audioLib.version	= '0.4.7';

return audioLib;
}).call(typeof exports === 'undefined' ? {} : this, this.window || global, Math);
