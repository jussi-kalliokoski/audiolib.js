(function myPlugin(){

function initPlugin(audioLib){
(function(audioLib){

function Expo(sampleRate, param){
	var	self	= this,
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

}(audioLib));

audioLib.Expo = Expo;
audioLib.effects(Expo);

audioLib.plugins('Expo', myPlugin);
}

if (typeof audioLib === 'undefined' && typeof exports !== 'undefined'){
	exports.init = initPlugin;
} else {
	initPlugin(audioLib);
}

}());
