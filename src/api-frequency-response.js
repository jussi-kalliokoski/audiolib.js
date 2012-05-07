onready(function () {

function getFrequencyResponse (callback, args, length, params) {
	var output, input, fft, fx, k;

	if (!args) {
		args = [];
	} else if (!params && !(args instanceof Array) && typeof args === 'object') {
		params = args;
		args = [];
	}

	params = params || {};

	length = length || 4096;

	if (typeof length === 'number') {
		output = new Float64Array(length);
	} else {
		output = length;
		length = output.length;
	}

	fx = this.apply(audioLib, args);

	for (k in params) {
		if (params.hasOwnProperty(k)) {
			fx.setParam(k, params[k]);
		}
	}

	fft = audioLib.FFT(fx.sampleRate || 44100, length / 2, false);

	input = new Float64Array(length / 2);

	if (callback) callback(input);

	fx.append(input, 1);

	fft._process(output, input, 'real');

	return output;
}

/**
 * Gets the frequency response of the effect.
 *
 * @name getFrequencyResponse
 * @static Effect
 *
 * @arg {Array} !args The arguments to pass to the effect.
 * @arg {Number} default:4096 !outputLength The length of the output or the output buffer.
 * @arg {Object} !params The parameters to apply to the effect.
 *
 * @return {Float64Array} The frequency response, as an interleaved fourier series.
*/
EffectClass.getFrequencyResponse = function (args, outputLength, params) {
	return getFrequencyResponse.call(this, function (buffer) {
		buffer[0] = buffer.length / 2;
	}, args, outputLength, params);
};

/**
 * Gets the frequency response of the generator.
 *
 * @name getFrequencyResponse
 * @static Generator
 *
 * @arg {Array} !args The arguments to pass to the effect.
 * @arg {Number} default:4096 !outputLength The length of the output or the output buffer.
 * @arg {Object} !params The parameters to apply to the effect.
 *
 * @return {Float64Array} The frequency response, as an interleaved fourier series.
*/
GeneratorClass.getFrequencyResponse = function (args, outputLength, params) {
	return getFrequencyResponse.call(this, null, args, outputLength, params);
};

});
