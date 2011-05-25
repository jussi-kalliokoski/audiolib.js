function Sampler(sampleRate, sample, pitch){
	var	self	= this,
		smpl;
	self.sampleRate	= sampleRate;
	self.sample	= sample;
	self.pitch	= pitch || 440;
	self.noteOn	= self.resample = function(frequency, sampleRate){
		var	self	= this,
			sample	= self.sample,
			newSample,
			length,
			speed,
			i, n;
		sampleRate	= sampleRate || self.sampleRate;
		speed		= self.sampleRate / sampleRate * self.frequency / pitch;
		length		= Math.ceil(sample.length / speed);
		newSample	= new Float32Array(length);
		for (i=0, n=0; i<sample.length; i += speed){
			newSample[n++] = Sampler.interpolate(sample, i);
		}
		self.device && self.device.writeBuffer(newSample);
		return newSample;
	};
	self.autoPlay	= function(device){
		self.device	= device;
	}
}

Sampler.interpolate = function(arr, pos){
	var	first	= Math.floor(pos),
		second	= first + 1,
		frac	= pos - first;
	 second		= second < arr.length ? second : 0;
	return arr[first] * (1 - frac) + arr[second] * frac;
};
