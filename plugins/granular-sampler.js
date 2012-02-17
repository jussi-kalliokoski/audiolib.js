(function myPlugin(){

function initPlugin(audioLib){

(function(audioLib){

function GranularSampler (sampleRate, frequency) {
	this.sampleRate	= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.frequency	= isNaN(frequency) ? this.frequency : frequency;
	this.sampler	= audioLib.Sampler(this.sampleRate);
}

GranularSampler.prototype = {
	sampler: null,

	sampleRate: 44100,
	frequency: 440,
	phase: 1,
	pitch: 440,
	velocity: 1,

	getMix: function (ch) {
		return this.sampler.getMix(ch);
	},

	generate: function () {
		this.phase += this.frequency / this.sampleRate;
		if (this.phase >= 1) {
			this.sampler.noteOn(this.pitch, this.velocity);
			this.phase %= 1;
		}
		this.sampler.generate();
	},

	setParam: function (param, value) {
		switch (param) {
		case 'delayEnd':
		case 'delayStart':
			this.sampler[param] = value;
			break;
		default:
			this[param] = value;
		}
	},
};

audioLib.generators('GranularSampler', GranularSampler);

audioLib.GranularSampler = audioLib.generators.GranularSampler;

}(audioLib));
audioLib.plugins('GranularSampler', myPlugin);
}

if (typeof audioLib === 'undefined' && typeof exports !== 'undefined'){
	exports.init = initPlugin;
} else {
	initPlugin(audioLib);
}

}());
