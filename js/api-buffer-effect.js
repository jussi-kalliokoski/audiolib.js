function BufferEffect(effect, channelCount, args){
	this.channelCount	= isNaN(channelCount) ? this.channelCount : channelCount;
	this.effects		= [];

	function fx(){
		effect.apply(this, args);
	}
	fx.prototype = effect.prototype;

	while (channelCount--){
		this.effects.push(new fx());
	}
}

BufferEffect.prototype = {
	mix:		0.5,
	type:		'buffereffect',
	channelCount:	2,
	append:	function(buffer, channelCount, out){
		var	self	= this,
			l	= buffer.length,
			i, n;
		channelCount	= channelCount || self.channelCount;
		out		= out || buffer;
		for (i=0; i<l; i+=channelCount){
			for (n=0; n<channelCount; n++){
				self.effects[n].pushSample(buffer[i + n], 0);
				out[i + n] = self.effects[n].getMix(0) * self.mix + buffer[i + n] * (1 - self.mix);
			}
		}
		return out;
	},
	join:	function(){
		return BufferEffectChain.apply(0, [this].concat(Array.prototype.splice.call(arguments, 0)));
	},
	addPreProcessing: function(){
		var i;
		for (i=0; i<this.effects.length; i++){
			this.effects[i].addPreProcessing.apply(this.effects[i], arguments);
		}
	},
	removePreProcessing: function(){
		var i;
		for (i=0; i<this.effects.length; i++){
			this.effects[i].removePreProcessing.apply(this.effects[i], arguments);
		}
	},
	setParam: function(param, value){
		var	l	= this.effects.length,
			i;
		for (i=0; i<l; i++){
			this.effects[i].setParam(param, value);
		}
	},
};
