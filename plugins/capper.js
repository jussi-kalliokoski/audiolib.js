(function myPlugin(){

function initPlugin(audioLib){

(function(audioLib){

function Capper(sampleRate, cap){
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

audioLib.effects('Capper', Capper);
audioLib.Capper = Capper;

}(audioLib));
audioLib.plugins('Capper', myPlugin);
}

if (typeof audioLib === 'undefined' && typeof exports !== 'undefined'){
	exports.init = initPlugin;
} else {
	initPlugin(audioLib);
}

}());
