function Amplitude(sampleRate, attack, decay){
	this.sampleRate		= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.attack		= isNaN(attack) ? this.attack : attack;
	this.decay		= isNaN(decay) ? this.decay : decay;
}

Amplitude.prototype = {
	sampleRate:	44100,
	attack:		0.01,
	release:	0.01,
	sample:		0,
	pushSample: function(s){
		this.sample = Math.abs((s > this.sample ? this.attack : this.release) * (this.sample - s) + s);
		return this.sample;
	},
	getMix: function(){
		return this.sample;
	},
};
