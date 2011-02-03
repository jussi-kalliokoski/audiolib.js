// A simple and fast low pass filter. Also low quality...

function LowPassFilter(samplerate, freq, reso){
	var	smpl	= [0.0, 0.0];
	this.cutoff	= !freq ? 20000 : freq; // > 40
	this.resonance	= !reso ? 0.0 : reso; // 0.0 - 1.0
	this.samplerate	= samplerate;

	this.pushSample = function(s){
		var	cut_lp	= this.cutoff * 2 / this.samplerate,
			fb_lp	= this.resonance + this.resonance / (1-cut_lp);
		smpl[0] = smpl[0] + cut_lp * (s - smpl[0] + fb_lp * (smpl[0] - smpl[1]));
		smpl[1] = smpl[1] + cut_lp * (smpl[0] - smpl[1]);
	};

	this.getMix = function(){
		return smpl[1];
	};
}
