// Requires IIRFilter

function Distortion(samplerate)
{
	var	hpf1	= new IIRFilter(samplerate, 720.484),
		lpf1	= new IIRFilter(samplerate, 723.431),
		hpf2	= new IIRFilter(samplerate, 1.0),
		smpl	= 0.0;
	this.gain = 4;
	this.master = 1;
	this.samplerate = samplerate;
	this.pushSample = function(s)
	{
		hpf1.pushSample(s);
		smpl = hpf1.getMix(1) * this.gain;
		smpl = Math.atan(smpl) + smpl;
		if (smpl > 0.4){
			smpl = 0.4;
		} else if (smpl < -0.4) {
			smpl = -0.4;
		}
		lpf1.pushSample(smpl);
		hpf2.pushSample(lpf1.getMix(0));
		smpl = hpf2.getMix(1) * this.master.value;
	};
	this.getMix = function(){
		return smpl;
	};
}
