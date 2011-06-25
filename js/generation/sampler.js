function Sampler(sampleRate, pitch){
	var	self	= this,
		voices	= [],
		smpl;
	self.sampleRate	= sampleRate;
	self.pitch	= pitch || 440;
	self.delayStart	= 0;
	self.delayEnd	= 0;
	self.maxVoices	= 0;
	self.noteOn	= function(frequency){
		frequency	= frequency || self.pitch;
		var	speed	= frequency / self.pitch,
			rate	= self.sampleRate,
			start	= rate * self.delayStart,
			end	= self.sample.length - rate * self.delayEnd,
			note	= {
			f:	frequency,
			p:	start,
			s:	speed,
			l:	end
		};
		voices.push(note);
		return note;
	};
	self.generate	= function(){
		var	i, voice;
		for (i=0; i<voices.length; i++){
			voice = voices[i];
			voice.p += voice.s;
			voice.p > voice.l && voices.splice(i--, 1) && voice.onend && voice.onend();
		}
	};
	self.getMix	= function(ch){
		var	smpl	= 0,
			i;
		ch = ch || 0;
		for (i=0; i<voices.length; i++){
			smpl	+= Sampler.interpolate(self.samples[ch], voices[i].p);
		}
		return smpl;
	};
	self.load	= function(data, resample){
		var	samples = self.samples = Sampler.splitChannels(data.data, data.channelCount),
			i;
		if (resample){
			for (i=0; i<samples.length; i++){
				samples[i] = Sampler.resample(samples[i], data.sampleRate, 1, self.sampleRate, 1);
			}
		}
		self.sample	= data.data;
		self.samples	= samples;
	};
}

/**
 * Interpolates a fractal part position in an array to a sample. (Linear interpolation)
 *
 * @param {Array} arr The sample buffer.
 * @param {number} pos The position to interpolate from.
 * @return {Float32} The interpolated sample.
*/
Sampler.interpolate	= function(arr, pos){
	var	first	= Math.floor(pos),
		second	= first + 1,
		frac	= pos - first;
	 second		= second < arr.length ? second : 0;
	return arr[first] * (1 - frac) + arr[second] * frac;
};

/**
 * Resamples a sample buffer from a frequency to a frequency and / or from a sample rate to a sample rate.
 *
 * @param {Float32Array} buffer The sample buffer to resample.
 * @param {number} fromRate The original sample rate of the buffer.
 * @param {number} fromFrequency The original frequency of the buffer.
 * @param {number} toRate The sample rate of the created buffer.
 * @param {number} toFrequency The frequency of the created buffer.
*/
Sampler.resample	= function(buffer, fromRate, fromFrequency, toRate, toFrequency){
	var
		speed		= toRate / fromRate * toFrequency / fromFrequency,
		l		= buffer.length,
		length		= Math.ceil(l / speed),
		newBuffer	= new Float32Array(length),
		i, n;
	for (i=0, n=0; i<l; i += speed){
		newBuffer[n++] = Sampler.interpolate(buffer, i);
	}
	return newBuffer;
};

/**
 * Splits a sample buffer into those of different channels.
 *
 * @param {Float32Array} buffer The sample buffer to split.
 * @param {number} channelCount The number of channels to split to.
 * @return {Array} An array containing the resulting sample buffers.
*/

Sampler.splitChannels	= function(buffer, channelCount){
	var	l	= buffer.length,
		size	= l / channelCount,
		ret	= [],
		i, n;
	for (i=0; i<channelCount; i++){
		ret[i] = new Float32Array(size);
		for (n=0; n<size; n++){
			ret[i][n] = buffer[i * channelCount + n];
		}
	}
	return ret;
};

/**
 * Joins an array of sample buffers in a single buffer.
 *
 * @param {Array} buffers The buffers to join.
*/

Sampler.joinChannels	= function(buffers){
	var	channelCount	= buffers.length,
		l		= buffers[0].length,
		buffer		= new Float32Array(l * channelCount),
		i, n;
	for (i=0; i<channelCount; i++){
		for (n=0; n<l; n++){
			buffer[i + n * channelCount] = buffers[i][n];
		}
	}
	return buffer;
};
