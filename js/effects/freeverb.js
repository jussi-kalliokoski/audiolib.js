function Freeverb(sampleRate, isRightChannel, tuning){
	var	self	= this,
		sample  = 0.0;
	self.sampleRate	= sampleRate;
	self.tuning 	= tuning || Freeverb.tuning;
	self.spread	= isRightChannel ? self.tuning.stereospread : 0;
	self.gain	= self.tuning.fixedgain;
	self.wet	= 0.6;
	self.dry	= 0.7;
	self.CFs	= (function(tuning){
		var 	combs	= [],
			num	= tuning.numcombs,
			damp	= tuning.initialdamp * tuning.scaledamp,
			feed	= tuning.initial,
			sizes	= tuning.combs,
			i;
		for(i=0; i<num; i++){
			combs.push(new audioLib.CombFilter(self.sampleRate, sizes[i] + self.spread, feed, damp));
		}
		return combs;
	}(self.tuning));
	self.numCFs	= self.CFs.length;
	
	self.APFs	= (function(tuning){
		var 	apfs	= [],
			num	= tuning.numallpasses,
			feed	= 0.5,
			sizes	= tuning.allpasses,
			i;
		for(i=0; i<num; i++){
			apfs.push(new Freeverb.AllPassFilter(self.sampleRate, sizes[i] + self.spread, feed));
		}
		return apfs;
	}(self.tuning));
	self.numAPFs	= self.APFs.length;

	self.pushSample	= function(s){
		var	input	= s * self.gain,
			output	= 0,
			i;
		for(i=0; i < self.numCFs; i++){
			output += self.CFs[i].pushSample(input);
		}
		for(i=0; i < self.numAPFs; i++){
			output = self.APFs[i].pushSample(output);
		}
		sample = output * self.wet + s * self.dry;
		return sample;
	};
	
	self.getMix = function(){
		return sample;
	};
	
	self.reset = function(){
		var	i;		
		for(i=0; i < self.numCFs; i++){
			self.CFs[i].reset();
		}
		for(i=0; i < self.numAPFs; i++){
			self.APFs[i].reset();
		}
		sample	= 0.0;
	};
}

// Tuning from FreeVerb source. Much of this is unused.
Freeverb.tuning = {
	numcombs:	8,
	combs:		[1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617],
	numallpasses:	4,
	allpasses:	[556, 441, 341, 225],
	fixedgain:	0.015,
	scalewet:	3,
	scaledry:	2,
	scaledamp:	0.4,
	scaleroom:	0.28,
	offsetroom:	0.7,
	initialroom:	0.5,
	initialdamp:	0.5,
	initialwet:	1/3,
	initialdry:	0,
	initialwidth:	1,
	initialmode:	0,
	freezemode:	0.5,
	stereospread:	23
};

Freeverb.AllPassFilter = function(sampleRate, bufferSize, feedback){
	var	self	= this,
		sample  = 0.0,
		index	= 0;
	self.sampleRate	= sampleRate;
	self.buffer	= new Float32Array(isNaN(bufferSize) ? 500 : bufferSize);
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



