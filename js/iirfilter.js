// Adapted from Corban Brook's dsp.js

function IIRFilter(samplerate, cutoff, resonance){
	this.cutoff = !cutoff ? 20000 : cutoff; // > 40
	this.resonance = !resonance ? 0.1 : resonance; // 0.0 - 1.0
	this.samplerate = samplerate;
	var	self	= this,
		f	= [0.0, 0.0, 0.0, 0.0],
		freq, damp,
		prevCut, prevReso,

		sin	= Math.sin,
		min	= Math.min,
		pow	= Math.pow;

	function calcCoeff(){
		freq = 2 * sin(Math.PI * min(0.25, self.cutoff / (self.samplerate * 2)));
		damp = min(2 * (1 - pow(self.resonance, 0.25)), min(2, 2 / freq - freq * 0.5));
	}

	this.pushSample = function(sample){
		if (prevCut !== this.cutoff || prevReso !== this.resonance){
			calcCoeff();
			prevCut = this.cutoff;
			prevReso = this.resonance;
		}

		f[3] = sample - damp * f[2];
		f[0] = f[0] + freq * f[2];
		f[1] = f[3] - f[0];
		f[2] = freq * f[1] + f[2];

		f[3] = sample - damp * f[2];
		f[0] = f[0] + freq * f[2];
		f[1] = f[3] - f[0];
		f[2] = freq * f[1] + f[2];
		
	};

	this.getMix = function(type){
		return f[type];
	};
}
