/**
 * The parent class of all generators.
 *
 * @name Generator
 * @class
 *
 * @param type:Float mix The mix amount for the generator output.
 * @param type:UInt min:1 units:channels The channel count of the generator.
*/
function GeneratorClass () {}

GeneratorClass.prototype = {
	type:			'generator',
	source:			true,
	mix:			1,
	generatedBuffer:	null,
	channelCount:		1,
/**
 * Generates the buffer full of audio data and optionally puts the result on a separate output channel.
 *
 * @method Generator
 *
 * @arg {Array<Float>} buffer The buffer to apply the effect to.
 * @arg {UInt} min:1 !channelCount The amount of channels the buffer has.
 * @arg {Array<Float>} default:buffer !out The optional output buffer.
 * @return {Array<Float>} The output buffer.
*/
	append: function (buffer, channelCount, out) {
		var	l	= buffer.length,
			i, n;
		out		= out || buffer;
		channelCount	= channelCount || this.channelCount;
		for (i=0; i<l; i+=channelCount) {
			this.generate();
			for (n=0; n<channelCount; n++) {
				out[i + n] = this.getMix(n) * this.mix + buffer[i + n];
			}
		}
		return out;
	},
/**
 * Adds a callback that is applied before pushSample() to the effect.
 *
 * @method Generator
 *
 * @arg {Function} callback The callback to add.
*/
	addPreProcessing: function (callback) {
		callback.generate = this.generate;
		this.generate = function () {
			callback.apply(this, arguments);
			return callback.generate.apply(this, arguments);
		};
	},
/**
 * Removes a callback from the pre-processing queue.
 *
 * @method Generator
 *
 * @arg {Function} callback The callback to remove.
*/
	removePreProcessing: function (callback) {
		var f;
		while (f = this.generate.generate) {
			if (f === callback || !callback) {
				this.generate		= f;
				callback.generate	= null;
			}
		}
	},
/**
 * Generates a buffer of the specified length and channel count and assigns it to ``this.generatedBuffer``.
 *
 * Generally used when the generator is used as an automation modifier.
 *
 * @method Generator
 *
 * @arg {UInt} min:1 length The length of the buffer to generate.
 * @arg {UInt} min:1 default:1 !chCount The amount of channels the buffer should have.
*/
	generateBuffer: function (length, chCount) {
		this.generatedBuffer = new Float32Array(length);
		this.append(this.generatedBuffer, chCount || 1);
	},
/**
 * Sets a parameter of the effect to a certain value, taking into account all the other changes necessary to keep the effect sane.
 *
 * @method Generator
 *
 * @arg {String} param The parameter to change.
 * @arg value The value to set the parameter to.
*/
	setParam: function (param, value) {
		this[param] = value;
	},
/**
 * Generates one sample to all available channels, moving the generator one sample forward in the sample time.
 *
 * @method Generator
*/
	generate: function () {},
/**
 * Retrieves the current output of the generator.
 *
 * @method Generator
 *
 * @arg {UInt} default:0 !channel The channel to retrieve the output of. This is only applicable to multi-channel generators.
 * @return {Float} The current output of the generator.
*/
	getMix: function () {},
/**
 * Resets the component to it's initial state, if possible.
 *
 * @method Generator
*/
	reset: function () {}
};
