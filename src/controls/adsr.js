/**
 * Creates an ADSR envelope.
 *
 * @control
 *
 * @arg =!sampleRate
 * @arg =!attack
 * @arg =!decay
 * @arg =!sustain
 * @arg =!release
 * @arg =!sustainTime
 * @arg =!releaseTime
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:Float min:0 default:50 attack The attack time of the envelope.
 * @param type:Float min:0 default:50 decay The decay time of the envelope.
 * @param type:Float min:0.0 max:1.0 sustain The sustain state of the envelope.
 * @param type:Float min:0 default:50 release The release time of the envelope.
 * @param type:Float min:0 units:ms default:null sustainTime The time the sustain mode should be sustained before launching release. If null, will wait for triggerGate event.
 * @param type:Float min:0 units:ms default:null releaseTime The time the release mode should be sustained before relaunching attack. If null, will wait for triggerGate event.
 * @param type:Bool default:false gate The state of the gate envelope, open being true.
 * @param type:UInt max:5 default:3 state The current state of the value, determining what the gate will do.
*/
function ADSREnvelope (sampleRate, attack, decay, sustain, release, sustainTime, releaseTime) {
	this.sampleRate		= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.attack		= isNaN(attack) ? this.attack : attack;
	this.decay		= isNaN(decay) ? this.decay : decay;
	this.sustain		= isNaN(sustain) ? this.sustain : sustain;
	this.release		= isNaN(release) ? this.release : release;
	this.sustainTime	= isNaN(sustainTime) ? null : sustainTime;
	this.releaseTime	= isNaN(releaseTime) ? null : releaseTime;
}

ADSREnvelope.prototype = {
	sampleRate:	44100,
	attack:		50,
	decay:		50,
	sustain:	1,
	release:	50,
	sustainTime:	null,
	releaseTime:	null,
	gate:		false,
	state:		3,
	/* The current value of the envelope */
	value:		0,
/* Private variable for timing the timed sustain and release. */
	_st: 0,
/**
 * Moves the envelope status one sample further in sample-time.
 *
 * @return {Number} The current value of the envelope.
*/
	generate: function () {
		this.states[this.state].call(this);
		return this.value;
	},
/**
 * Returns the current value of the envelope.
 *
 * @return {Number} The current value of the envelope.
*/
	getMix: function () {
		return this.value;
	},
/**
 * Sets the state of the envelope's gate.
 *
 * @method ADSREnvelope
 * 
 * @arg {Boolean} isOpen The new state of the gate.
*/
	triggerGate: function (isOpen) {
		isOpen		= typeof isOpen === 'undefined' ? !this.gate : isOpen;
		this.gate	= isOpen;
		this.state	= isOpen ? 0 : this.releaseTime === null ? 3 : 5;
		this._st	= 0;
	},
/**
 * Array of functions for handling the different states of the envelope.
*/
	states: [
		function () { // Attack
			this.value += 1000 / this.sampleRate / this.attack;
			if (this.value >= 1) {
				this.state = 1;
			}
		},
		function () { // Decay
			this.value -= 1000 / this.sampleRate / this.decay * this.sustain;
			if (this.value <= this.sustain) {
				if (this.sustainTime === null) {
					this.state	= 2;
				} else {
					this._st	= 0;
					this.state	= 4;
				}
			}
		},
		function () { // Sustain
			this.value = this.sustain;
		},
		function () { // Release
			this.value = Math.max(0, this.value - 1000 / this.sampleRate / this.release);
		},
		function () { // Timed sustain
			this.value = this.sustain;
			if (this._st++ >= this.sampleRate * 0.001 * this.sustainTime) {
				this._st	= 0;
				this.state	= this.releaseTime === null ? 3 : 5;
			}
		},
		function () { // Timed release
			this.value = Math.max(0, this.value - 1000 / this.sampleRate / this.release);
			if (this._st++ >= this.sampleRate * 0.001 * this.releaseTime) {
				this._st	= 0;
				this.state	= 0;
			}
		}
	]
};
