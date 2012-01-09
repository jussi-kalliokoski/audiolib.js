/*
	wrapper-end.js
	Please note that this file is of invalid syntax if standalone.
*/

// Controls
//#echo @controls.copy().sort().map(function(e){return ['audioLib.'+e.assignName,'= '+e.name+';']}).table() + '\n'

// Effects
//#echo @effects.copy().sort().map(function(e){return ['audioLib.'+e.assignName,'= '+e.name+';']}).table() + '\n'

// Geneneration
//#echo @generators.copy().sort().map(function(e){return ['audioLib.'+e.assignName,'= '+e.name+';']}).table() + '\n'

// Processing
//#echo @processors.copy().sort().map(function(e){return ['audioLib.'+e.assignName,'= '+e.name+';']}).table() + '\n'
audioLib.AudioProcessingUnit	= AudioProcessingUnit;


audioLib.AudioDevice	= audioLib.Sink = (function () { return this; } () ).Sink;

(function (names, i) {
	function createBufferBased (channelCount) {
		return new audioLib.BufferEffect(this, channelCount, [].slice.call(arguments, 1));
	}

	function effects (name, effect, prototype, argNames) {
		if (effect) {
			prototype	= prototype || effect.prototype;
			var	proto	= effect.prototype = new EffectClass();
			proto.name	= proto.fxid = name;
			effects[name]	= __class(name, effect, argNames);
			effects[name].createBufferBased = effect.createBufferBased = createBufferBased;
			for (argNames in prototype) {
				if (prototype.hasOwnProperty(argNames)){
					proto[argNames] = prototype[argNames];
				}
			}
		}
		return effects[name];
	}



	audioLib.effects = effects;

	for (i=0; i<names.length; i++) {
		audioLib[names[i]] = effects(names[i], audioLib[names[i]], audioLib[names[i]].prototype);
	}

/*#echo @subeffects.copy().sort().concat(@subprocessors.copy().sort()).map(function(e){
	return ["effects('" + e.assignName + "',", e.subOf + '.' + e.name + ');'];
}).table().split('\n').map(function(e){return '\t' + e}).join('\n');
*/
}([/*#echo @effects.copy().sort().concat(@processors.copy().sort()).map(function(e){
	return "'" + e.assignName + "'";
}).join(', ') */]));

(function (names, i) {
	function generators (name, effect, prototype, argNames) {
		if (effect) {
			prototype	= prototype || effect.prototype;
			var	proto	= effect.prototype = new GeneratorClass();
			proto.name	= proto.fxid = name;
			generators[name]= __class(name, effect, argNames);
			for (argNames in prototype) {
				if (prototype.hasOwnProperty(argNames)) {
					proto[argNames] = prototype[argNames];
				}
			}
		}
		return generators[name];
	}

	audioLib.generators = generators;

	for (i=0; i<names.length; i++) {
		audioLib[names[i]] = generators(names[i], audioLib[names[i]], audioLib[names[i]].prototype);
	}
}([/*#echo @generators.copy().sort().concat(@controls.copy().sort()).map(function(e){
	return "'" + e.assignName + "'";
}).join(', ') */]));

Codec('wav', audioLib.PCMData);

audioLib.Automation			= Automation;
audioLib.BufferEffect			= BufferEffect;
audioLib.EffectClass			= EffectClass;
audioLib.GeneratorClass			= GeneratorClass;
audioLib.codecs				= audioLib.Codec = Codec;
audioLib.plugins			= Plugin;

audioLib.version			= '/*#echo @version*/';

audioLib.BufferEffect.prototype.addAutomation	=
audioLib.EffectClass.prototype.addAutomation	=
audioLib.GeneratorClass.prototype.addAutomation	=
function addAutomation () {
	return audioLib.Automation.apply(audioLib, [this].concat([].slice.call(arguments)));
};

return audioLib;
}).call(typeof exports === 'undefined' ? {} : this, this.window || global, Math, Object, Array);
