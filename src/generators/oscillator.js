/**
 * Creates a new Oscillator.
 *
 * @generator
 *
 * @arg =!sampleRate
 * @arg =!frequency
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:Float units:Hz min:0 default:440 frequency The frequency of the Oscillator.
 * @param type:Float min:0.0 max:1.0 default:0.0 phaseOffset The phase offset of the Oscillator.
 * @param type:Float min:0.0 max:1.0 default:0.5 pulseWidth The pulse width of the Oscillator.
 * @param type:String|UInt default:sine waveShape The wave shape of the Oscillator.
 * @param type:Float default:0 fm The frequency modulation of the Oscillator.
*/

function Oscillator (sampleRate, freq) {
	var	self	= this;
	self.frequency	= isNaN(freq) ? 440 : freq;
	self.waveTable	= new Float32Array(1);
	self.sampleRate = sampleRate;
	self.waveShapes	= self.waveShapes.slice(0);
}

(function (FullPI, waveshapeNames, proto, i) {

proto = Oscillator.prototype = {
	sampleRate:	44100,
	frequency:	440,
	phaseOffset:	0,
	pulseWidth:	0.5,
	fm:		0,
	waveShape:	'sine',
	/* Phase of the Oscillator */
	phase:		0,
/* The relative of phase of the Oscillator (pulsewidth, phase offset, etc applied). */
	_p:		0,

/**
 * Moves the Oscillator's phase forward by one sample.
*/
	generate: function () {
		var	self	= this,
			f	= +self.frequency,
			pw	= self.pulseWidth,
			p	= self.phase;
		f += f * self.fm;
		self.phase	= (p + f / self.sampleRate / 2) % 1;
		p		= (self.phase + self.phaseOffset) % 1;
		self._p		= p < pw ? p / pw : (p-pw) / (1-pw);
	},
/**
 * Returns the output signal sample of the Oscillator.
 *
 * @return {Float} The output signal sample.
*/
	getMix: function () {
		return this[this.waveShape]();
	},
/**
 * Returns the relative phase of the Oscillator (pulsewidth, phaseoffset, etc applied).
 *
 * @return {Float} The relative phase.
*/
	getPhase: function () {
		return this._p;
	},
/**
 * Resets the Oscillator phase (AND RELATIVE PHASE) to a specified value.
 *
 * @arg {Float} phase The phase to reset the values to. (Optional, defaults to 0).
*/
	reset: function (p) {
		this.phase = this._p = isNaN(p) ? 0 : p;
	},
/**
 * Specifies a wavetable for the Oscillator.
 *
 * @method Oscillator
 *
 * @arg {Array<Float>} wavetable The wavetable to be assigned to the Oscillator.
 * @return {Boolean} Succesfulness of the operation.
*/
	setWavetable: function (wt) {
		this.waveTable = wt;
		return true;
	},
/**
 * Returns sine wave output of the Oscillator.
 *
 * Phase for the zero crossings of the function: 0.0, 0.5
 *
 * @method Oscillator
 *
 * @return {Float} Sample.
*/
	sine: function () {
		return Math.sin(this._p * FullPI);
	},
/**
 * Returns triangle wave output of the Oscillator, phase zero representing the top of the triangle.
 *
 * Phase for the zero crossings of the function: 0.25, 0.75
 *
 * @method Oscillator
 *
 * @return {Float} Sample.
*/
	triangle: function () {
		return this._p < 0.5 ? 4 * this._p - 1 : 3 - 4 * this._p;
	},
/**
 * Returns square wave output of the Oscillator, phase zero being the first position of the positive side.
 *
 * Phase for the zero crossings of the function: 0.0, 0.5
 *
 * @method Oscillator
 *
 * @return {Float} Sample.
*/
	square: function () {
		return this._p < 0.5 ? -1 : 1;
	},
/**
 * Returns sawtooth wave output of the Oscillator, phase zero representing the negative peak.
 *
 * Phase for the zero crossings of the function: 0.5
 *
 * @method Oscillator
 *
 * @return {Float} Sample.
*/
	sawtooth: function () {
		return 1 - this._p * 2;
	},
/**
 * Returns invert sawtooth wave output of the Oscillator, phase zero representing the positive peak.
 *
 * Phase for the zero crossings of the function: 0.5
 *
 * @method Oscillator
 *
 * @return {Float} Sample.
*/
	invSawtooth: function () {
		return this._p * 2 - 1;
	},
/**
 * Returns pulse wave output of the Oscillator, phase zero representing slope starting point.
 *
 * Phase for the zero crossings of the function: 0.125, 0.325
 *
 * @method Oscillator
 *
 * @return {Float} Sample.
*/
	pulse: function () {
		return this._p < 0.5 ?
			this._p < 0.25 ?
				this._p * 8 - 1 :
				1 - (this._p - 0.25) * 8 :
			-1;
	},
/**
 * Returns wavetable output of the Oscillator.
 *
 * Requires sink.js
 *
 * @method Oscillator
 *
 * @return {Float} Sample.
*/
	wavetable: function () {
		return audioLib.Sink.interpolate(this.waveTable, this._p * this.waveTable.length);
	},

	waveShapes: []
};

for (i=0; i<waveshapeNames.length; i++) {
	proto[i] = proto[waveshapeNames[i]];
	proto.waveShapes.push(proto[i]);
}

/**
 * Creates a new wave shape and attaches it to Oscillator.prototype by a specified name.
 *
 * @arg {String} name The name of the wave shape.
 * @arg {Function} algorithm The algorithm for the wave shape. If omitted, no changes are made.
 * @return {Function} The algorithm assigned to Oscillator.prototype by the specified name.
*/

Oscillator.WaveShape = function (name, algorithm) {
	if (algorithm) {
		this.prototype[name] = algorithm;
	}
	return this.prototype[name];
};

/**
 * Creates a new wave shape that mixes existing wave shapes into a new waveshape and attaches it to Oscillator.prototype by a specified name.
 *
 * @arg {String} name The name of the wave shape.
 * @arg {Array} waveshapes Array of the wave shapes to mix, wave shapes represented as objects where .shape is the name of the wave shape and .mix is the volume of the wave shape.
 * @return {Function} The algorithm created.
*/

Oscillator.createMixWave = function (name, waveshapes) {
	var	l = waveshapes.length,
		smpl, i;
	return this.WaveShape(name, function () {
		smpl = 0;
		for (i=0; i<l; i++) {
			smpl += this[waveshapes[i].shape]() * waveshapes[i].mix;
		}
		return smpl;
	});
};

}(Math.PI * 2, ['sine', 'triangle', 'pulse', 'sawtooth', 'invSawtooth', 'square']));
