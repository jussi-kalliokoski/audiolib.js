//  Pluck.js - an audioLib.js implementation of the Karplus-Strong algorithm. 2012 Charlie Roberts charlie@charlie-roberts.com

(function myPlugin(){

function initPlugin(audioLib){
(function(audioLib){	

/**
 * Creates a new Pluck, an implementation of the Karplus-Strong algorithm.
 *
 * @generator
 *
 * @arg =!sampleRate
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:Float min:0 default:0 damping The rate at which the string decays
 * @param type:Float min:0.0 max:1.0 default:1 blend Changes sound between pitched and noisy
 * @param type:String default:white color The color of the noise used to seed the algorithm. May be white, pink or brown.
*/

function Pluck (sampleRate, damping, blend, color){
	this.value = 0;
	this.amp = 1;
	this.sampleRate = sampleRate || 44100;
	
	this.noise = new audioLib.Noise();
	this._buffer = [];
	this.lastValue = 0;

	this.damping = (isNaN(damping)) ? 0 : damping / 100;
	this.dampingValue = .5 - this.damping;
	this.blend = (isNaN(blend)) ? 1 : blend;
	
	this.color = (typeof color === "undefined") ? "white" : color;
	
	// override damping so that values between 0 and 1 make some sense
	(function(obj) {
		var that = obj;
		var _damping = that.damping;
	
		Object.defineProperties(that, {
			"damping" : { 
				get: function() {
					return _damping * 100;
				},
				set: function(value) {
					_damping = value / 100;
					that.dampingValue = .5 - _damping;
				}
			},
		});
	})(this);
}

Pluck.prototype = {
	sampleRate : 44100,
	name  : "Pluck",
	
	/**
	 * Play a note at the provided frequency
	 *
	 * @method Pluck
	 *
	 * @arg {Float} freq The frequency to play
	*/

	note : function(freq) {
		if(typeof freq === "undefined") freq = 440;
		this._buffer = [];

		var _size = Math.floor(44100 / freq);
		for(var i = 0; i < _size ; i++) {
			this._buffer[i] = this.noise[this.color]();
		}
	},
	
	generate : function() {
		var val = this._buffer.shift();
		if(isNaN(val)) val = 0;
		var rnd = (Math.random() > this.blend) ? -1 : 1;
		
		this.value = rnd * (val + this.lastValue) * this.dampingValue;
		
		this.lastValue = this.value;
		
		this._buffer.push(this.value);
	},
			
	getMix : function() { return this.value * this.amp; }
};

Pluck.prototype.__proto__ = new audioLib.GeneratorClass();

audioLib.generators('Pluck', Pluck);

audioLib.Pluck = audioLib.generators.Pluck;
 
}(audioLib));
audioLib.plugins('Pluck', myPlugin);
}

if (typeof audioLib === 'undefined' && typeof exports !== 'undefined'){
	exports.init = initPlugin;
} else {
	initPlugin(audioLib);
}

}());
