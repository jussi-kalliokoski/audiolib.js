/**
 * Creates a new Sampler.
 *
 * @constructor
 * @this {Sampler}
 * @param {Number} sampleRate The samplerate to operate the Sampler on.
 * @param {Number} pitch The pitch of the Sampler. (Optional)
*/
function Sampler(sampleRate, pitch){
	var	self	= this;
	self.voices	= [];
	self.sampleRate	= sampleRate;
	self.pitch	= isNaN(pitch) ? 440 : self.pitch;
}

Sampler.prototype = {
	/** The sample rate the Sampler operates on. */
	sampleRate:	1,
	/** The relative pitch used to compare noteOn pitches to and adjust playback speed. */
	pitch:		440,
	/** Time in seconds to start the playback of the sample from. */
	delayStart:	0,
	/** Time in seconds to end the playback of the sample before the end of the sample. */
	delayEnd:	0,
	/** The maximum amount of voices allowed to be played simultaneously. */
	maxVoices:	1 / 0,
	/** The length of a single channel of the sample loaded into Sampler, in samples. */
	sampleSize:	0,
	/** An array containing information of all the voices playing currently. */
	voices:		null,
	/** The AudioBuffer representation of the sample used by the sampler. */
	sample:		null,
	/** An array containing the sample, resampled and split by channels as AudioBuffers. */
	samples:	null,
	/** An AudioData object representation of the sample used by the sampler. */
	data:		null,
/**
 * Adds a new voice to the sampler and disbands voices that go past the maxVoices limit.
 *
 * @param {Number} frequency Determines the frequency the voice should be played at, relative to the Sampler's pitch. (Optional)
 * @param {Number} velocity The relative volume of the voice. (Optional)
 * @return {Voice} The voice object created.
*/
	noteOn: function(frequency, velocity){
		frequency	= isNaN(frequency) ? this.pitch : frequency;
		var	self	= this,
			speed	= frequency / self.pitch,
			rate	= self.sampleRate,
			start	= rate * self.delayStart,
			end	= self.sampleSize - rate * self.delayEnd - 1,
			note	= {
				f:	frequency,
				p:	start,
				s:	speed,
				l:	end,
				v:	isNaN(velocity) ? 1 : velocity
			};
		self.voices.push(note);
		while (self.voices.length > self.maxVoices){
			end = self.voices.shift();
			end.onend && end.onend();
		}
		return note;
	},
/**
 * Moves all the voices one sample position further and disbands the voices that have ended.
*/
	generate: function(){
		var	voices = this.voices,
			i, voice;
		for (i=0; i<voices.length; i++){
			voice = voices[i];
			voice.p += voice.s;
			voice.p > voice.l && voices.splice(i--, 1) && voice.onend && voice.onend();
		}
	},
/**
 * Returns the mix of the voices, by a specific channel.
 *
 * @param {Int} channel The number of the channel to be returned. (Optional)
 * @return {Float32} The current output of the Sampler's channel number channel.
*/
	getMix: function(ch){
		var	voices	= this.voices,
			smpl	= 0,
			i;
		ch = ch || 0;
		if (this.samples[ch]){
			for (i=0; i<voices.length; i++){
				smpl	+= Sampler.interpolate(this.samples[ch], voices[i].p) * voices[i].v;
			}
		}
		return smpl;
	},
/**
 * Load an AudioData object to the sampler and resample if needed.
 *
 * @param {AudioData} data The AudioData object representation of the sample to be loaded.
 * @param {Boolean} resample Determines whether to resample the sample to match the sample rate of the Sampler.
*/
	load: function(data, resample){
		var	self	= this,
			samples	= self.samples = Sampler.deinterleave(data.data, data.channelCount),
			i;
		if (resample){
			for (i=0; i<samples.length; i++){
				samples[i] = Sampler.resample(samples[i], data.sampleRate, self.sampleRate);
			}
		}
		self.sample	= data.data;
		self.samples	= samples;
		self.data	= data;
		self.sampleSize = samples[0].length;
	}
};

(function(){

/**
 * If method is supplied, adds a new interpolation method to Sampler.interpolation, otherwise sets the default interpolation method (Sampler.interpolate) to the specified property of Sampler.interpolate.
 *
 * @param {String} name The name of the interpolation method to get / set.
 * @param {Function} method The interpolation method. (Optional)
*/

function interpolation(name, method){
	if (name && method){
		interpolation[name] = method;
	} else if (name && interpolation[name] instanceof Function){
		Sampler.interpolate = interpolation[name];
	}
	return interpolation[name];
}

Sampler.interpolation = interpolation;


/**
 * Interpolates a fractal part position in an array to a sample. (Linear interpolation)
 *
 * @param {Array} arr The sample buffer.
 * @param {number} pos The position to interpolate from.
 * @return {Float32} The interpolated sample.
*/
interpolation('linear', function(arr, pos){
	var	first	= Math.floor(pos),
		second	= first + 1,
		frac	= pos - first;
	second		= second < arr.length ? second : 0;
	return arr[first] * (1 - frac) + arr[second] * frac;
});

/**
 * Interpolates a fractal part position in an array to a sample. (Nearest neighbour interpolation)
 *
 * @param {Array} arr The sample buffer.
 * @param {number} pos The position to interpolate from.
 * @return {Float32} The interpolated sample.
*/
interpolation('nearest', function(arr, pos){
	return pos >= arr.length - 0.5 ? arr[0] : arr[Math.round(pos)];
});

interpolation('linear');

}());


/**
 * Resamples a sample buffer from a frequency to a frequency and / or from a sample rate to a sample rate.
 *
 * @param {Float32Array} buffer The sample buffer to resample.
 * @param {number} fromRate The original sample rate of the buffer, or if the last argument, the speed ratio to convert with.
 * @param {number} fromFrequency The original frequency of the buffer, or if the last argument, used as toRate and the secondary comparison will not be made.
 * @param {number} toRate The sample rate of the created buffer.
 * @param {number} toFrequency The frequency of the created buffer.
*/
Sampler.resample	= function(buffer, fromRate /* or speed */, fromFrequency /* or toRate */, toRate, toFrequency){
	var
		argc		= arguments.length,
		speed		= argc === 2 ? fromRate : argc === 3 ? toRate / fromFrequency : toRate / fromRate * toFrequency / fromFrequency,
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

Sampler.deinterleave = function(buffer, channelCount){
	var	l	= buffer.length,
		size	= l / channelCount,
		ret	= [],
		i, n;
	for (i=0; i<channelCount; i++){
		ret[i] = new Float32Array(size);
		for (n=0; n<size; n++){
			ret[i][n] = buffer[n * channelCount + i];
		}
	}
	return ret;
};

/**
 * Joins an array of sample buffers in a single buffer.
 *
 * @param {Array} buffers The buffers to join.
*/

Sampler.interleave = function(buffers){
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

/**
 * Mixes two or more buffers down to one.
 *
 * @param {Array} buffer The buffer to append the others to.
 * @param {Array} bufferX The buffers to append from.
*/

Sampler.mix = function(buffer){
	var	buffers	= [].slice.call(arguments, 1),
		l, i, c;
	for (c=0; c<buffers.length; c++){
		l = Math.max(buffer.length, buffers[c].length);
		for (i=0; i<l; i++){
			buffer[i] += buffers[c][i];
		}
	}
	return buffer;
};
