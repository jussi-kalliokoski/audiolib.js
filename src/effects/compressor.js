/**
 * Creates a Compressor Effect
 * 
 * @effect
 *
 * @arg =!sampleRate
 * @arg =!scaleBy
 * @arg =!gain
 * 
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:UInt min:1 scaleBy Signal scaling factor. If mixing n unscaled waveforms, use scaleBy=n.
 * @param type:Float min:0.0 max:2.0 default:0.5 gain Gain factor.
*/
function Compressor (sampleRate, scaleBy, gain) {
	var	self	= this,
		sample  = 0.0;
	self.sampleRate	= sampleRate;
	self.scale	= scaleBy || 1;
	self.gain	= isNaN(gain) ? 0.5 : gain;
	self.pushSample = function (s) {
		s	/= self.scale;
		sample	= (1 + self.gain) * s - self.gain * s * s * s;
		return sample;
	};
	self.getMix = function () {
		return sample;
	};
}
