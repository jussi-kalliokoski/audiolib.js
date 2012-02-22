/**
 * Creates a IIRFilter effect.
 * Adapted from Corban Brook's dsp.js
 * 
 * @effect
 *
 * @arg =!sampleRate
 * @arg =!cutoff
 * @arg =!resonance
 * @arg =!type
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:Float units:Hz min:40.0 default:20000 cutoff The cutoff frequency of the IIRFilter.
 * @param type:Float min:0.0 max:1.0 default:0.1 resonance The resonance of the IIRFilter.
 * @param type:UInt default:0 type The type of the filter (LowPass, HighPass, BandPass, Notch).
*/
function IIRFilter (sampleRate, cutoff, resonance, type) {
	var	self	= this,
		f	= [0.0, 0.0, 0.0, 0.0],
		freq, damp,
		prevCut, prevReso,

		sin	= Math.sin,
		min	= Math.min,
		pow	= Math.pow;

	self.cutoff = isNaN(cutoff) ? 20000 : cutoff; // > 40
	self.resonance = !resonance ? 0.1 : resonance; // 0.0 - 1.0
	self.samplerate = isNaN(sampleRate) ? 44100 : sampleRate;
	self.type = type || 0;

	function calcCoeff () {
		freq = 2 * sin(Math.PI * min(0.25, self.cutoff / (self.samplerate * 2)));
		damp = min(2 * (1 - pow(self.resonance, 0.25)), min(2, 2 / freq - freq * 0.5));
	}

	self.pushSample = function (sample) {
		if (prevCut !== self.cutoff || prevReso !== self.resonance){
			calcCoeff();
			prevCut = self.cutoff;
			prevReso = self.resonance;
		}

		f[3] = sample - damp * f[2];
		f[0] = f[0] + freq * f[2];
		f[1] = f[3] - f[0];
		f[2] = freq * f[1] + f[2];

		f[3] = sample - damp * f[2];
		f[0] = f[0] + freq * f[2];
		f[1] = f[3] - f[0];
		f[2] = freq * f[1] + f[2];

		return f[self.type];
	};

	self.getMix = function (type) {
		return f[type || self.type];
	};
}
