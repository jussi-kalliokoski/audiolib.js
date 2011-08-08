/**
 * Creates a Delay effect.
 *
 * @constructor
 * @this {Delay}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} time (Optional) Delay time (ms).
 * @param {number} feedback (Optional) Feedback (unsigned double).
*/
function Delay(sampleRate, time, feedback){
	var	self	= this;
	self.time	= isNaN(time) ? self.time : time;
	self.feedback	= isNaN(feedback) ? self.feedback : feedback;
	self.reset(sampleRate);
}

Delay.prototype = {
	/** Sample rate on which the Delay operatos on. */
	sampleRate:	1,
	/** Buffer position of the Delay. */
	bufferPos:	0,
	/** AudioBuffer in which the delay line is stored. */
	buffer:		null,
	/** Time between delays, in milliseconds. */
	time:		1000,
	/** Feedback of the Delay */
	feedback:	0,
	/** Current output of the Delay */
	sample:		0,

/**
 * Reverse sample time factor
 *
 * @private
*/
	_rstf:		1,
/**
 * Adds a new sample to the delay line, moving the effect one sample forward in sample time.
 *
 * @param {Float32} sample The sample to be added to the delay line.
 * @return {Float32} Current output of the Delay.
*/
	pushSample: function(s){
		var	self	= this,
			buffer	= self.buffer;
		buffer[self.bufferPos++] += s;
		if (self.bufferPos > self.time * self._rstf){
			self.bufferPos = 0;
		}
		self.sample = buffer[self.bufferPos];
		buffer[self.bufferPos] *= self.feedback;
		return self.sample;
	},
/**
 * Returns the current output of the Delay.
 *
 * @return {Float32} Current output of the Delay.
*/
	getMix: function(){
		return this.sample;
	},
/**
 * Changes the time value of the Delay and resamples the delay line accordingly.
 *
 * @param {Uint} time The new time value for the Delay.
 * @return {AudioBuffer} The new delay line audio buffer.
*/
// Requires Sink
	resample: function(time){
		var	self	= this,
			ratio	= self.time / time;
		self.buffer	= audioLib.Sink.resample(self.buffer, time);
		self.time	= time;
		self.bufferPos	= Math.round(ratio * self.bufferPos);
		return self.buffer;
	},
/**
 * Resets the delay line, to recover from sample rate changes or such.
 *
 * @param {Number} sampleRate The new sample rate. (Optional)
 * @param {Boolean} resample Determines whether to resample and apply the old buffer. (Requires Sink)
 * @return {AudioBuffer} The new delay line audio buffer.
*/
	reset: function(sampleRate, resample){
		var	self	= this,
			buf	= self.buffer,
			i, ratio;
		sampleRate	= isNaN(sampleRate) ? self.sampleRate : sampleRate;
		ratio		= self.sampleRate / sampleRate;
		self.buffer	= new Float32Array(sampleRate * Delay.MAX_DELAY);
		self.bufferPos	= Math.round(ratio * self.bufferPos);
		self._rstf	= 1 / 1000 * sampleRate;
		if (resample){
			buf = audioLib.Sink.resample(buf, ratio);
			for (i=0; i<buf.length && i<self.buffer.length; i++){
				self.buffer[i] = buf[i];
			}
		}
		return self.buffer;
	}
};

/** The size that will be allocated for delay line buffers on initialization, in seconds */
Delay.MAX_DELAY = 2;
