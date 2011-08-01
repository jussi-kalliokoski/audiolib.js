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
