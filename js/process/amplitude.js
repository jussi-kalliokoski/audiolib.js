//#processor Amplitude
/**
 * Creates an amplitude meter, outputting the amplitude value of the input.
 *
 * @constructor
 * @this Limiter
 * @param {Number} sampleRate The sample rate of the amplitude meter.
 * @param {Number} attack The speed on which the amplitude metering reacts.
 * @param {Number} decay The speed on which the amplitude metering cools down.
*/
function Amplitude(sampleRate, attack, decay){
	this.sampleRate		= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.attack		= isNaN(attack) ? this.attack : attack;
	this.decay		= isNaN(decay) ? this.decay : decay;
}

Amplitude.prototype = {
	/** The sample rate of the effect. */
	sampleRate:	44100,
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
		this.sample = Math.abs((s > this.sample ? this.attack : this.release) * (this.sample - s) + s);
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
};
