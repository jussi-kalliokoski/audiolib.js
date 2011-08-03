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
		self.real		= new Float32Array(self.bufferSize);
		self.imag		= new Float32Array(self.bufferSize);
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
			imag		= self.imag,
			bSi		= 2 / self.bufferSize,
			N		= self.bufferSize / 2,
			rval, ival, mag, i;

		for (i=0; i<N; i++){
			rval	= self.real[i];
			ival	= self.imag[i];
			mag	= bSi * sqrt(rval * rval + ival * ival);

			if (mag > self.peak){
				self.peakBand	= i;
				self.peak	= mag;
			}

			spectrum[i] = mag;
		}
	}
};

/**
 * A Fast Fourier Transform processor class.
 *
 * @constructor
 * @this {FFT}
 * @param {Number} sampleRate The sample rate of the FFT.
 * @param {Number} bufferSize The buffer size of the FFT. Must be a power of 2.
*/

function FFT(sampleRate, bufferSize){
	FourierTransform.apply(this, arguments);
	this.reset();
}

FFT.prototype = {
	sampleRate:	44100,
	bufferSize:	2048,
	method:		'forward',
	/** Resets the FFT */
	reset: function(){
		this.resetBuffer.apply(this, arguments);
		this.resetFT.apply(this, arguments);

		this.reverseTable = new Uint32Array(this.bufferSize);

		var	limit	= 1,
			bit	= this.bufferSize >> 1,
			i;

		while (limit < this.bufferSize){
			for (i=0; i<limit; i++){
				this.reverseTable[i + limit] = this.reverseTable[i] + bit;
			}

			limit	= limit << 1;
			bit	= bit >> 1;
		}
	},
/**
 * Performs a FFT on the specified buffer.
 *
 * @param {Float32Array} buffer The buffer to perform the operation on. (Optional)
*/
	forward: function(buffer){
		var	self			= this,
			bufferSize		= self.bufferSize,
			reverseTable		= self.reverseTable,
			real			= self.real,
			imag			= self.imag,
			spectrum		= self.spectrum,
			k			= floor(log(bufferSize) / ln2),
			halfSize		= 1,
			phaseShiftStepReal,
			phaseShiftStepImag,
			currentPhaseShiftReal,
			currentPhaseShiftImag,
			off, tr, ti, tmpReal, i, hsrad, fftStep, size;

		for (i=0; i<bufferSize; i++){
			real[i]	= buffer[reverseTable[i]];
			imag[i]	= 0;
		}

		while (halfSize < bufferSize){
			hsrad			= -Math.PI / halfSize;
			phaseShiftStepReal	= cos(hsrad);
			phaseShiftStepImag	= sin(hsrad);

			currentPhaseShiftReal	= 1;
			currentPhaseShiftImag	= 0;

			size = halfSize * 2;

			for (fftStep = 0; fftStep < halfSize; fftStep++){
				i = fftStep;
				while (i < bufferSize){
					off	= i + halfSize;
					tr	= currentPhaseShiftReal * real[off] + currentPhaseShiftImag * imag[off];
					ti	= currentPhaseShiftReal * imag[off] + currentPhaseShiftImag * real[off];

					real[off]	= real[i] - tr;
					imag[off]	= imag[i] - ti;
					real[i]		+= tr;
					imag[i]		+= ti;

					i += size;
				}

				tmpReal			= currentPhaseShiftReal;
				currentPhaseShiftReal	= tmpReal * phaseShiftStepReal - currentPhaseShiftImag * phaseShiftStepImag;
				currentPhaseShiftImag	= tmpReal * phaseShiftStepImag - currentPhaseShiftImag * phaseShiftStepReal;
			}

			halfSize = size;
		}

		return this.calculateSpectrum();
	},
/**
 * Performs an inverse FFT operation on the specified buffer.
 *
 * @param {Float32Array} real The real buffer to perform the operation on. (Optional)
 * @param {Float32Array} imag The imaginary buffer to perform the operation on. (Optional)
*/
	inverse: function(real, imag){
		var	self			= this,
			bufferSize		= self.bufferSize,
			reverseTable		= self.reverseTable,
			spectrum		= self.spectrum,
			halfSize		= 1,
			revReal			= new Float32Array(bufferSize),
			revImg			= new Float32Array(bufferSize),
			phaseShiftStepReal,
			phaseShiftStepImag,
			currentPhaseShiftReal,
			currentPhaseShiftImag,
			off, tr, ti, tmpReal, i, hsrad, fftStep, size;

		real	= real || self.real;
		imag	= imag || self.imag;

		for (i=0; i<bufferSize; i++){
			imag[i] *= -1;
		}

		for (i=0; i<real.length; i++){
			revReal[i] = real[reverseTable[i]];
			revImag[i] = imag[reverseTable[i]];
		}

		real	= revReal;
		imag	= revImag;

		while (halfSize < bufferSize){
			hsrad			= -Math.PI / halfSize;
			phaseShiftStepReal	= cos(hsrad);
			phaseShiftStepImag	= sin(hsrad);

			currentPhaseShiftReal	= 1;
			currentPhaseShiftImag	= 0;

			size = halfSize * 2;
			
			for (fftStep = 0; fftStep < halfSize; fftStep++){
				i = fftStep;
				while (i < bufferSize){
					off	= i + halfSize;
					tr	= currentPhaseShiftReal * real[off] + currentPhaseShiftImag * imag[off];
					ti	= currentPhaseShiftReal * imag[off] + currentPhaseShiftImag * real[off];

					real[off]	= real[i] - tr;
					imag[off]	= imag[i] - ti;
					real[i]		+= tr;
					imag[i]		+= ti;

					i += size;
				}

				tmpReal			= currentPhaseShiftReal;
				currentPhaseShiftReal	= tmpReal * phaseShiftStepReal - currentPhaseShiftImag * phaseShiftStepImag;
				currentPhaseShiftImag	= tmpReal * phaseShiftStepImag - currentPhaseShiftImag * phaseShiftStepReal;

			}
			halfSize = size;
		}

		return this.calculateSpectrum();
	},
	process: function(buffer){
		this[this.method](buffer || this.buffer);
	}
};

FourierTransform.FFT	= FFT;

return FourierTransform;
}());
