(function myPlugin(){

function initPlugin(audioLib){
(function(audioLib){

	// create the plugin, etc...
	// all your code comes inside this function

}(audioLib));
audioLib.plugins('myPlugin' /* insert your plugin name here instead */ , myPlugin);
}

if (typeof audioLib === 'undefined' && typeof exports !== 'undefined'){
	exports.init = initPlugin;
} else {
	initPlugin(audioLib);
}

}());
