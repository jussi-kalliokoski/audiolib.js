/*
	wrapper-end.js
	Please note that this file is of invalid syntax if standalone.
*/

// Controls
audioLib.ADSREnvelope		= ADSREnvelope;
audioLib.StepSequencer		= StepSequencer;
audioLib.UIControl		= UIControl;


//Effects
audioLib.BiquadFilter	= BiquadFilter;
audioLib.BitCrusher	= BitCrusher;
audioLib.Chorus		= Chorus;
audioLib.CombFilter	= CombFilter;
audioLib.Compressor	= Compressor;
audioLib.Delay		= Delay;
audioLib.Distortion	= Distortion;
audioLib.GainController	= GainController;
audioLib.IIRFilter	= IIRFilter;
audioLib.LP12Filter	= LP12Filter;
audioLib.Reverb		= Freeverb;


//Geneneration
audioLib.Oscillator	= Oscillator;
audioLib.Sampler	= Sampler;


//Processing
audioLib.AudioProcessingUnit	= AudioProcessingUnit;
audioLib.FFT			= FFT;


audioLib.AudioDevice	= audioLib.Sink = (function(){ return this; }()).Sink;


function EffectClass(){
}

EffectClass.prototype = {
	type:	'effect',
	sink:	true,
	source:	true,
	mix:	0.5,
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
	}
};

function EffectChain(){
	var	arr	= Array.prototype.splice.call(arguments, 0),
		proto	= arr.prototype = EffectChain.prototype;
	for (i in proto){
		if (proto.hasOwnProperty(i)){
			arr[i] = proto[i];
		}
	}
	return arr;
}

(function(proto){
	EffectChain.prototype = proto;
	proto.pushSample = function(sample){
		var	self	= this,
			mix,
			i;
		for (i=0; i<self.length; i++){
			mix	= self[i].mix;
			sample	= self[i].pushSample(sample) * mix + sample * (1 - mix);
		}
		return sample;
	};
}(new EffectClass()));

