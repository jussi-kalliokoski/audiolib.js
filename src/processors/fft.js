/* Copyright (c) 2012, Jens Nockert <jens@ofmlabs.org>, Jussi Kalliokoski <jussi@ofmlabs.org>
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/*jshint */
/*global Float64Array */

var FFT = function () {
"use strict";

function butterfly2(output, outputOffset, outputStride, fStride, state, m) {
	var t = state.twiddle;

	for (var i = 0; i < m; i++) {
		var s0_r = output[2 * ((outputOffset) + (outputStride) * (i))], s0_i = output[2 * ((outputOffset) + (outputStride) * (i)) + 1];
		var s1_r = output[2 * ((outputOffset) + (outputStride) * (i + m))], s1_i = output[2 * ((outputOffset) + (outputStride) * (i + m)) + 1];

		var t1_r = t[2 * ((0) + (fStride) * (i))], t1_i = t[2 * ((0) + (fStride) * (i)) + 1];

		var v1_r = s1_r * t1_r - s1_i * t1_i, v1_i = s1_r * t1_i + s1_i * t1_r;

		var r0_r = s0_r + v1_r, r0_i = s0_i + v1_i;
		var r1_r = s0_r - v1_r, r1_i = s0_i - v1_i;

		output[2 * ((outputOffset) + (outputStride) * (i))] = r0_r;
		output[2 * ((outputOffset) + (outputStride) * (i)) + 1] = r0_i;
		output[2 * ((outputOffset) + (outputStride) * (i + m))] = r1_r;
		output[2 * ((outputOffset) + (outputStride) * (i + m)) + 1] = r1_i;
	}
}

function butterfly3(output, outputOffset, outputStride, fStride, state, m) {
	var t = state.twiddle;
	var m1 = m, m2 = 2 * m;
	var fStride1 = fStride, fStride2 = 2 * fStride;

	var e = t[2 * ((0) + (fStride) * (m)) + 1];

	for (var i = 0; i < m; i++) {
		var s0_r = output[2 * ((outputOffset) + (outputStride) * (i))], s0_i = output[2 * ((outputOffset) + (outputStride) * (i)) + 1];

		var s1_r = output[2 * ((outputOffset) + (outputStride) * (i + m1))], s1_i = output[2 * ((outputOffset) + (outputStride) * (i + m1)) + 1];
		var t1_r = t[2 * ((0) + (fStride1) * (i))], t1_i = t[2 * ((0) + (fStride1) * (i)) + 1];
		var v1_r = s1_r * t1_r - s1_i * t1_i, v1_i = s1_r * t1_i + s1_i * t1_r;

		var s2_r = output[2 * ((outputOffset) + (outputStride) * (i + m2))], s2_i = output[2 * ((outputOffset) + (outputStride) * (i + m2)) + 1];
		var t2_r = t[2 * ((0) + (fStride2) * (i))], t2_i = t[2 * ((0) + (fStride2) * (i)) + 1];
		var v2_r = s2_r * t2_r - s2_i * t2_i, v2_i = s2_r * t2_i + s2_i * t2_r;

		var i0_r = v1_r + v2_r, i0_i = v1_i + v2_i;

		var r0_r = s0_r + i0_r, r0_i = s0_i + i0_i;
		output[2 * ((outputOffset) + (outputStride) * (i))] = r0_r;
		output[2 * ((outputOffset) + (outputStride) * (i)) + 1] = r0_i;

		var i1_r = s0_r - i0_r * 0.5;
		var i1_i = s0_i - i0_i * 0.5;

		var i2_r = (v1_r - v2_r) * e;
		var i2_i = (v1_i - v2_i) * e;

		var r1_r = i1_r - i2_i;
		var r1_i = i1_i + i2_r;
		output[2 * ((outputOffset) + (outputStride) * (i + m1))] = r1_r;
		output[2 * ((outputOffset) + (outputStride) * (i + m1)) + 1] = r1_i;

		var r2_r = i1_r + i2_i;
		var r2_i = i1_i - i2_r;
		output[2 * ((outputOffset) + (outputStride) * (i + m2))] = r2_r;
		output[2 * ((outputOffset) + (outputStride) * (i + m2)) + 1] = r2_i;
	}
}

function butterfly4(output, outputOffset, outputStride, fStride, state, m) {
	var r1_r, r1_i, r3_r, r3_i;
	var t = state.twiddle;
	var m1 = m, m2 = 2 * m, m3 = 3 * m;
	var fStride1 = fStride, fStride2 = 2 * fStride, fStride3 = 3 * fStride;

	for (var i = 0; i < m; i++) {
		var s0_r = output[2 * ((outputOffset) + (outputStride) * (i))], s0_i = output[2 * ((outputOffset) + (outputStride) * (i)) + 1];

		var s1_r = output[2 * ((outputOffset) + (outputStride) * (i + m1))], s1_i = output[2 * ((outputOffset) + (outputStride) * (i + m1)) + 1];
		var t1_r = t[2 * ((0) + (fStride1) * (i))], t1_i = t[2 * ((0) + (fStride1) * (i)) + 1];
		var v1_r = s1_r * t1_r - s1_i * t1_i, v1_i = s1_r * t1_i + s1_i * t1_r;

		var s2_r = output[2 * ((outputOffset) + (outputStride) * (i + m2))], s2_i = output[2 * ((outputOffset) + (outputStride) * (i + m2)) + 1];
		var t2_r = t[2 * ((0) + (fStride2) * (i))], t2_i = t[2 * ((0) + (fStride2) * (i)) + 1];
		var v2_r = s2_r * t2_r - s2_i * t2_i, v2_i = s2_r * t2_i + s2_i * t2_r;

		var s3_r = output[2 * ((outputOffset) + (outputStride) * (i + m3))], s3_i = output[2 * ((outputOffset) + (outputStride) * (i + m3)) + 1];
		var t3_r = t[2 * ((0) + (fStride3) * (i))], t3_i = t[2 * ((0) + (fStride3) * (i)) + 1];
		var v3_r = s3_r * t3_r - s3_i * t3_i, v3_i = s3_r * t3_i + s3_i * t3_r;

		var i0_r = s0_r + v2_r, i0_i = s0_i + v2_i;
		var i1_r = s0_r - v2_r, i1_i = s0_i - v2_i;
		var i2_r = v1_r + v3_r, i2_i = v1_i + v3_i;
		var i3_r = v1_r - v3_r, i3_i = v1_i - v3_i;

		var r0_r = i0_r + i2_r, r0_i = i0_i + i2_i;

		if (state.inverse) {
			r1_r = i1_r - i3_i;
			r1_i = i1_i + i3_r;
		} else {
			r1_r = i1_r + i3_i;
			r1_i = i1_i - i3_r;
		}

		var r2_r = i0_r - i2_r, r2_i = i0_i - i2_i;

		if (state.inverse) {
			r3_r = i1_r + i3_i;
			r3_i = i1_i - i3_r;
		} else {
			r3_r = i1_r - i3_i;
			r3_i = i1_i + i3_r;
		}

		output[2 * ((outputOffset) + (outputStride) * (i))] = r0_r;
		output[2 * ((outputOffset) + (outputStride) * (i)) + 1] = r0_i;
		output[2 * ((outputOffset) + (outputStride) * (i + m1))] = r1_r;
		output[2 * ((outputOffset) + (outputStride) * (i + m1)) + 1] = r1_i;
		output[2 * ((outputOffset) + (outputStride) * (i + m2))] = r2_r;
		output[2 * ((outputOffset) + (outputStride) * (i + m2)) + 1] = r2_i;
		output[2 * ((outputOffset) + (outputStride) * (i + m3))] = r3_r;
		output[2 * ((outputOffset) + (outputStride) * (i + m3)) + 1] = r3_i;
	}
}

function butterfly(output, outputOffset, outputStride, fStride, state, m, p) {
	var q1, x0_r, x0_i, k;
	var t = state.twiddle, n = state.n, scratch = new Float64Array(2 * p);

	for (var u = 0; u < m; u++) {
		for (q1 = 0, k = u; q1 < p; q1++, k += m) {
			x0_r = output[2 * ((outputOffset) + (outputStride) * (k))];
			x0_i = output[2 * ((outputOffset) + (outputStride) * (k)) + 1];
			scratch[2 * (q1)] = x0_r;
			scratch[2 * (q1) + 1] = x0_i;
		}

		for (q1 = 0, k = u; q1 < p; q1++, k += m) {
			var tOffset = 0;

			x0_r = scratch[2 * (0)];
			x0_i = scratch[2 * (0) + 1];
			output[2 * ((outputOffset) + (outputStride) * (k))] = x0_r;
			output[2 * ((outputOffset) + (outputStride) * (k)) + 1] = x0_i;

			for (var q = 1; q < p; q++) {
				tOffset = (tOffset + fStride * k) % n;

				var s0_r = output[2 * ((outputOffset) + (outputStride) * (k))], s0_i = output[2 * ((outputOffset) + (outputStride) * (k)) + 1];

				var s1_r = scratch[2 * (q)], s1_i = scratch[2 * (q) + 1];
				var t1_r = t[2 * (tOffset)], t1_i = t[2 * (tOffset) + 1];
				var v1_r = s1_r * t1_r - s1_i * t1_i, v1_i = s1_r * t1_i + s1_i * t1_r;

				var r0_r = s0_r + v1_r, r0_i = s0_i + v1_i;
				output[2 * ((outputOffset) + (outputStride) * (k))] = r0_r;
				output[2 * ((outputOffset) + (outputStride) * (k)) + 1] = r0_i;
			}
		}
	}
}

function work(output, outputOffset, outputStride, f, fOffset, fStride, inputStride, factors, state) {
	var i, x0_r, x0_i;
	var p = factors.shift();
	var m = factors.shift();

	if (m == 1) {
		for (i = 0; i < p * m; i++) {
			x0_r = f[2 * ((fOffset) + (fStride * inputStride) * (i))];
			x0_i = f[2 * ((fOffset) + (fStride * inputStride) * (i)) + 1];
			output[2 * ((outputOffset) + (outputStride) * (i))] = x0_r;
			output[2 * ((outputOffset) + (outputStride) * (i)) + 1] = x0_i;
		}
	} else {
		for (i = 0; i < p; i++) {
			work(output, outputOffset + outputStride * i * m, outputStride, f, fOffset + i * fStride * inputStride, fStride * p, inputStride, factors.slice(), state);
		}
	}

	switch (p) {
		case 2: butterfly2(output, outputOffset, outputStride, fStride, state, m); break;
		case 3: butterfly3(output, outputOffset, outputStride, fStride, state, m); break;
		case 4: butterfly4(output, outputOffset, outputStride, fStride, state, m); break;
		default: butterfly(output, outputOffset, outputStride, fStride, state, m, p); break;
	}
}

var complex = function (n, inverse) {
	if (arguments.length < 2) {
		throw new RangeError("You didn't pass enough arguments, passed `" + arguments.length + "'");
	}

	n = ~~n;
	inverse = !!inverse;

	if (n < 1) {
		throw new RangeError("n is outside range, should be positive integer, was `" + n + "'");
	}

	this.inputBuffer = new Float64Array(2 * n);
	this.outputBuffer = new Float64Array(2 * n);

	var state = {
		n: n,
		inverse: inverse,

		factors: [],
		twiddle: new Float64Array(2 * n),
		scratch: new Float64Array(2 * n)
	};

	var t = state.twiddle, theta = 2 * Math.PI / n;

	var i, phase;

	for (i = 0; i < n; i++) {
		if (inverse) {
			phase =  theta * i;
		} else {
			phase = -theta * i;
		}

		t[2 * (i)] = Math.cos(phase);
		t[2 * (i) + 1] = Math.sin(phase);
	}

	var p = 4, v = Math.floor(Math.sqrt(n));

	while (n > 1) {
		while (n % p) {
			switch (p) {
				case 4: p = 2; break;
				case 2: p = 3; break;
				default: p += 2; break;
			}

			if (p > v) {
				p = n;
			}
		}

		n /= p;

		state.factors.push(p);
		state.factors.push(n);
	}

	this.state = state;

	this.resetFT();
};

complex.prototype.process = function (output, input, t) {
	this.process_explicit(output || this.outputBuffer, 0, 1, input || this.inputBuffer, 0, 1, t);
};

complex.prototype.process_explicit = function(output, outputOffset, outputStride, input, inputOffset, inputStride, t) {
	var i, x0_r, x0_i;
	outputStride = ~~outputStride;
	inputStride = ~~inputStride;

	t = t || this.inputType;
	var type = t === 'real' ? t : 'complex';

	if (outputStride < 1) {
		throw new RangeError("outputStride is outside range, should be positive integer, was `" + outputStride + "'");
	}

	if (inputStride < 1) {
		throw new RangeError("inputStride is outside range, should be positive integer, was `" + inputStride + "'");
	}

	if (type == 'real') {
		for (i = 0; i < this.state.n; i++) {
			x0_r = input[inputOffset + inputStride * i];
			x0_i = 0.0;

			this.state.scratch[2 * (i)] = x0_r;
			this.state.scratch[2 * (i) + 1] = x0_i;
		}

		work(output, outputOffset, outputStride, this.state.scratch, 0, 1, 1, this.state.factors.slice(), this.state);
	} else {
		if (input == output) {
			work(this.state.scratch, 0, 1, input, inputOffset, 1, inputStride, this.state.factors.slice(), this.state);

			for (i = 0; i < this.state.n; i++) {
				x0_r = this.state.scratch[2 * (i)];
				x0_i = this.state.scratch[2 * (i) + 1];

				output[2 * ((outputOffset) + (outputStride) * (i))] = x0_r;
				output[2 * ((outputOffset) + (outputStride) * (i)) + 1] = x0_i;
			}
		} else {
			work(output, outputOffset, outputStride, input, inputOffset, 1, inputStride, this.state.factors.slice(), this.state);
		}
	}
};

complex.prototype.__super = complex;

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
function FFT (sampleRate, n, inverse) {
	var args = [].slice.call(arguments);
	args[0] = this.sampleRate = isNaN(sampleRate) || sampleRate === null ? this.sampleRate : sampleRate;
	args[1] = this.bufferSize = isNaN(n) || n === null ? this.bufferSize : n;
	args[2] = !!inverse;

	this.__super.apply(this, args.slice(1));
}

FFT.prototype = complex.prototype;
FFT.prototype.inputType = 'real';
FFT.prototype.sampleRate = 44100;
FFT.prototype.bufferSize = 4096;

FFT.prototype.resetFT = function (s) {
	this.inputBuffer = new Float64Array(2 * this.bufferSize);
	this.outputBuffer = new Float64Array(2 * this.bufferSize);
	this.spectrum = new Float64Array(this.bufferSize / 2);

	this.bandWidth = this.sampleRate / this.bufferSize / 2;
	this.peakBand = 0;
	this.peak = 0;

	this.sample = 0;
	this.offset = 0;
	this.maxOffset = this.inputType === 'real' ? this.bufferSize : this.bufferSize * 2;

	this.pushSample = this._pushSample;
};

FFT.prototype.pushSample = function (s) {
	this.resetFT();

	return this.pushSample(s);
};

FFT.prototype._pushSample = function (s) {
	this.inputBuffer[this.offset] = s;
	this.sample = s;

	this.offset = (this.offset + 1) % this.maxOffset;
	if (!this.offset) this.process();

	return s;
};

FFT.prototype.getMix = function () {
	return this.sample;
};

/**
 * Gets the frequency of a specified band.
 *
 * @name getBandFrequency
 * @method FFT
 *
 * @param {Number} index The index of the band.
 * @return {Number} The frequency.
*/

FFT.prototype.getBandFrequency = function (index) {
	return this.bandWidth * index + this.bandWidth * 0.5;
};

/**
 * Calculate the spectrum for the FFT buffer.
 *
 * @name calculateSpectrum
 * @method FFT
*/
FFT.prototype.calculateSpectrum = function () {
	var i, n, rr, ii, mag;
	var spectrum = this.spectrum;
	var buffer = this.outputBuffer;
	var bSi = 2 / this.bufferSize;
	var l = this.bufferSize / 2;

	for (i=0, n=2; i<l; i++, n+=2) {
		rr = buffer[n + 0];
		ii = buffer[n + 1];
		mag = bSi * Math.sqrt(rr * rr + ii * ii);

		if (mag > this.peak) {
			this.peakBand = i;
			this.peak = mag;
		}

		this.spectrum[i] = mag;
	}
};

FFT.prototype._process = FFT.prototype.process;
FFT.prototype.process = function () {
	this._process.apply(this, arguments);
	this.calculateSpectrum();
};

return FFT;

}();
