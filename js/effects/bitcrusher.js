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
