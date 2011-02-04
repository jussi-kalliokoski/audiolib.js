function ADSREnvelope(sampleRate, attack, decay, sustain, release){
	this.attack	= attack	|| 50; // ms
	this.decay	= decay		|| 50; // ms
	this.sustain	= sustain	|| 1; // 0.0 - 1.0
	this.release	= release	|| 50; // ms

	this.value = 0;

	var	self	= this,
		state	= 3,
		gate	= false,
		states	= [function(){ // 0: Attack
				self.value += 1000 / self.sampleRate / self.attack;
				if (self.value >= 1){
					state = 1;
				}
			}, function(){ // 1: Decay
				self.value += 1000 / self.sampleRate / self.decay * self.sustain;
				if (self.value <= self.sustain){
					state = 2;
				}
			}, function(){ // 2: Sustain
				self.value = self.sustain.value;
			}, function(){ // 3: Release
				self.value = Math.max(0, self.value - 1000 / self.sampleRate / self.decay);
		}];

	this.generate = function(){
		states[state]();
		return this.value;
	};

	this.triggerGate = function(open){
		gate = open;
		state = gate ? 0 : 3;
	}

	this.sampleRate = sampleRate;
}
