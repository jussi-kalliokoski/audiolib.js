/*
	wrapper-end.js
	Please note that this file is of invalid syntax if standalone.
*/

// Controls
audioLib.ADSREnvelope		= ADSREnvelope;
audioLib.MidiEventTracker	= MidiEventTracker;
audioLib.StepSequencer		= StepSequencer;

//Effects
audioLib.AllPassFilter	= AllPassFilter;
audioLib.Chorus		= Chorus;
audioLib.Delay		= Delay;
audioLib.Distortion	= Distortion;
audioLib.IIRFilter	= IIRFilter;
audioLib.LowPassFilter	= LowPassFilter;
audioLib.LP12Filter	= LP12Filter;


//Geneneration
audioLib.Oscillator	= Oscillator;
audioLib.Sampler	= Sampler;

function EffectClass(){
}

EffectClass.prototype = {
	type:	'effect',
	sink:	true,
	source:	true,
	mix:	0.5,
	join:	function(){
		return EffectChain.apply(0, [this].concat(Array.prototype.splice.call(arguments, 0)));
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
	}
};

(function(names, i, effects, name, proto){
	effects = audioLib.effects = {};

	function createBufferBased(channelCount){
		return new audioLib.BufferEffect(this, channelCount, [].slice.call(arguments, 1));
	}

	for (i=0; i<names.length; i++){
		name = names[i];
		effects[name]	= audioLib[name];
		proto		= effects[name].prototype = new EffectClass();
		proto.name	= proto.fxid = name;
		effects[name].createBufferBased = createBufferBased;
	}
}(['AllPassFilter', 'Chorus', 'Delay', 'Distortion', 'IIRFilter', 'LowPassFilter', 'LP12Filter']));

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

audioLib.EffectChain	= EffectChain;
audioLib.EffectClass	= EffectClass;
audioLib.BufferEffect	= BufferEffect;
audioLib.codecs		= audioLib.Codec = Codec;

audioLib.version	= '0.4.5';

return audioLib;
}).call(typeof exports === 'undefined' ? {} : this, this.window || global, Math);
