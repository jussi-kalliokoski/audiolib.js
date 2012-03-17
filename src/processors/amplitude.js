/**
 * Creates an amplitude meter, outputting the amplitude value of the input.
 *
 * @processor
 *
 * @arg =!sampleRate
 * @arg =!attack
 * @arg =!decay
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:Float min:0.0 max:1.0 default:0.01 attack The speed on which the amplitude metering reacts.
 * @param type:Float min:0.0 max:1.0 default:0.01 decay The speed on which the amplitude metering cools down.
*/
function Amplitude (sampleRate, attack, decay) {
	this.sampleRate		= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.attack		= isNaN(attack) ? this.attack : attack;
	this.decay		= isNaN(decay) ? this.decay : decay;
}

Amplitude.prototype = {
	sampleRate:	44100,
	attack:		0.01,
	release:	0.01,
	/* The current output of the effect. */
	sample:		0,
/**
 * Processes a sample, moving the effect one sample further in sample-time.
 *
 * @arg {Float} sample The sample to process.
 * @arg {UInt} channel The channel on which the sample is. (Only if multi-channel)
 * @return {Float} The current output of the effect. (Only if single-channel)
*/
	pushSample: function (s) {
		this.sample = Math.abs((s > this.sample ? this.attack : this.release) * (this.sample - s) + s);
		return this.sample;
	},
/**
 * Returns the current output of the effect.
 *
 * @arg {UInt} channel The channel for which to get the sample.
 * @return {Float} The current output of the effect.
*/
	getMix: function () {
		return this.sample;
	}
};
