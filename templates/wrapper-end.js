/*
	wrapper-end.js
	Please note that this file is of invalid syntax if standalone.
*/

/* Controls */
//#echo @controls.copy().sort().map(function(e){return ['audioLib.'+e.assignName,'= '+e.name+';']}).table() + '\n'

/* Effects */
//#echo @effects.copy().sort().map(function(e){return ['audioLib.'+e.assignName,'= '+e.name+';']}).table() + '\n'

/* Geneneration */
//#echo @generators.copy().sort().map(function(e){return ['audioLib.'+e.assignName,'= '+e.name+';']}).table() + '\n'

/* Processing */
//#echo @processors.copy().sort().map(function(e){return ['audioLib.'+e.assignName,'= '+e.name+';']}).table() + '\n'

/* Miscellaneous */

/* FIXME: The should be templated somehow as well */
audioLib.AudioDevice			= audioLib.Sink = (function () { return this; } () ).Sink;
audioLib.Automation			= Automation;
audioLib.BufferEffect			= BufferEffect;
audioLib.EffectClass			= EffectClass;
audioLib.GeneratorClass			= GeneratorClass;
audioLib.codecs				= audioLib.Codec = Codec;
audioLib.plugins			= Plugin;

/* Trigger the ready event (all is registered) */

while (onready.list.length) {
	onready.list.shift().call(audioLib);
}
onready = null;

/* Handle inheritance */

void function (names, i) {
	function effects (name, effect, prototype, argNames) {
		var proto, k;

		if (effect) {
			prototype = prototype || effect.prototype;
			proto = effect.prototype = new EffectClass();
			proto.name = proto.fxid = name;

			effects[name] = __class(name, effect, argNames);

			for (k in prototype) {
				if (prototype.hasOwnProperty(k)){
					proto[k] = prototype[k];
				}
			}

			for (k in EffectClass) {
				if (k !== 'prototype' && EffectClass.hasOwnProperty(k)) {
					effects[name][k] = EffectClass[k];
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
}).join(', ') */]);

void function (names, i) {
	function generators (name, effect, prototype, argNames) {
		var proto, k;

		if (effect) {
			prototype = prototype || effect.prototype;
			proto = effect.prototype = new GeneratorClass();

			proto.name = proto.fxid = name;
			generators[name] = __class(name, effect, argNames);

			for (k in prototype) {
				if (prototype.hasOwnProperty(k)) {
					proto[k] = prototype[k];
				}
			}

			for (k in GeneratorClass) {
				if (k !== 'prototype' && GeneratorClass.hasOwnProperty(k)) {
					generators[name][k] = GeneratorClass[k];
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
}).join(', ') */]);

/* FIXME: Make this happen based on the features we have */
Codec('wav', audioLib.PCMData);

audioLib.version = '/*#echo @version*/';

return audioLib;
}).call(typeof exports === 'undefined' ? {} : this, this.window || global, Math, Object, Array);
