function Oscillator(samplerate, freq)
{
	var	phase		= 0,
		p		= 0,
		FullPI		= Math.PI * 2,
		wavetable	= new Float32Array(1),
		waveShapes;

	this.frequency = 440;
	if (freq){
		this.frequency = freq;
	}
	this.phaseOffset = 0;
	this.pulseWidth = 0.5;
	this.waveShape = 0; // ['Sine', 'Triangle', 'Pulse', 'Sawtooth', 'Invert Sawtooth', 'Square']
	this.samplerate = samplerate;
	this.generate = function(/* FM1, FM2, ... FMX */){
		var	f	= this.frequency + 0,
			pw	= this.pulseWidth,
			i, l	= arguments.length;
		for (i=0; i<l; i++){
			f += f * arguments[i];
		}
		phase += f / this.samplerate / 2;
		phase = phase % 1;
		p = (phase + this.phaseOffset) % 1;
		if (p < pw){
			p = p / pw;
		} else {
			p = (p-pw) / (1-pw);
		}
	};
	this.getMix = function(){
		return waveShapes[this.waveShape]();
	};
	this.getPhase = function(){
		return p;
	}; // For prototype extensions, otherwise use the p variable
	this.reset = function(){
		phase = 0.0;
	};
	this.setWavetable = function(wt){
		if (!wt instanceof Float32Array){
			return false;
		}
		wavetable = wt.slice(0);
		return true;
	};
	this.sine = function(){
		return Math.sin(p * FullPI);
	};
	this.triangle = function(){
		var p1 = (p + 0.25) % 1;
		if (p1 < 0.5){
			return 4 * p1 - 1;
		}
		return 3 - 4 * p1;
	};
	this.square = function(){
		return (p < 0.5) ? -1 : 1;
	};
	this.sawtooth = function(){
		var p2 = (p + 0.5) % 1;
		return 1 - p2 * 2;
	};
	this.invSawtooth = function(){
		var p2 = (p + 0.5) % 1;
		return p2 * 2 - 1;
	};
	this.pulse = function(){
		if (p < 0.5){
			if (p < 0.25){
				return p * 8 - 1;
			} else {
				return 1 - (p - 0.25) * 8;
			}
		}
		return -1;
	};
	this.wavetable = function(){
		return wavetable[Math.floor(p * wavetable.length)];
	};

	waveShapes = this.waveShapes = [this.sine, this.triangle, this.pulse, this.sawtooth, this.invSawtooth, this.square];
}
