(function(proto){

proto.resetFFT = proto.reset;

proto.reset = function(sampleRate, bufferSize){
	audioLib.FourierTransform.apply(this, arguments);
	this.resetBuffer.apply(this, [].slice.call(arguments, 1));
	this.resetFT.apply(this, arguments);
	this.resetFFT.apply(this, [].slice.call(arguments, 1));
};

proto.process = function(buffer){
	this[this.method](buffer || this.buffer);
	return this.calculateSpectrum();
};

proto.sampleRate	= 44100;
proto.method		= 'forward';

}(FFT.prototype));

/**
 * A Fast Fourier Transform module.
 *
 * @name FFT
 * @processor
 *
 * @arg =!sampleRate
 * @arg =!bufferSize
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:UInt default:4096 bufferSize The buffer size of the FFT.
 * @param type:String min:0.0 default:forward method The direction to do the FFT to.
*/

/**
 * Forward process the buffer.
 *
 * @name forward
 * @method FFT
*/

/**
 * Backward process the buffer.
 *
 * @name backward
 * @method FFT
*/

/**
 * Calculate the spectrum for the FFT buffer.
 *
 * @name calculateSpectrum
 * @method FFT
*/

