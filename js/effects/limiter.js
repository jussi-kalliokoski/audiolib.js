/**
 * Creates a dynamic amplitude limiter.
 *
 * Requires Amplitude.
 *
 * @constructor
 * @this Limiter
 * @param {Number} sampleRate The sample rate of the limiter.
 * @param {Number} threshold The amplitude threshold after which to start limiting.
 * @param {Number} attack The speed on which the amplitude metering reacts.
 * @param {Number} decay The speed on which the amplitude metering cools down.
*/
function Limiter(sampleRate, threshold, attack, decay){
	this.sampleRate		= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.threshold		= isNaN(threshold) ? this.threshold : threshold;
	this.attack		= isNaN(attack) ? this.attack : attack;
	this.decay		= isNaN(decay) ? this.decay : decay;
	this._amplitude		= new audioLib.Amplitude(this.sampleRate, this.attack, this.decay);
}

Limiter.prototype = {
	/** The sample rate of the effect. */
	sampleRate:	44100,
	/** The Amplitude meter on which the limiting is based. */
	__amplitude:	null,
	/** The amplitude threshold after which to start limiting. */
	threshold:	0.95,
	/** The speed on which the amplitude metering reacts. */
	attack:		0.01,
	/** The speed on which the amplitude metering cools down. */
	release:	0.01,
	/** The current output of the effect. */
	sample:		0,
/**
 * Processes a sample, moving the effect one sample further in sample-time.
 *
 * @param {Float32} sample The sample to process.
 * @param {Uint} channel The channel on which the sample is. (Only if multi-channel)
 * @return {Float32} The current output of the effect. (Only if single-channel)
*/
	pushSample: function(s){
		var	d	= this._amplitude.pushSample(s) - this.threshold;
		this.sample	= d > 0 ? s / (1 + d) : s;
		return this.sample;
	},
/**
 * Returns the current output of the effect.
 *
 * @param {Uint} channel The channel for which to get the sample.
 * @return {Float32} The current output of the effect.
*/
	getMix: function(){
		return this.sample;
	},
/**
 * Sets a parameter of the effect, making necessary relative calculations.
 *
 * @param {String} param The parameter name.
 * @param {Object} value The new value of the parameter.
*/
	setParam: function(param, value){
		switch(param){
		case 'attack':
		case 'release':
			this._amplitude[param] = value;
			break;
		default:
			this[param] = value;
		}
	}
};
