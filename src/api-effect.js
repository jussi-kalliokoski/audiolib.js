/**
 * The parent class of all effects.
 *
 * @name Effect
 * @class
 *
 * @param type:Float mix The mix between dry and wet for the effect.
 * @param type:UInt min:1 units:channels The channel count of the effect. If one, will be treated like a single channel effect and to be used with createBufferBased().
*/
function EffectClass () {}

EffectClass.prototype = {
	type:		'effect',
	sink:		true,
	source:		true,
	mix:		0.5,
	channelCount:	1,
/**
 * Applies the effect to a buffer of audio data and optionally puts the result on a separate output channel.
 *
 * @method Effect
 *
 * @arg {Array<Float>} buffer The buffer to apply the effect to.
 * @arg {UInt} min:1 !channelCount The amount of channels the buffer has.
 * @arg {Array<Float>} default:buffer out The optional output buffer.
 * @return {Array<Float>} The output buffer.
*/
	append: function (buffer, channelCount, out) {
		var	l	= buffer.length,
			i, n;
		out		= out || buffer;
		channelCount	= channelCount || this.channelCount;
		for (i=0; i<l; i+=channelCount) {
			for (n=0; n<channelCount; n++) {
				this.pushSample(buffer[i + n], n);
				out[i + n] = this.getMix(n) * this.mix + buffer[i + n] * (1 - this.mix);
			}
		}
		return out;
	},
/**
 * Adds a callback that is applied before pushSample() to the effect.
 *
 * @method Effect
 *
 * @arg {Function} callback The callback to add.
*/
	addPreProcessing: function (callback) {
		callback.pushSample = this.pushSample;
		this.pushSample = function () {
			callback.apply(this, arguments);
			return callback.pushSample.apply(this, arguments);
		};
	},
/**
 * Removes a callback from the pre-processing queue.
 *
 * @method Effect
 *
 * @arg {Function} callback The callback to remove.
*/
	removePreProcessing: function (callback) {
		var f;
		while (f = this.pushSample.pushSample) {
			if (f === callback || !callback) {
				this.pushSample		= f;
				callback.pushSample	= null;
			}
		}
	},
/**
 * Sets a parameter of the effect to a certain value, taking into account all the other changes necessary to keep the effect sane.
 *
 * @method Effect
 *
 * @arg {String} param The parameter to change.
 * @arg value The value to set the parameter to.
*/
	setParam: function (param, value) {
		this[param] = value;
	},
/**
 * Pushes a sample to the effect, moving it one sample forward in sample time.
 *
 * @method Effect
 *
 * @arg {Float} The sample to push to the effect.
 * @arg {UInt} min:1 !channel The channel to push to. This is only applicable to multi-channel effects.
*/
	pushSample: function () {},
/**
 * Retrieves the current output of the effect.
 *
 * @method Effect
 *
 * @arg {UInt} default:0 !channel The channel to retrieve the output of. This is only applicable to multi-channel effects.
 * @return {Float} The current output of the effect.
*/
	getMix: function () {},
/**
 * Resets the component to it's initial state, if possible.
 *
 * @method Effect
*/
	reset: function () {}
};
