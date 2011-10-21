function GeneratorClass(){
}

GeneratorClass.prototype = {
	type:			'generator',
	source:			true,
	mix:			1,
	generatedBuffer:	null,
	channelCount:		1,
	append: function(buffer, channelCount, out){
		var	l	= buffer.length,
			i, n;
		out		= out || buffer;
		channelCount	= channelCount || this.channelCount;
		for (i=0; i<l; i+=channelCount){
			this.generate();
			for (n=0; n<channelCount; n++){
				out[i + n] = this.getMix(n) * this.mix + buffer[i + n];
			}
		}
		return out;
	},
	addPreProcessing: function(callback){
		callback.generate = this.generate;
		this.generate = function(){
			callback.apply(this, arguments);
			return callback.generate.apply(this, arguments);
		};
	},
	removePreProcessing: function(callback){
		var f;
		while (f = this.generate.generate){
			if (f === callback || !callback){
				this.generate		= f;
				callback.generate	= null;
			}
		}
	},
	generateBuffer: function(length, chCount){
		this.generatedBuffer = new Float32Array(length);
		this.append(this.generatedBuffer, chCount || 1);
	},
	setParam: function(param, value){
		this[param] = value;
	},
};
