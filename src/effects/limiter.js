/**
 * Creates a dynamic amplitude limiter.
 *
 * Requires [[Amplitude]].
 * 
 * @effect
 *
 * @arg =!sampleRate
 * @arg =!threshold
 * @arg =!attack
 * @arg =!release
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:Float min:0.0 default:0.95 threshold The amplitude threshold after which to start limiting.
 * @param type:Float min:0.0 default:0.01 attack The speed on which the amplitude metering reacts.
 * @param type:Float min:0.0 default:0.01 release The speed on which the amplitude metering cools down.
*/
function Limiter(sampleRate, threshold, attack, release){
	this.sampleRate		= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.threshold		= isNaN(threshold) ? this.threshold : threshold;
	this.attack		= isNaN(attack) ? this.attack : attack;
	this.release		= isNaN(release) ? this.release : release;
	this._amplitude		= new audioLib.Amplitude(this.sampleRate, this.attack, this.release);
}

Limiter.prototype = {
	sampleRate:	44100,
	threshold:	0.95,
	attack:		0.01,
	release:	0.01,
	/* The Amplitude meter on which the limiting is based. */
	__amplitude:	null,
	/* The current output of the effect. */
	sample:		0,
/**
 * Processes a sample, moving the effect one sample further in sample-time.
 *
 * @arg {Float32} sample The sample to process.
 * @arg {Uint} channel The channel on which the sample is. (Only if multi-channel)
 * @return {Float32} The current output of the effect. (Only if single-channel)
*/
	pushSample: function(s){
		var	d	= this._amplitude.pushSample(s) - this.threshold;
		this.sample	= d > 0 ? s / (1 + d) : s;
		return this.sample;
	},
/**
 * Returns the current output of the effect.
 *
 * @arg {Uint} channel The channel for which to get the sample.
 * @return {Float32} The current output of the effect.
*/
	getMix: function(){
		return this.sample;
	},
/**
 * Sets a parameter of the effect, making necessary relative calculations.
 *
 * @arg {String} param The parameter name.
 * @arg {Object} value The new value of the parameter.
*/
	setParam: function(param, value){
		switch(param){
		case 'attack':
		case 'release':
			this._amplitude[param] = value;
			this[param] = value;
			break;
		default:
			this[param] = value;
		}
	}
};
