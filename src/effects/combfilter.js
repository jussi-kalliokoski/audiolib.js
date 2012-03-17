/**
 * Creates a Comb Filter effect.
 * Defaults to Freeverb defaults.
 *
 * @effect
 *
 * @arg =!sampleRate
 * @arg =!delaySize
 * @arg =!feedback
 * @arg =!damping
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:UInt units:samples default:1200 delaySize Size of the delay line buffer.
 * @param type:Float min:0.0 max:0.0 default:0.84 feedback Amount of feedback for the CombFilter.
 * @param type:Float min:0.0 max:0.0 default:0.2 damping Amount of damping for the CombFilter.
*/
function CombFilter (sampleRate, delaySize, feedback, damping) {
	var	self	= this;
	self.sampleRate	= sampleRate;
	self.buffer	= new Float32Array(isNaN(delaySize) ? 1200 : delaySize);
	self.bufferSize	= self.buffer.length;
	self.feedback	= isNaN(feedback) ? self.feedback : feedback;
	self.damping	= isNaN(damping) ? self.damping : damping;
	self.invDamping	= 1 - self.damping;
}

CombFilter.prototype = {
	sample:		0.0,
	index:		0,
	store:		0,

	feedback:	0.84,
	damping:	0.2,

	pushSample: function (s) {
		var	self	= this;
		self.sample	= self.buffer[self.index];
		self.store	= self.sample * self.invDamping + self.store * self.damping;
		self.buffer[self.index++] = s + self.store * self.feedback;
		if (self.index >= self.bufferSize) {
			self.index = 0;
		}
		return self.sample;
	},
	getMix: function () {
		return this.sample;
	},
	reset: function () {
		this.index	= this.store = 0;
		this.samples	= 0.0;
		this.buffer	= new Float32Array(this.bufferSize);
	},
	setParam: function (param, value) {
		switch (param) {
		case 'damping':
			this.damping	= value;
			this.invDamping	= 1 - value;
			break;
		default:
			this[param] = value;
			break;
		}
	}
};
