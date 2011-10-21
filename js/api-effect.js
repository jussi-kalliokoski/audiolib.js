function EffectClass(){
}

EffectClass.prototype = {
	type:		'effect',
	sink:		true,
	source:		true,
	mix:		0.5,
	channelCount:	1,
	append: function(buffer, channelCount, out){
		var	l	= buffer.length,
			i, n;
		out		= out || buffer;
		channelCount	= channelCount || this.channelCount;
		for (i=0; i<l; i+=channelCount){
			for (n=0; n<channelCount; n++){
				this.pushSample(buffer[i + n], n);
				out[i + n] = this.getMix(n) * this.mix + buffer[i + n] * (1 - this.mix);
			}
		}
		return out;
	},
	join:	function(){
		return EffectChain.apply(0, [this].concat(Array.prototype.splice.call(arguments, 0)));
	},
	addPreProcessing: function(callback){
		callback.pushSample = this.pushSample;
		this.pushSample = function(){
			callback.apply(this, arguments);
			return callback.pushSample.apply(this, arguments);
		};
	},
	removePreProcessing: function(callback){
		var f;
		while (f = this.pushSample.pushSample){
			if (f === callback || !callback){
				this.pushSample		= f;
				callback.pushSample	= null;
			}
		}
	},
	setParam: function(param, value){
		this[param] = value;
	},
};
