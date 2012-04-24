/**
 * Creates a Reverb Effect, based on the Freeverb algorithm
 * 
 * @effect Reverb
 *
 * @arg =!sampleRate
 * @arg =!channelCount
 * @arg =!wet
 * @arg =!dry
 * @arg =!roomSize
 * @arg =!damping
 * @arg {Object} !tuningOverride Freeverb tuning overwrite object.
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:UInt min:1 default:2 channelCount The channel count of the Reverb.
 * @param type:Float default:0.5 wet The gain of the reverb signal output.
 * @param type:Float default:0.55 dry The gain of the original signal output.
 * @param type:Float min:0.0 max:1.0 default:0.5 roomSize The size of the simulated reverb area.
 * @param type:Float min:0.0 max:1.0 default:0.2223 damping Reverberation damping parameter.
*/
function Freeverb (sampleRate, channelCount, wet, dry, roomSize, damping, tuningOverride) {
	var	self		= this;
	self.sampleRate		= sampleRate;
	self.channelCount	= isNaN(channelCount) ? self.channelCount : channelCount;
	self.wet		= isNaN(wet) ? self.wet: wet;
	self.dry		= isNaN(dry) ? self.dry: dry;
	self.roomSize		= isNaN(roomSize) ? self.roomSize: roomSize;
	self.damping		= isNaN(damping) ? self.damping: damping;
	self.tuning		= new Freeverb.Tuning(tuningOverride || self.tuning);
	
	self.sample	= (function () {
		var	sample	= [],
			c;
		for (c=0; c<self.channelCount; c++) {
			sample[c] = 0.0;
		}
		return sample;
	}());

	self.CFs	= (function () {
		var	combs	= [],
			channel	= [],
			num	= self.tuning.combCount,
			damp	= self.damping * self.tuning.scaleDamping,
			feed	= self.roomSize * self.tuning.scaleRoom + self.tuning.offsetRoom,
			sizes	= self.tuning.combTuning,
			i, c;

		for (c=0; c<self.channelCount; c++) {
			for(i=0; i<num; i++) {
				channel.push(new audioLib.CombFilter(self.sampleRate, sizes[i] + c * self.tuning.stereoSpread, feed, damp));
			}

			combs.push(channel);
			channel = [];
		}

		return combs;
	}());

	self.numCFs	= self.CFs[0].length;
	
	self.APFs	= (function () {
		var	apfs	= [],
			channel	= [],
			num	= self.tuning.allPassCount,
			feed	= self.tuning.allPassFeedback,
			sizes	= self.tuning.allPassTuning,
			i, c;

		for (c=0; c<self.channelCount; c++) {
			for (i=0; i<num; i++) {
				channel.push(new Freeverb.AllPassFilter(self.sampleRate, sizes[i] + c * self.tuning.stereoSpread, feed));
			}

			apfs.push(channel);
			channel = [];
		}

		return apfs;
	}());

	self.numAPFs	= self.APFs[0].length;
}

Freeverb.prototype = {
	channelCount:	2,
	sample:		[0.0, 0.0],

	wet:		0.5,
	dry:		0.55,
	damping:	0.2223,
	roomSize:	0.5,

	tuning: {
	},

	pushSample: function (s, channel) {
		var	input	= s * this.tuning.fixedGain,
			output	= 0,
			i;
		for (i=0; i < this.numCFs; i++) {
			output += this.CFs[channel][i].pushSample(input);
		}
		for (i=0; i < this.numAPFs; i++) {
			output = this.APFs[channel][i].pushSample(output);
		}
		this.sample[channel] = output * this.wet + s * this.dry;
	},

	getMix: function (channel) {
		return this.sample[channel];
	},

	reset: function () {
		var	i,
			c;
		for (c=0; c < this.channelCount; c++) {
			for (i=0; i < this.numCFs; i++) {
				this.CFs[c][i].reset();
			}
			for (i=0; i < this.numAPFs; i++) {
				this.APFs[c][i].reset();
			}
			this.sample[c] = 0.0;
		}		
	},

	setParam: function (param, value) {
		var	combFeed,
			combDamp,
			i,
			c;
		switch (param) {
		case 'roomSize':
			this.roomSize	= value;
			combFeed	= this.roomSize * this.tuning.scaleRoom + this.tuning.offsetRoom;
			for (c=0; c < this.channelCount; c++) {
				for (i=0; i < this.numCFs; i++) {
					this.CFs[c][i].setParam('feedback', combFeed);
				}
			}
			break;
		case 'damping':
			this.damping	= value;
			combDamp	= this.damping * this.tuning.scaleDamping;
			for (c=0; c < this.channelCount; c++) {
				for (i=0; i < this.numCFs; i++) {
					this.CFs[c][i].setParam('damping', combDamp);
				}
			}
			break;
		default:
			this[param] = value;
		}
	}

	
};

/**
 * Creates a Freeverb tuning configurement object.
 *
 * @constructor
 * @this {Freeverb.Tuning}
 * @arg {Object} overrides The object containing the values to be overwritten.
*/

Freeverb.Tuning = function FreeverbTuning (overrides) {
	var k;
	if (overrides) {
		for (k in overrides) {
			if (overrides.hasOwnProperty(k)) {
				this[k] = overrides[k];
			}
		}
	}
};

Freeverb.Tuning.prototype = {
	combCount:		8,
	combTuning:		[1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617],

	allPassCount:		4,
	allPassTuning:		[556, 441, 341, 225],
	allPassFeedback:	0.5,

	fixedGain:		0.015,
	scaleDamping:		0.9,

	scaleRoom:		0.28,
	offsetRoom:		0.7,
	
	stereoSpread:		23
};

/**
 * Creates an All-Pass Filter Effect, based on the Freeverb APF.
 * 
 * @name AllPassFilter
 * @subeffect Freeverb FreeverbAllPassFilter
 *
 * @arg =!sampleRate
 * @arg {number} default:500 !delaySize Size (in samples) of the delay line buffer.
 * @arg =!feedback
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:Float min:0.0 max:1.0 default:0.5 feedback Amount of feedback.
*/
Freeverb.AllPassFilter = function AllPassFilter (sampleRate, delaySize, feedback) {
	var	self	= this;
	self.sampleRate	= sampleRate;
	self.buffer	= new Float32Array(isNaN(delaySize) ? 500 : delaySize);
	self.bufferSize	= self.buffer.length;
	self.feedback	= isNaN(feedback) ? self.feedback : feedback;
};

Freeverb.AllPassFilter.prototype = {
	sample:		0.0,
	index:		0,
	feedback:	0.5,

	pushSample: function (s) {
		var	self		= this;
			bufOut		= self.buffer[self.index];
		self.sample		= -s + bufOut;
		self.buffer[self.index++] = s + bufOut * self.feedback;
		if (self.index >= self.bufferSize) {
			self.index = 0;
		}
		return self.sample;
	},
	getMix: function () {
		return this.sample;
	},
	reset: function () {
		this.index	= 0;
		this.sample	= 0.0;
		this.buffer	= new Float32Array(this.bufferSize);
	}
};
