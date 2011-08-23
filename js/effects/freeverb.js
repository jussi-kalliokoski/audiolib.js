/**
 * Creates a Reverb Effect, based on the Freeverb algorithm
 * 
 * @constructor
 * @this {Freeverb}
 * @param {number} samplerate Sample Rate (hz).
 * @param {boolean} isRightChannel Controls the addition of stereo spread. Defaults to false.
 * @param {Object} tuning (Optional) Freeverb tuning overwrite object
*/
function Freeverb(sampleRate, channelCount, tuning){
	var	self		= this;
	self.sampleRate		= sampleRate;
	self.channelCount	= channelCount || self.channelCount;
	self.tuning		= tuning || this.tuning;
	
	self.sample	= (function(){
		var	sample	= [],
			c;
		for(c=0; c<self.channelCount; c++){
			sample[c] = 0.0;
		}
		return sample;
	}());

	self.CFs	= (function(){
		var 	combs	= [],
			channel	= [],
			num	= self.tuning.numcombs,
			damp	= self.tuning.initialdamp * self.tuning.scaledamp,
			feed	= self.tuning.initialroom * self.tuning.scaleroom + self.tuning.offsetroom,
			sizes	= self.tuning.combs,
			i, c;
		for(c=0; c<self.channelCount; c++){
			for(i=0; i<num; i++){
				channel.push(new audioLib.CombFilter(self.sampleRate, sizes[i] + c * self.tuning.stereospread, feed, damp));
			}
			combs.push(channel);
			channel = [];
			console.log(c * self.tuning.stereospread);
		}
		console.log(self.tuning);
		return combs;
	}());
	self.numCFs	= self.CFs.length;
	
	self.APFs	= (function(){
		var 	apfs	= [],
			channel	= [],
			num	= self.tuning.numallpasses,
			feed	= self.tuning.allpassfb,
			sizes	= self.tuning.allpasses,
			i, c;
		for(c=0; c<self.channelCount; c++){
			for(i=0; i<num; i++){
				channel.push(new Freeverb.AllPassFilter(self.sampleRate, sizes[i] + c * self.tuning.stereospread, feed));
			}
			apfs.push(channel);
			channel = [];
		}
		return apfs;
	}());
	self.numAPFs	= self.APFs.length;
	console.log(self);
}

Freeverb.prototype = {
	channelCount: 	2,
	sample:		[0.0, 0.0],

	wet:		0.5,
	dry:		0.55,

	tuning: {
		numcombs:	8,
		combs:		[1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617],

		numallpasses:	4,
		allpasses:	[556, 441, 341, 225],
		allpassfb:	0.5,

		fixedgain:	0.015,
		scaledamp:	0.4,
		scaleroom:	0.28,
		offsetroom:	0.7,
		initialroom:	0.5,
		initialdamp:	0.5,
		stereospread:	23
	},

	pushSample: function(s, channel){
		var	input	= s * this.tuning.fixedgain,
			output	= 0,
			i;
		for(i=0; i < this.numCFs; i++){
			output += this.CFs[channel][i].pushSample(input);
		}
		for(i=0; i < this.numAPFs; i++){
			output = this.APFs[channel][i].pushSample(output);
		}
		this.sample[channel] = output * this.wet + s * this.dry;
	},

	getMix: function(channel){
		return this.sample[channel];
	},

	reset: function(){
		var	i;		
		for(i=0; i < this.numCFs; i++){
			this.CFs[i].reset();
		}
		for(i=0; i < this.numAPFs; i++){
			this.APFs[i].reset();
		}
		for(i=0; i < this.channelCount; i++){
			this.sample[i] = 0.0;
		}
	}

	
};

/**
 * Creates an All-Pass Filter Effect, based on the Freeverb APF.
 * 
 * @constructor
 * @this {Freeverb.AllPassFilter}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} delaySize Size (in samples) of the delay line buffer.
 * @param {number} feedback (Optional) Amount of feedback (0.0-1.0). Defaults to 0.5 (Freeverb default)
*/
Freeverb.AllPassFilter = function(sampleRate, delaySize, feedback){
	var	self	= this,
		sample  = 0.0,
		index	= 0;
	self.sampleRate	= sampleRate;
	self.buffer	= new Float32Array(isNaN(delaySize) ? 500 : delaySize);
	self.bufferSize	= self.buffer.length;
	self.feedback	= isNaN(feedback) ? 0.5 : feedback;

	self.pushSample	= function(s){
		var bufOut		= self.buffer[index];
		sample			= -s + bufOut;
		self.buffer[index++]	= s + bufOut * self.feedback;
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
		sample	= 0.0;
		self.buffer = new Float32Array(self.bufferSize);
	};
};



