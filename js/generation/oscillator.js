/**
 * Creates a new Oscillator.
 *
 * @constructor
 * @this {Oscillator}
 * @param {Number} sampleRate The samplerate to operate the Oscillator on.
 * @param {Number} frequency The frequency of the Oscillator. (Optional)
*/function Oscillator(sampleRate, freq)
{
	var	self	= this;
	self.frequency	= isNaN(freq) ? 440 : freq;
	self.waveTable	= new Float32Array(1);
	self.sampleRate = sampleRate;
	self.waveShapes	= self.waveShapes.slice(0);
}

(function(FullPI, waveshapeNames, proto, i){

proto = Oscillator.prototype = {
	/** Determines the sample rate on which the Oscillator operates */
	sampleRate:	1,
	/** Determines the frequency of the Oscillator */
	frequency:	440,
	/** Phase of the Oscillator */
	phase:		0,
	/** Phase offset of the Oscillator */
	phaseOffset:	0,
	/** Pulse width of the Oscillator */
	pulseWidth:	0.5,
	/** Frequency modulation of the Oscillator */
	fm:		0,
	/** Wave shape of the Oscillator */
	waveShape:	'sine',
/**
 * The relative of phase of the Oscillator (pulsewidth, phase offset, etc applied).
 *
 * @private
*/
	_p:		0,

/**
 * Moves the Oscillator's phase forward by one sample.
*/
	generate: function(){
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
 * @return {Float32} The output signal sample.
*/
	getMix: function(){
		return this[this.waveShape]();
	},
/**
 * Returns the relative phase of the Oscillator (pulsewidth, phaseoffset, etc applied).
 *
 * @return {Float32} The relative phase.
*/
	getPhase: function(){
		return this._p;
	},
/**
 * Resets the Oscillator phase (AND RELATIVE PHASE) to a specified value.
 *
 * @param {Float32} phase The phase to reset the values to. (Optional, defaults to 0).
*/
	reset: function(p){
		this.phase = this._p = isNaN(p) ? 0 : p;
	},
/**
 * Specifies a wavetable for the Oscillator.
 *
 * @param {AudioBuffer} wavetable The wavetable to be assigned to the Oscillator.
 * @return {Boolean} Succesfulness of the operation.
*/
	setWavetable: function(wt){
		this.waveTable = wt;
		return true;
	},
/**
 * Returns sine wave output of the Oscillator.
 * @return {Float32} Sample.
*/
// Phase for root of the function: 0.0, 0.5
	sine: function(){
		return Math.sin(this._p * FullPI);
	},
/**
 * Returns triangle wave output of the Oscillator, phase zero representing the top of the triangle.
 * @return {Float32} Sample.
*/
// Phase for root of the function: 0.25, 0.75
	triangle: function(){
		return this._p < 0.5 ? 4 * this._p - 1 : 3 - 4 * this._p;
	},
/**
 * Returns square wave output of the Oscillator, phase zero being the first position of the positive side.
 * @return {Float32} Sample.
*/
// Phase for root of the function: 0.0, 0.5
	square: function(){
		return this._p < 0.5 ? -1 : 1;
	},
/**
 * Returns sawtooth wave output of the Oscillator, phase zero representing the negative peak.
 * @return {Float32} Sample.
*/
// Phase for root of the function: 0.5
	sawtooth: function(){
		return 1 - this._p * 2;
	},
/**
 * Returns invert sawtooth wave output of the Oscillator, phase zero representing the positive peak.
 * @return {Float32} Sample.
*/
// Phase for root of the function: 0.5
	invSawtooth: function(){
		return this._p * 2 - 1;
	},
/**
 * Returns pulse wave output of the Oscillator, phase zero representing slope starting point.
 * @return {Float32} Sample.
*/
// Phase for root of the function: 0.125, 0.325
	pulse: function(){
		return this._p < 0.5 ?
			this._p < 0.25 ?
				this._p * 8 - 1 :
				1 - (this._p - 0.25) * 8 :
			-1;
	},
/**
 * Returns wavetable output of the Oscillator.
 * @return {Float32} Sample.
*/
	// Requires Sampler
	wavetable: function(){
		return audioLib.Sampler.interpolate(this.wavetable, this._p * this.wavetable.length);
	},
	waveShapes: []
};

for(i=0; i<waveshapeNames.length; i++){
	proto[i] = proto[waveshapeNames[i]];
	proto.waveShapes.push(proto[i]);
}

/**
 * Creates a new wave shape and attaches it to Oscillator.prototype by a specified name.
 *
 * @param {String} name The name of the wave shape.
 * @param {Function} algorithm The algorithm for the wave shape. If omitted, no changes are made.
 * @return {Function} The algorithm assigned to Oscillator.prototype by the specified name.
*/

Oscillator.WaveShape = function(name, algorithm){
	if (algorithm){
		this.prototype[name] = algorithm;
	}
	return this.prototype[name];
};

/**
 * Creates a new wave shape that mixes existing wave shapes into a new waveshape and attaches it to Oscillator.prototype by a specified name.
 *
 * @param {String} name The name of the wave shape.
 * @param {Array} waveshapes Array of the wave shapes to mix, wave shapes represented as objects where .shape is the name of the wave shape and .mix is the volume of the wave shape.
 * @return {Function} The algorithm created.
*/

Oscillator.createMixWave = function(name, waveshapes){
	var	l = waveshapes.length,
		smpl, i;
	return this.WaveShape(name, function(){
		smpl = 0;
		for (i=0; i<l; i++){
			smpl += this[waveshapes[i].shape]() * waveshapes[i].mix;
		}
		return smpl;
	});
};

}(Math.PI * 2, ['sine', 'triangle', 'pulse', 'sawtooth', 'invSawtooth', 'square']));
