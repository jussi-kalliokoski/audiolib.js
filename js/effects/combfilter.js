
/**
 * Creates a Comb Filter effect.
 *
 * @constructor
 * @this {CombFilter}
 * @param {number} sampleRate Sample Rate (hz).
 * @param {number} delaySize Size (in samples) of the delay line buffer.
 * @param {number} feedback (Optional) Amount of feedback (0.0-1.0). Defaults to 0.84 (Freeverb default)
 * @param {number} damping (Optional) Amount of damping (0.0-1.0). Defaults to 0.2 (Freeverb default)
*/
function CombFilter(sampleRate, delaySize, feedback, damping){
	var	self	= this,
		sample  = 0.0,
		index	= 0,
		store	= 0;
	self.sampleRate	= sampleRate;
	self.buffer	= new Float32Array(isNaN(delaySize) ? 1200 : delaySize);
	self.bufferSize	= self.buffer.length;
	self.feedback	= isNaN(feedback) ? 0.84 : feedback;
	self.damping	= isNaN(damping) ? 0.2 : damping;

	self.pushSample	= function(s){
		sample	= self.buffer[index];
		store	= sample * (1 - self.damping) + store * self.damping;	// Note: optimizable by storing (1-self.damp) like freeverb (damp2). Would require filter.setDamp(x) rather than filter.damp=x
		self.buffer[index++] = s + store * self.feedback;
		if (index >= self.bufferSize) {
			index = 0;
		}
		return sample;
	};
	
	self.getMix = function(){
		return sample;
	};
	
	self.reset = function(){		
		index	= 0;
		store	= 0;
		sample	= 0.0;
		self.buffer = new Float32Array(self.bufferSize);
	};
}