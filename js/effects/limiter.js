function Limiter(sampleRate, threshold, attack, decay){
	this.sampleRate		= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.threshold		= isNaN(threshold) ? this.threshold : threshold;
	this.attack		= isNaN(attack) ? this.attack : attack;
	this.decay		= isNaN(decay) ? this.decay : decay;
	this._amplitude		= new audioLib.Amplitude(this.sampleRate, this.attack, this.decay);
}

Limiter.prototype = {
	sampleRate:	44100,
	threshold:	0.95,
	attack:		0.01,
	release:	0.01,
	sample:		0,
	pushSample: function(s){
		var	d	= this._amplitude.pushSample(s) - this.threshold;
		this.sample	= d > 0 ? s / (1 + d) : s;
		return this.sample;
	},
	getMix: function(){
		return this.sample;
	},
	setParam: function(param, value){
		switch(param){
		case 'attack':
		case 'release':
			this._amplitude[param] = value;
			break;
		default:
			this[param] = value;
		}
	}
};
