/**
 * Creates an ADSR envelope.
 *
 * @constructor
 * @this {ADSREnvelope}
 * @param {number} sampleRate Sample Rate (hz).
 * @param {number} attack (Optional) Attack (ms).
 * @param {number} decay (Optional) Decay (ms).
 * @param {number} sustain (Optional) Sustain (unsigned double).
 * @param {number} release (Optional) Release (ms).
*/
function ADSREnvelope(sampleRate, attack, decay, sustain, release){
	this.sampleRate	= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.attack	= isNaN(attack) ? this.attack : attack;
	this.decay	= isNaN(decay) ? this.decay : decay;
	this.sustain	= isNaN(sustain) ? this.sustain : sustain;
	this.release	= isNaN(release) ? this.release : release;
}

ADSREnvelope.prototype = {
	/** The sample rate of the envelope */
	sampleRate:	44100,
	/** The attack of the envelope, in ms */
	attack:		50,
	/** The decay of the envelope, in ms */
	decay:		50,
	/** The value for the sustain state of the envelope, 0.0 - 1.0 */
	sustain:	1,
	/** The release of the envelope, in ms */
	release:	50,
	/** The current value of the envelope */
	value:		0,
	/** The current state of the envelope */
	state:		3,
	/** The state of the gate of the envelope, open being true */
	gate:		false,
/**
 * Moves the envelope status one sample further in sample-time.
 *
 * @return {Number} The current value of the envelope.
*/
	generate: function(){
		this.states[this.state].call(this);
		return this.value;
	},
/**
 * Returns the current value of the envelope.
 *
 * @return {Number} The current value of the envelope.
*/
	getMix: function(){
		return this.value;
	},
/**
 * Sets the state of the envelope's gate.
 *
 * @param {Boolean} isOpen The new state of the gate.
*/
	triggerGate: function(isOpen){
		this.gate	= isOpen;
		this.state	= isOpen ? 0 : 3;
	},
/**
 * Array of functions for handling the different states of the envelope.
*/
	states: [
		function(){ // Attack
			this.value += 1000 / this.sampleRate / this.attack;
			if (this.value >= 1){
				this.state = 1;
			}
		},
		function(){ // Decay
			this.value -= 1000 / this.sampleRate / this.decay * this.sustain;
			if (this.value <= this.sustain){
				this.state = 2;
			}
		},
		function(){ // Sustain
			this.value = this.sustain;
		},
		function(){ // Release
			this.value = Math.max(0, this.value - 1000 / this.sampleRate / this.release);
		}
	]
};
