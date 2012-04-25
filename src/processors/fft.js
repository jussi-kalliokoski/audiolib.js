var FFT = (function () {

var	sin	= Math.sin,
	cos	= Math.cos,
	pi2	= Math.PI * 2;

function twiddle (output, i, n, inverse) {
	var	phase	= (inverse ? pi2 : -pi2) * i / n;
	output[0]	= cos(phase);
	output[1]	= sin(phase);
}

function pass2 (input, output, inverse, product) {
	var	size		= input.length * 0.5,
		i		= 0,
		j		= 0,
		factor		= 2,
		m		= size / factor,
		q		= size / product,
		product1	= product / factor,
		jump		= (factor - 1) * product1,
		twidlz		= new Float32Array(2),
		k, k1, z0r, z0i, z1r, z1i, x0r, x0i, x1r, x1i;
		for (k=0; k<q; k++, j+= jump){
			twiddle(twidlz, k, q * factor, inverse);

			for (k1=0; k1<product1; k1++, i++, j++){
				z0r	= input[2 * i    ];
				z0i	= input[2 * i + 1];
				z1r	= input[2 * (i + m)    ];
				z1i	= input[2 * (i + m) + 1];
				x0r	= z0r + z1r;
				x0i	= z0i + z1i;
				x1r	= z0r - z1r;
				x1i	= z0i - z1i;

				output[2 * j    ]		= x0r;
				output[2 * j + 1]		= x0i;
				output[2 * (j + product1)    ]	= twidlz[0] * x1r - twidlz[1] * x1i;
				output[2 * (j + product1) + 1]	= twidlz[0] * x1i + twidlz[1] * x1r;
			}
		}
}

function fft (value, scratch, factors, inverse) {
	var	product		= 1,
		state		= 0,
		size		= value.length * 0.5,
		factorCount	= factors.length,
		inp, out, factor, i;

	for (i=0; i<factorCount; i++){
		factor		= factors[i];
		product		*= factor;
		
		if (state === 0) {
			inp = value;
			out = scratch;
			state = 1;
		} else {
			inp = scratch;
			out = value;
			state = 0;
		}

		if (factor === 2) pass2(inp, out, inverse, product);
	}
	if (inverse){
		if (state === 1){
			for (i=0; i<size; i++){
				value[2 * i    ]	= scratch[2 * i    ];
				value[2 * i + 1]	= scratch[2 * i + 1];
			}
		}
	} else {
		if (state === 1){
			for (i=0; i<size; i++){
				value[2 * i    ]	= scratch[2 * i    ] / size;
				value[2 * i + 1]	= scratch[2 * i + 1] / size;
			}
		} else {
			for (i=0; i<size; i++){
				value[2 * i    ]	= value[2 * i    ] / size;
				value[2 * i + 1]	= value[2 * i + 1] / size;
			}
		}
	}
}

function FFT () {
	this.reset.apply(this, arguments);
}

FFT.prototype = {
	factors: null,
	scratch: null,
	bufferSize: 2048,

	reset: function (bufferSize) {
		this.bufferSize	= isNaN(bufferSize) ? this.bufferSize : this.bufferSize;
		this.factors	= [2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
		this.scratch	= new Float32Array(this.bufferSize);
	},

	forward: function (input) {
		fft(input, this.scratch, this.factors, true);
	},
	backward: function (input) {
		fft(input, this.scratch, this.factors, false);
	}
};

return FFT;

}());

(function(proto){

proto.resetFFT = proto.reset;

proto.reset = function(sampleRate, bufferSize){
	audioLib.FourierTransform.apply(this, arguments);
	this.resetBuffer.apply(this, [].slice.call(arguments, 1));
	this.resetFT.apply(this, arguments);
	this.resetFFT.apply(this, [].slice.call(arguments, 1));
};

proto.process = function(buffer){
	this[this.method](buffer || this.buffer);
	return this.calculateSpectrum();
};

proto.setParam = function (name, value) {
	switch (name) {
	case "bufferSize":
		if (this.bufferSize === value) break;

		this.fullScratch = this.fullScratch || this.scratch;
		if (this.fullScratch.length < value) {
			this.fullScratch = new Float32Array(value);
		}

		this.scratch = this.fullScratch.subarray(0, value);
		break;
	}
	this[name] = value;
};

proto.resetScratch = function () {
	this.fullScratch	= null;
	this.scratch		= new Float32Array(this.bufferSize);
};

proto.fullScratch	= null;
proto.sampleRate	= 44100;
proto.method		= 'forward';

}(FFT.prototype));

/**
 * A Fast Fourier Transform module.
 *
 * @name FFT
 * @processor
 *
 * @arg =!sampleRate
 * @arg =!bufferSize
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:UInt default:4096 bufferSize The buffer size of the FFT.
 * @param type:String min:0.0 default:forward method The direction to do the FFT to.
*/

/**
 * Forward process the buffer.
 *
 * @name forward
 * @method FFT
*/

/**
 * Backward process the buffer.
 *
 * @name backward
 * @method FFT
*/

/**
 * Calculate the spectrum for the FFT buffer.
 *
 * @name calculateSpectrum
 * @method FFT
*/

