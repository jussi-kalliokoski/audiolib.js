(function(){
function inject(){
	var	args	= arguments,
		l	= args.length,
		code, i;
	for (i=0; i<l; i++){
		code = args[i];
		this.postMessage({type: 'injection', code: code instanceof Function ? '(' + String(code) + ').call(this);' : code });
	}
}

audioLib.AudioWorker = function(code, injectable){
	var	blob	= new (window.MozBlobBuilder || window.BlobBuilder)(),
		url, worker;
	blob.append('var audioLib = (' + String(AUDIOLIB) + '(this, Math, Object, Array));\n');
	for (url = 0; url < audioLib.plugins._pluginList.length; url++){
		blob.append('(' + String(audioLib.plugins._pluginList[url]) + '());\n');
	}
	injectable && blob.append('this.addEventListener("message",function(e){e.data&&e.data.type==="injection"&&Function(e.data.code).call(this)}, true);\n');
	blob.append(code instanceof Function ? '(' + String(code) + ').call(this);' : code);
	url	= window.URL.createObjectURL(blob.getBlob());
	worker	= new Worker(url);
	worker._terminate	= worker.terminate;
	worker.terminate	= function(){
		window.URL.revokeObjectURL(id);
		return worker._terminate.call(worker, arguments);
	};
	if (injectable){
		worker.inject = inject;
	}
	return worker;
};

}());
