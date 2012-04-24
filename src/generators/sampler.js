/**
 * Creates a new Sampler.
 *
 * @generator
 *
 * @arg =!sampleRate
 * @arg =!pitch
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:Float units:Hz default:440 pitch The pitch of the Sampler.
 * @param type:Float units:s default:0 min:0 delayStart The time offset where to start playing of the sample from.
 * @param type:float units:s default:0 min:0 delayEnd The time offset from the ending of the sample where to stop playback at.
 * @param type:UInt default:Infinity maxVoices The maximum amount of voices allowed to be played simultaneously.
*/

function Sampler (sampleRate, pitch) {
	var	self	= this;
	self.voices	= [];
	self.sampleRate	= sampleRate;
	self.pitch	= isNaN(pitch) ? 440 : self.pitch;
}

Sampler.prototype = {
	sampleRate:	44100,
	pitch:		440,
	delayStart:	0,
	delayEnd:	0,
	maxVoices:	1 / 0,
	/* The length of a single channel of the sample loaded into Sampler, in samples. */
	sampleSize:	0,
	/* An array containing information of all the voices playing currently. */
	voices:		null,
	/* The AudioBuffer representation of the sample used by the sampler. */
	sample:		null,
	/* An array containing the sample, resampled and split by channels as AudioBuffers. */
	samples:	null,
	/* An AudioData object representation of the sample used by the sampler. */
	data:		null,
/**
 * Adds a new voice to the sampler and disbands voices that go past the maxVoices limit.
 *
 * @method Sampler
 *
 * @arg {Float} min:0.0 !frequency Determines the frequency the voice should be played at, relative to the Sampler's pitch.
 * @arg {Float} default:1.0 !velocity The relative volume of the voice.
 * @return {Voice} The voice object created.
*/
	noteOn: function (frequency, velocity) {
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
		while (self.voices.length > self.maxVoices) {
			end = self.voices.shift();
			if (end.onend) end.onend();
		}
		return note;
	},
/**
 * Moves all the voices one sample position further and disbands the voices that have ended.
*/
	generate: function () {
		var	voices = this.voices,
			i, voice;
		for (i=0; i<voices.length; i++) {
			voice = voices[i];
			voice.p += voice.s;

			if (voice.p > voice.l && voices.splice(i--, 1) && voice.onend) {
				voice.onend();
			}
		}
	},
/**
 * Returns the mix of the voices, by a specific channel.
 *
 * @arg {Int} channel The number of the channel to be returned. (Optional)
 * @return {Float32} The current output of the Sampler's channel number channel.
*/
	getMix: function (ch) {
		var	voices	= this.voices,
			smpl	= 0,
			i;
		ch = ch || 0;
		if (this.samples[ch]) {
			for (i=0; i<voices.length; i++) {
				smpl	+= audioLib.Sink.interpolate(this.samples[ch], voices[i].p) * voices[i].v;
			}
		}
		return smpl;
	},
/**
 * Load an AudioData object to the sampler and resample if needed.
 *
 * @method Sampler
 *
 * @arg {AudioData} data The AudioData object representation of the sample to be loaded.
 * @arg {Boolean} !resample Determines whether to resample the sample to match the sample rate of the Sampler.
*/
	load: function (data, resample) {
		var	self	= this,
			samples	= self.samples = audioLib.Sink.deinterleave(data.data, data.channelCount),
			i;
		if (resample) {
			for (i=0; i<samples.length; i++) {
				samples[i] = audioLib.Sink.resample(samples[i], data.sampleRate, self.sampleRate);
			}
		}
		self.sample	= data.data;
		self.samples	= samples;
		self.data	= data;
		self.sampleSize = samples[0].length;
	}
};
