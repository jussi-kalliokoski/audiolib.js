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
 * @param {number} sustainTime (Optional) The time the sustain mode lasts (ms).
 * @param {number} releaseTime (Optional) The time the release mode lasts (ms).
*/
function ADSREnvelope(sampleRate, attack, decay, sustain, release, sustainTime, releaseTime){
	this.sampleRate		= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.attack		= isNaN(attack) ? this.attack : attack;
	this.decay		= isNaN(decay) ? this.decay : decay;
	this.sustain		= isNaN(sustain) ? this.sustain : sustain;
	this.release		= isNaN(release) ? this.release : release;
	this.sustainTime	= isNaN(sustainTime) ? null : sustainTime;
	this.releaseTime	= isNaN(releaseTime) ? null : releaseTime;
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
	/** The time the sustain phase should be sustained before launching release. If null, will wait for triggerGate. */
	sustainTime:	null,
	/** The time the release phase should be sustained before relaunching attack. If null, will wait for triggerGate. */
	releaseTime:	null,
/**
 * Private variable for timing the timed sustain and release.
 *
 * @private
*/
	_st: 0,
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
		isOpen		= typeof isOpen === 'undefined' ? !this.gate : isOpen;
		this.gate	= isOpen;
		this.state	= isOpen ? 0 : this.releaseTime === null ? 3 : 5;
		this._st	= 0;
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
				if (this.sustainTime === null){
					this.state	= 2;
				} else {
					this._st	= 0;
					this.state	= 4;
				}
			}
		},
		function(){ // Sustain
			this.value = this.sustain;
		},
		function(){ // Release
			this.value = Math.max(0, this.value - 1000 / this.sampleRate / this.release);
		},
		function(){ // Timed sustain
			this.value = this.sustain;
			if (this._st++ >= this.sampleRate * 0.001 * this.sustainTime){
				this._st	= 0;
				this.state	= this.releaseTime === null ? 3 : 5;
			}
		},
		function(){ // Timed release
			this.value = Math.max(0, this.value - 1000 / this.sampleRate / this.release);
			if (this._st++ >= this.sampleRate * 0.001 * this.releaseTime){
				this._st	= 0;
				this.state	= 0;
			}
		}
	]
};