function BufferEffect(effect, channelCount, args){
	this.channelCount	= channelCount;
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
	mix: 0.5,
	append:	function(buffer){
		var	self	= this,
			ch	= self.channelCount,
			l	= buffer.length,
			i, n;
		for (i=0; i<l; i+=ch){
			for (n=0; n<ch; n++){
				buffer[i + n] = self.effects[n].pushSample(buffer[i + n]) * self.mix + buffer[i + n] * (1 - self.mix);
			}
		}
		return buffer;
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
	addAutomation: function(){
		return audioLib.Automation.apply(audioLib, [this].concat([].slice.call(arguments)));
	}
};


function GeneratorClass(){
}

GeneratorClass.prototype = {
	type:	'generator',
	source:	true,
	mix:	1,
	generatedBuffer: null,
	append: function(buffer, channelCount){
		var	l	= buffer.length,
			i, n;
		channelCount	= channelCount || 1;
		for (i=0; i<l; i+=channelCount){
			this.generate();
			for (n=0; n<channelCount; n++){
				buffer[i + n] = this.getMix(n) * this.mix + buffer[i + n];
			}
		}
		return buffer;
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
	addAutomation: function(){
		return audioLib.Automation.apply(audioLib, [this].concat([].slice.call(arguments)));
	},
	generateBuffer: function(length, chCount){
		this.generatedBuffer = new Float32Array(length);
		this.append(this.generatedBuffer, chCount || 1);
	}
};

(function(names, i){
	function createBufferBased(channelCount){
		return new audioLib.BufferEffect(this, channelCount, [].slice.call(arguments, 1));
	}

	function effects(name, effect, prototype){
		if (effect){
			prototype	= prototype || effect.prototype;
			effects[name]	= effect;
			var	proto	= effect.prototype = new EffectClass();
			proto.name	= proto.fxid = name;
			effects[name].createBufferBased = createBufferBased;
			for (name in prototype){
				if (prototype.hasOwnProperty(name)){
					proto[name] = prototype[name];
				}
			}
		}
		return effects[name];
	}



	audioLib.effects = effects;

	for (i=0; i<names.length; i++){
		effects(names[i], audioLib[names[i]], audioLib[names[i]].prototype);
	}

	effects('BiquadHighPassFilter', BiquadFilter.HighPass);
	effects('BiquadLowPassFilter', BiquadFilter.LowPass);
	effects('BiquadAllPassFilter', BiquadFilter.AllPass);
	effects('BiquadBandPassFilter', BiquadFilter.BandPass);
}(['BiquadFilter', 'BitCrusher', 'Chorus', 'CombFilter', 'Compressor', 'Delay', 'Distortion', 'GainController', 'IIRFilter', 'LP12Filter', 'Reverb', 'FFT']));

(function(names, i){
	function generators(name, effect, prototype){
		if (effect){
			prototype	= prototype || effect.prototype;
			generators[name]= effect;
			var	proto	= effect.prototype = new GeneratorClass();
			proto.name	= proto.fxid = name;
			for (name in prototype){
				if (prototype.hasOwnProperty(name)){
					proto[name] = prototype[name];
				}
			}
		}
		return generators[name];
	}

	audioLib.generators = generators;

	for (i=0; i<names.length; i++){
		generators(names[i], audioLib[names[i]], audioLib[names[i]].prototype);
	}
}(['Oscillator', 'Sampler', 'ADSREnvelope', 'StepSequencer', 'UIControl']));

function Codec(name, codec){
	var nameCamel = name[0].toUpperCase() + name.substr(1).toLowerCase();
	Codec[name] = codec;
	if (codec.decode){
		audioLib.Sampler.prototype['load' + nameCamel] = function(filedata){
			this.load.apply(this, [Codec[name].decode(filedata)].concat([].slice.call(arguments, 1)));
		};
	}
	if (codec.encode){
		audioLib.AudioDevice.Recording.prototype['to' + nameCamel] = function(bytesPerSample){
			return Codec[name].encode({
				data:		this.join(),
				sampleRate:	this.boundTo.sampleRate,
				channelCount:	this.boundTo.channelCount,
				bytesPerSample:	bytesPerSample
			});
		};
	}
	return codec;
}

Codec('wav', audioLib.PCMData);

function Plugin(name, plugin){
	Plugin[name] = plugin;
	Plugin._pluginList.push({
		plugin: plugin,
		name:	name
	});
}

__defineConst(Plugin, '_pluginList', [], false);

function Automation(fx, parameter, automation, amount, type){
	if (!fx.automation){
		fx.automation = [];
		if (fx.type === 'generator'){
			fx.append = Automation.generatorAppend;
		} else {
			fx.append = Automation.effectAppend;
		}
	}
	var automation = {
		parameter:	parameter,
		automation:	automation,
		amount:		isNaN(amount) ? 1 : amount,
		type:		type || 'modulation'
	};
	fx.automation.push(automation);
	return automation;
}

Automation.generatorAppend = function(buffer, channelCount){
	var	self	= this,
		l	= buffer.length,
		k	= self.automation.length,
		def	= [],
		z, i, n, m, a;
	channelCount	= channelCount || 1;
	for (m=0; m<k; m++){
		def.push(self[self.automation[m].parameter]);
	}
	for (i=0, z=0; i<l; i+=channelCount, z++){
		for (m=0; m<k; m++){
			self[self.automation[m].parameter] = def[m];
		}
		for (m=0; m<k; m++){
			a = self.automation[m];
			switch(a.type){
				case 'modulation':
					self[a.parameter] *= a.amount * a.automation.generatedBuffer[z];
					break;
				case 'addition':
					self[a.parameter] += a.amount * a.automation.generatedBuffer[z];
					break;
				case 'substraction':
					self[a.parameter] -= a.amount * a.automation.generatedBuffer[z];
					break;
				case 'additiveModulation':
					self[a.parameter] += self[a.parameter] * a.amount * a.automation.generatedBuffer[z];
					break;
				case 'substractiveModulation':
					self[a.parameter] -= self[a.parameter] * a.amount * a.automation.generatedBuffer[z];
					break;
				case 'assignment':
					self[a.parameter] = a.amount * a.automation.generatedBuffer[z];
					break;
				case 'absoluteAssignment':
					self[a.parameter] = Math.abs(a.amount * a.automation.generatedBuffer[z]);
					break;
			}
		}

		self.generate();

		for (n=0; n<channelCount; n++){
			buffer[i + n] = self.getMix(n) * self.mix + buffer[i + n];
		}
	}
	for (m=0; m<k; m++){
		self[self.automation[m].parameter] = def[m];
	}
	return buffer;
}
Automation.effectAppend = function(buffer){
	var	self	= this,
		ch	= self.channelCount,
		l	= buffer.length,
		k	= self.automation.length,
		def	= [],
		i, n, m, z, a, x;
	for (m=0; m<k; m++){
		def.push([]);
		for (n=0; n<ch; n++){
			def[m].push(self.effects[n][self.automation[m].parameter]);
		}
	}
	for (x=0, i=0; i<l; i+=ch, x++){
		for (n=0; n<ch; n++){
			for (m=0; m<k; m++){
				a = self.automation[m];
				self.effects[n][a.parameter] = def[m][n];
				switch(a.type){
					case 'modulation':
						self.effects[n][a.parameter] *= a.amount * a.automation.generatedBuffer[x];
						break;
					case 'addition':
						self.effects[n][a.parameter] += a.amount * a.automation.generatedBuffer[x];
						break;
					case 'substraction':
						self.effects[n][a.parameter] -= a.amount * a.automation.generatedBuffer[x];
						break;
					case 'additiveModulation':
						self.effects[n][a.parameter] += self.effects[n][a.parameter] * a.amount * a.automation.generatedBuffer[x];
						break;
					case 'substractiveModulation':
						self.effects[n][a.parameter] -= self.effects[n][a.parameter] * a.amount * a.automation.generatedBuffer[x];
						break;
					case 'assignment':
						self.effects[n][a.parameter] = a.amount * a.automation.generatedBuffer[x];
						break;
					case 'absoluteAssignment':
						self.effects[n][a.parameter] = Math.abs(a.amount * a.automation.generatedBuffer[x]);
						break;
				}
			}
			buffer[i + n] = self.effects[n].pushSample(buffer[i + n]) * self.mix + buffer[i + n] * (1 - self.mix);
		}
	}
	for (m=0; m<k; m++){
		for (n=0; n<ch; n++){
			self.effects[n][self.automation[m].parameter] = def[m][n];
		}
	}
	return buffer;
}

audioLib.Automation	= Automation;

audioLib.EffectChain	= EffectChain;
audioLib.EffectClass	= EffectClass;
audioLib.BufferEffect	= BufferEffect;
audioLib.GeneratorClass	= GeneratorClass;
audioLib.codecs		= audioLib.Codec = Codec;
audioLib.plugins	= Plugin;

audioLib.version	= '0.4.7';

return audioLib;
}).call(typeof exports === 'undefined' ? {} : this, this.window || global, Math, Object, Array);
