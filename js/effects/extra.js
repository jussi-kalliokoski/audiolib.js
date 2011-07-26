(function(global, audioLib){

audioLib.Capper = function(sampleRate, cap){
	var	self	= this,
		sample	= 0.0;
	self.sampleRate = sampleRate;
	self.cap = cap || 1;
	self.pushSample = function(s){
		sample = s > self.cap ? 2 * self.cap - s : s < -self.cap ? -2 * self.cap - s : s;
		return sample;
	};
	self.getMix = function(){
		return sample;
	};
};

audioLib.Expo = function(sampleRate, param){
	var	self	= this;
		sample	= 0.0;
	self.sampleRate = sampleRate;
	self.param = param || 0.8;
	self.pushSample = function(s){
		sample = (s < 0 ? -Math.pow(self.param * 2, -s) : Math.pow(self.param * 2, s) ) / 10;
		return sample;
	};
	self.getMix = function(){
		return sample;
	};
}

audioLib.Compressor = function(sampleRate, scaleBy, gain){
    var self    = this;
        sample  = 0.0;
    self.sampleRate = sampleRate;
    self.scale = scaleBy || 1;
    self.gain = gain || 0.5;
    self.pushSample = function(s){
        s /= self.scale;
        sample = (1+self.gain)*s - self.gain*s*s*s;
        return sample;
    };
    self.getMix = function(){
        return sample;
    };

}

}(this, audioLib));
