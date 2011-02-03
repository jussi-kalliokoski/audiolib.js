// Adapted from Corban Brook's dsp.js

function LP12Filter(samplerate, cutoff, resonance){
	this.cutoff = !cutoff ? 20000 : cutoff; // > 40
	this.resonance = !resonance ? 1 : resonance; // 1 - 20
	this.samplerate = samplerate;
	var	self		= this,
		vibraSpeed	= 0,
		vibraPos	= 0,
		pi2		= Math.PI * 2,
		w, q, r, c,
		prevCut, prevReso;

	function calcCoeff(){
		w = pi2 * self.cutoff / self.samplerate;
		q = 1.0 - w / (2 * (self.resonance + 0.5 / (1.0 + w)) + w - 2);
		r = q * q;
		c = r + 1 - 2 * Math.cos(w) * q;
	}

	this.pushSample = function(sample){
		if (prevCut !== this.cutoff || prevReso !== this.resonance){
			calcCoeff();
			prevCut = this.cutoff;
			prevReso = this.resonance;
		}
		vibraSpeed += (sample - vibraPos) * c;
		vibraPos += vibraSpeed;
		vibraSpeed *= r;
	};

	this.getMix = function(){
		return vibraPos;
	};

	calcCoeff();
}
