/**
 * Creates a new Equal-Spacing Multi-Oscillator.
 *
 * Requires Oscillator
 *
 * @generator
 *
 * @arg =!sampleRate
 * @arg =!spacing
 * @arg =!frequency
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:Float units:Hz min:0 default:440 frequency The frequency of the Oscillator.
 * @param type:Float min:0.0 max:1.0 default:0.0 phaseOffset The phase offset of the Oscillator.
 * @param type:Float min:0.0 max:1.0 default:0.5 pulseWidth The pulse width of the Oscillator.
 * @param type:String|UInt default:sine waveShape The wave shape of the Oscillator.
 * @param type:Float default:0 fm The frequency modulation of the Oscillator.
 * @param type:Array spacing An array containing the spacing information.
*/

function ESMO (sampleRate, spacing, frequency) {
	this.sampleRate = isNaN(sampleRate) || sampleRate === null ? this.sampleRate : sampleRate;
	this.frequency = isNaN(frequency) || frequency === null ? this.frequency : frequency;
	this.spacing = spacing || [0];

	this.createOscillators();
	this.setParam('fm', this.fm);
}

ESMO.prototype = {
	sampleRate: 44100,
	frequency: 440,
	oscillators: null,
	spacing: null,
	fm: 0.0,

	createOscillators: function () {
		var i;

		this.oscillators = [];

		for (i=0; i<this.spacing.length; i++) {
			o = audioLib.Oscillator(this.sampleRate, this.frequency);
			o.spacing = this.spacing[i];
			this.oscillators.push(o);
			
			if (this.spacing[i]) {
				o = audioLib.Oscillator(this.sampleRate, this.frequency);
				o.spacing = -this.spacing[i];
				this.oscillators.push(o);
			}
		}
	},

	setParam: function (param, value) {
		var i;
		switch (param) {
		case 'fm':
			for (i=0; i<this.oscillators.length; i++) {
				this.oscillators[i].setParam(param, this.oscillators[i].spacing + value);
			}

			break;
		default:
			for (i=0; i<this.oscillators.length; i++) {
				this.oscillators[i].setParam(param, value);
			}
		}

		this[param] = value;
	},

	generate: function () {
		for (var i=0; i<this.oscillators.length; i++) {
			this.oscillators[i].generate();
		}
	},

	getMix: function (c) {
		for (var i=0, s=0; i<this.oscillators.length; i++) {
			s += this.oscillators[i].getMix(c);
		}

		return s;
	},
};
