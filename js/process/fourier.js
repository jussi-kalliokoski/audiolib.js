/**
 * Adapted from DSP.js https://github.com/corbanbrook/dsp.js/blob/master/dsp.js
*/

this.FourierTransform = (function(){

var	sin		= Math.sin,
	cos		= Math.cos,
	sqrt		= Math.sqrt,
	floor		= Math.floor,
	pow		= Math.pow,
	log		= Math.log,
	ln2		= Math.ln2,
	pi		= Math.PI,
	tau		= pi * 2;

/**
 * A general purpose FourierTransform class, from which FFT and others inherit from.
 *
 * @param {Number} sampleRate The sample rate of the FFT.
 * @param {Number} bufferSize The buffer size of the FFT. Must be a power of 2.
*/

function FourierTransform(sampleRate, bufferSize){
	var k;
	for (k in FourierTransform.prototype){
		if (FourierTransform.prototype.hasOwnProperty){
			this[k] = FourierTransform.prototype[k];
		}
	}
	AudioProcessingUnit.apply(this, [].slice.call(arguments, 1));
	this.resetFT.apply(this, arguments);
}

FourierTransform.prototype = {
	/** Resets the parameters of the FT */
	resetFT: function(sampleRate){
		var self = this;
		self.sampleRate		= isNaN(sampleRate) ? self.sampleRate : sampleRate;
		self.bandWidth		= 2 / self.bufferSize * self.sampleRate * 0.5;
		self.spectrum		= new Float32Array(self.bufferSize * 0.5);
		self.peakBand		= 0;
		self.peak		= 0;
	},
/**
 * Gets the frequency of a specified band.
 *
 * @param {Number} index The index of the band.
 * @return {Number} The frequency.
*/
	getBandFrequency: function(index){
		return this.bandwidth * index + this.bandWidth * 0.5;
	},
	/** Calculates the spectrum of the FT */
	calculateSpectrum: function(){
		var	self		= this,
			spectrum	= self.spectrum,
			bSi		= 2 / self.bufferSize,
			N		= self.bufferSize / 2,
			rval, ival, mag, i, n;

		for (i=0; i<N; i++){
			n	= i * 2,
			rval	= self.buffer[  i * 2  ];
			ival	= self.buffer[i * 2 + 1];
			mag	= bSi * sqrt(rval * rval + ival * ival);

			if (mag > self.peak){
				self.peakBand	= i;
				self.peak	= mag;
			}

			spectrum[i] = mag;
		}
	}
};

return FourierTransform;
}());
