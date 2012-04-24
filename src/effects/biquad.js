/**
 * A Custom Biquad Filter Effect
 * http://en.wikipedia.org/wiki/Digital_biquad_filter
 * Adapted from http://www.musicdsp.org/files/Audio-EQ-Cookbook.txt
 * 
 * @effect
 *
 * @arg =sampleRate
 * @arg =b0
 * @arg =b1
 * @arg =b2
 * @arg =a1
 * @arg =a2
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param {number} b0 Biquadratic difference equation parameter
 * @param {number} b1 Biquadratic difference equation parameter
 * @param {number} b2 Biquadratic difference equation parameter
 * @param {number} a1 Biquadratic difference equation parameter
 * @param {number} a2 Biquadratic difference equation parameter
*/
function BiquadFilter (sampleRate, b0, b1, b2, a1, a2) {
	this.reset.apply(this, arguments);
}

/**
 * A generic Biquad Filter class, used internally to create BiquadFilter classes.
 * @constructor
 * @this BiquadFilterClass
*/
BiquadFilter.BiquadFilterClass = function BiquadFilterClass () {
	var k;
	for (k in BiquadFilterClass.prototype) {
		if (BiquadFilterClass.prototype.hasOwnProperty) {
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

	pushSample: function (s) {
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
	getMix: function () {
		return this.sample;
	},
	reset: function (sampleRate, b0, b1, b2, a1, a2) {
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
 * @name LowPass
 * @subeffect BiquadFilter BiquadLowPassFilter
 *
 * @arg =sampleRate
 * @arg =cutoff
 * @arg =Q
 *
 * @param type:UInt units:Hz sampleRate Sample Rate the apparatus operates on.
 * @param type:Float units:Hz cutoff Low-pass cutoff frequency.
 * @param type:Float min:0.0 max:1.0 Q Filter Q-factor (Q<0.5 filter underdamped, Q>0.5 filter overdamped)
*/
BiquadFilter.LowPass = function (sampleRate, cutoff, Q) {
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
 * @name HighPass
 * @subeffect BiquadFilter BiquadHighPassFilter
 *
 * @arg =sampleRate
 * @arg =cutoff
 * @arg =Q
 *
 * @param type:UInt units:Hz sampleRate Sample Rate the apparatus operates on.
 * @param type:Float units:Hz cutoff High-pass cutoff frequency.
 * @param type:Float min:0.0 max:1.0 Q Filter Q-factor (Q<0.5 filter underdamped, Q>0.5 filter overdamped)
*/
BiquadFilter.HighPass = function (sampleRate, cutoff, Q) {
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
 * @name AllPass
 * @subeffect BiquadFilter BiquadAllPassFilter
 *
 * @arg =sampleRate
 * @arg =f0
 * @arg =Q
 *
 * @param type:UInt units:Hz sampleRate Sample Rate the apparatus operates on.
 * @param type:Float units:Hz min:0.0 f0 Significant frequency: filter will cause a phase shift of 180deg at f0.
 * @param type:Float min:0.0 max:1.0 Q Filter Q-factor (Q<0.5 filter underdamped, Q>0.5 filter overdamped)
*/
BiquadFilter.AllPass = function (sampleRate, f0, Q) {
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
 * @name BandPass
 * @subeffect BiquadFilter BiquadBandPassFilter
 *
 * @arg =sampleRate
 * @arg =centerFreq
 * @arg =bandwidthInOctaves
 *
 * @param type:UInt units:Hz sampleRate Sample Rate the apparatus operates on.
 * @param type:Float units:Hz min:0.0 centerFreq Center frequency of filter: 0dB gain at center peak
 * @param type:Float units:octaves min:0 bandwidthInOctaves Bandwidth of the filter (between -3dB points).
*/
BiquadFilter.BandPass = function (sampleRate, centerFreq, bandwidthInOctaves) {
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

(function (classes, i) {

for (i=0; i<classes.length; i++) {
	classes[i].prototype = new BiquadFilter.BiquadFilterClass();
}

}([BiquadFilter, BiquadFilter.LowPass, BiquadFilter.HighPass, BiquadFilter.AllPass, BiquadFilter.BandPass]));
