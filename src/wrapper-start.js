/*
	audiolib.js
	Jussi Kalliokoski
	https://github.com/jussi-kalliokoski/audiolib.js
	MIT license
*/

/*
	wrapper-start.js
	Please note that the file is not of valid syntax when standalone.
*/

this.audioLib = (function AUDIOLIB (global, Math, Object, Array) {

function onready (callback) {
	onready.list.push(callback);
}

onready.list = [];

var	arrayType	= global.Float32Array || Array,
	audioLib	= this;

function Float32Array (length) {
	var array = new arrayType(length);
	array.subarray = array.subarray || array.slice;
	return array;
}

audioLib.Float32Array = Float32Array;

var __define = (function () {

	if (Object.defineProperty) {
		return Object.defineProperty;
	} else if (Object.prototype.__defineGetter__) {
		return function(obj, prop, desc){
			desc.get && obj.__defineGetter__(prop, desc.get);
			desc.set && obj.__defineSetter__(prop, desc.set);
		}
	}

}());

function __defineConst (obj, prop, value, enumerable) {
	if (__define) {
		__define(obj, prop, {
			get: function () {
				return value;
			},
			enumerable: !!enumerable
		});
	} else {
		// Cheap...
		obj[prop] = value;
	}
}

__defineConst(audioLib, '__define', __define);
__defineConst(audioLib, '__defineConst', __defineConst);

function __extend (obj) {
	var	args	= arguments,
		l	= args.length,
		i, n;
	for (i=1; i<l; i++) {
		for (n in args[i]) {
			if (args[i].hasOwnProperty(n)) {
				obj[n] = args[i][n];
			}
		}
	}
	return obj;
}

__defineConst(audioLib, '__extend', __extend);

function __enum (obj, callback, unignoreInherited) {
	var i;
	for (i in obj) {
		(obj.hasOwnProperty(i) || unignoreInherited) && callback.call(obj, obj[i], i);
	}
	return obj;
}

__defineConst(audioLib, '__enum', __enum);

function __class (name, constructor, args) {
	var	i, cls;
	if (!args) {
		args	= [];
		i	= /^\s*function\s*\w*\s*\(([^\)]+)/.exec(constructor);
		if (i) {
			i[1].replace(/[a-z$_0-9]+/ig, function (i) {
				args.push(i);
			});
		} else {
			for (i=0; i<constructor.length; i++) {
				args[i] = Array(i+2).join('_');
			}
		}
	}
	cls = Function('var __q;return function ' + name + '(' + args.join() + '){var i; if(__q){__q=!__q}else if(this instanceof ' + name +')this.__CLASSCONSTRUCTOR.apply(this,arguments);else{__q=!__q;i=new ' + name + ';i.__CLASSCONSTRUCTOR.apply(i,arguments);return i}};')();
	cls.prototype = constructor.prototype;
	cls.prototype.__CLASSCONSTRUCTOR = constructor;
	__extend(cls, constructor);
	return cls;
}

__defineConst(audioLib, '__class', __class);
