/**
 * Creates a Convolution effect.
 *
 * @effect
 *
 * @arg =!sampleRate
 * @arg =!kernels
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:AudioBuffer default:[0] kernels The kernels for the convolution effect.
*/
function Convolution (sampleRate, kernels) {
	this.sampleRate	= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.setParam('kernels', kernels || new Float32Array(1));
}

Convolution.prototype = {
	sampleRate: 44100,
	sample: 0,
	pos: 0,

	kernels: null,
	buffer: null,

/*
This is a very suboptimal implementation...
*/

	pushSample: function (s) {
		var p, i, l;

		this.sample = 0;

		this.buffer[this.pos] = s;

		for (i=0, l=this.buffer.length, p=this.pos+l; i<l; i++) {
			this.sample += this.kernels[i] * this.buffer[(p - i) % l];
		}

		this.pos = (this.pos + 1) % this.buffer.length;
	},

	getMix: function () {
		return this.sample;
	},

	setParam: function (param, value) {
		switch (param) {
		case 'kernels':
			this.buffer = new Float32Array(value.length);
			this.pos = 0;
			break;
		}

		this[param] = value;
	}
};
