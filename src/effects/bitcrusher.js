/**
 * Creates a Bit Crusher Effect.
 * Adapted from http://www.musicdsp.org/archive.php?classid=4#139
 * 
 * @effect
 *
 * @arg =!sampleRate
 * @arg =!bits
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:UInt units:bits default:8 bits Bit resolution of output signal.
*/
function BitCrusher (sampleRate, bits) {
	var	self	= this,
		sample  = 0.0;

	self.sampleRate	= sampleRate;
	self.resolution	= bits ? Math.pow(2, bits-1) : Math.pow(2, 8-1); // Divided by 2 for signed samples (8bit range = 7bit signed)

	self.pushSample	= function (s) {
		sample	= Math.floor(s * self.resolution + 0.5) / self.resolution;
		return sample;
	};

	self.getMix = function () {
		return sample;
	};
}
