/**
 * Creates a Gain Controller effect.
 *
 * @effect
 *
 * @arg =!sampleRate
 * @arg =!gain
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:UInt default:1 gain The gain for the gain controller.
*/
function GainController (sampleRate, gain) {
	this.sampleRate	= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.gain	= isNaN(gain) ? this.gain : gain;
}

GainController.prototype = {
	sampleRate:	44100,
	gain:		1,
	/* The current output sample of the gain controller */
	sample:		0,
/**
 * Processes provided sample, moves the gain controller one sample forward in the sample time.
 *
 * @arg {Number} s The input sample for the gain controller.
 * @return {Number} The current output sample of the controller.
*/
	pushSample: function (s) {
		this.sample	= s * this.gain;
		return this.sample;
	},
/**
 * Returns the current output sample of the controller.
 *
 * @return {Number} The current output sample of the controller.
*/
	getMix: function () {
		return this.sample;
	}
};
