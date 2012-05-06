/**
 * Buffer effect class provides a multi-channel interface for single channel effects.
 *
 * @class
 *
 * @arg type:ComponentClass effect The component class to create a buffer effect of.
 * @arg =!channelCount
 * @arg type:ArgumentArray !args An array of arguments to feed to the created effects.
 *
 * @param type:UInt min:2 units=channels channelCount The channel count of the buffer effect.
 * @param type:Float mix The mix between dry and wet for the effect.
*/
function BufferEffect (effect, channelCount, args) {
	this.channelCount	= isNaN(channelCount) ? this.channelCount : channelCount;
	this.effects		= [];

	function fx () {
		effect.apply(this, args);
	}
	fx.prototype = effect.prototype;

	while (channelCount--) {
		this.effects.push(new fx());
	}
}

BufferEffect.prototype = {
	mix:		0.5,
	type:		'buffereffect',
	channelCount:	2,
	append:	function (buffer, channelCount, out) {
		var	self	= this,
			l	= buffer.length,
			i, n;
		channelCount	= channelCount || self.channelCount;
		out		= out || buffer;
		for (i=0; i<l; i+=channelCount) {
			for (n=0; n<channelCount; n++) {
				self.effects[n].pushSample(buffer[i + n], 0);
				out[i + n] = self.effects[n].getMix(0) * self.mix + buffer[i + n] * (1 - self.mix);
			}
		}
		return out;
	},
	addPreProcessing: function () {
		var i;
		for (i=0; i<this.effects.length; i++){
			this.effects[i].addPreProcessing.apply(this.effects[i], arguments);
		}
	},
	removePreProcessing: function () {
		var i;
		for (i=0; i<this.effects.length; i++){
			this.effects[i].removePreProcessing.apply(this.effects[i], arguments);
		}
	},
	setParam: function (param, value) {
		var	l	= this.effects.length,
			i;
		for (i=0; i<l; i++) {
			this.effects[i].setParam(param, value);
		}
	}
};

onready(function () {
	audioLib.EffectClass.createBufferBased = function createBufferBased (channelCount) {
		return new audioLib.BufferEffect(this, channelCount, [].slice.call(arguments, 1));
	};
});
