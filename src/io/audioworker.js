(function () {

/* Depends on Sink.inlineWorker */

function inject () {
	var	args	= arguments,
		l	= args.length,
		code, i;
	for (i=0; i<l; i++){
		code = args[i];
		this.postMessage({type: 'injection', code: code instanceof Function ? '(' + String(code) + ').call(this);' : code });
	}
}

audioLib.AudioWorker = function (code, injectable) {
	var	worker	= 'var audioLib=(' + String(AUDIOLIB) + ').call({},this,Math,Object,Array);\n',
		i;

	for (i=0; i < audioLib.plugins._pluginList.length; i++) {
		worker += '(' + String(audioLib.plugins._pluginList[url]) + '());\n';
	}

	if (injectable) {
		worker += 'this.addEventListener("message",function(e){e.data&&e.data.type==="injection"&&Function(e.data.code).call(this)},true);\n';
	}

	worker += (code instanceof Function ? '(' + String(code) + ').call(this);' : code.textContent || code);
	worker = Sink.inlineWorker(worker);

	if (injectable) {
		worker.inject = inject;
	}

	return worker;
};

}());
