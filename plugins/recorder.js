(function Recorder () {

function initPlugin (audioLib) {
(function (audioLib) {

var workerContent = '(' + function () {
	var buffers = [];
	var length = 0;
	var sampleRate = 44100;
	var channelCount = 2;

	function config (settings) {
		sampleRate = settings.sampleRate;
		channelCount = settings.channelCount;
	}

	function record (buffer) {
		buffers.push(buffer);
		length += buffer.length;
	}

	function exportWav (type) {
		var buffer = mergeBuffers(buffers, length);
		var dataview = encodeWAV(buffer);
		var audioBlob = new Blob([dataview], { type: type });

		this.postMessage(audioBlob);
	}

	function clear () {
		buffers = [];
		length = 0;
	}

	function mergeBuffers (buffers, length) {
		var result = new Float32Array(length);
		var offset = 0;

		for (var i=0; i<buffers.length; i++) {
			result.set(buffers[i], offset);
			offset += buffers[i].length;
		}

		return result;
	}

	this.onmessage = function (e) {
		switch (e.data.command) {
		case "config":
			config(e.data.data);
			break;
		case "record":
			record(e.data.data);
			break;
		case "export":
			exportWav(e.data.data);
			break;
		case "clear":
			clear();
			break;
		}
	}

	function floatTo16BitPCM (output, offset, input) {
		for (var i=0; i<input.length; i++, offset+=2) {
			var s = Math.max(-1, Math.min(1, input[i]));
			output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
		}
	}

	function writeString (view, offset, string) {
		for (var i=0; i<string.length; i++) {
			view.setUint8(offset + i, string.charCodeAt(i));
		}
	}

	function encodeWAV (samples) {
		var buffer = new ArrayBuffer(44 + samples.length * 2);
		var view = new DataView(buffer);

		/* RIFF identifier */
		writeString(view, 0, 'RIFF');
		/* file length */
		view.setUint32(4, 32 + samples.length * 2, true);
		/* RIFF type */
		writeString(view, 8, 'WAVE');
		/* format chunk identifier */
		writeString(view, 12, 'fmt ');
		/* format chunk length */
		view.setUint32(16, 16, true);
		/* sample format (raw) */
		view.setUint16(20, 1, true);
		/* channel count */
		view.setUint16(22, 2, true);
		/* sample rate */
		view.setUint32(24, sampleRate, true);
		/* byte rate (sample rate * block align) */
		view.setUint32(28, sampleRate * 4, true);
		/* block align (channel count * bytes per sample) */
		view.setUint16(32, 4, true);
		/* bits per sample */
		view.setUint16(34, 16, true);
		/* data chunk identifier */
		writeString(view, 36, 'data');
		/* data chunk length */
		view.setUint32(40, samples.length * 2, true);

		floatTo16BitPCM(view, 44, samples);

		return view;
	}
} + ')();';

function Recorder (sink) {
	this.sink = sink;
	this.worker = Sink.inlineWorker(workerContent);
	this.active = false;
	this.callbacks = [];

	this.worker.onmessage = (function (e) {
		this.callbacks.shift()(e.data);
	}).bind(this);

	this.command('config', {
		sampleRate: sink.sampleRate,
		channelCount: sink.channelCount
	});

	this.sink.on('postprocess', (function (buffer) {
		this.record(buffer);
	}).bind(this))
}

Recorder.prototype = {
	command: function (name, data) {
		this.worker.postMessage({
			command: name,
			data: data
		});
	},

	record: function (buffer) {
		if (!this.active) return;

		this.command('record', buffer);
	},

	start: function () {
		this.active = true;
	},

	stop: function () {
		this.active = false;
	},

	exportWav: function (callback) {
		this.command('export', 'audio/wav');
		this.callbacks.push(callback);
	},

	clear: function () {
		this.command('clear');
	}
};

Sink.prototype.createRecorder = function () {
	return new Recorder(this);
};

}(audioLib));
audioLib.plugins('Recorder', Recorder);
}

if (typeof audioLib === 'undefined' && typeof exports !== 'undefined') {
	exports.init = initPlugin;
} else {
	initPlugin(audioLib);
}

}());
