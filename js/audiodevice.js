(function (global){
	function propertyEnum(arr){
		var	i, l	= arr.length,
			result	= {};
		for (i=0; i<l; i++){
			result[arr[i]] = true;
		}
		return result;
	}

	var	allowedBufferSizes	= propertyEnum([256, 512, 1024, 2048, 4096, 8192, 16384]),
		allowedSampleRates	= propertyEnum([44100, 22050]);

	function mozAudioDevice(sampleRate, channelCount, readFn, preBufferSize){
		sampleRate	= allowedSampleRates[sampleRate] ? sampleRate : 44100;
		preBufferSize	= allowedBufferSizes[preBufferSize] ? bufferSize : sampleRate / 2;
		var	currentWritePosition	= 0,
			tail			= null,
			audioDevice		= new Audio(),
			timer;

		function bufferFill(){
			var written, currentPosition, available, soundData;
			if (tail){
				written = audioDevice.mozWriteAudio(tail);
				currentWritePosition += written;
				if (written < tail.length){
					tail = tail.slice(written);
					return tail;
				}
				tail = null;
			}

			currentPosition = audioDevice.mozCurrentSampleOffset();
			available = Number( currentPosition + preBufferSize * channelCount - currentWritePosition) + 0;
			if (available > 0){
				soundData = new Float32Array(available);
				readFn(soundData);
				written = audioDevice.mozWriteAudio(soundData);
				if (written < soundData.length){
					tail = soundData.slice(written);
				}
				currentWritePosition += written;
			}
		}

		audioDevice.mozSetup(channelCount, sampleRate);
		timer = setInterval(bufferFill, 20);

		this.kill = function(){
			clearInterval(timer);
		};

		this.sampleRate = sampleRate;
	}

	function webkitAudioDevice(sampleRate, channelCount, readFn, preBufferSize){
		sampleRate	= allowedSampleRates[sampleRate] ? sampleRate : 44100;
		preBufferSize	= allowedBufferSizes[preBufferSize] ? bufferSize : 8192;
		var	context		= new (global.AudioContext || global.webkitAudioContext)(sampleRate),
			node		= context.createJavaScriptNode(4096, 0, channelCount);

		function bufferFill(e){
			var	outputBuffer	= e.outputBuffer,
				channelCount	= outputBuffer.numberOfChannels,
				i, n, l		= outputBuffer.length,
				size		= outputBuffer.size,
				channels	= new Array(channelCount),
				soundData	= new Float32Array(l * channelCount);

			for (i=0; i<channelCount; i++){
				channels[i] = outputBuffer.getChannelData(i);
			}

			readFn(soundData);

			for (i=0; i<l; i++){
				for (n=0; n < channelCount; n++){
					channels[n][i] = soundData[i * channelCount + n];
				}
			}
		}

		node.onaudioprocess = bufferFill;
		node.connect(context.destination);

		this.kill = function(){
			// ??? I have no idea how to do this.
		};

		this.sampleRate = context.sampleRate;
	}

	function AudioDevice(sampleRate, channelCount, readFn, preBufferSize){
		try{
			return new mozAudioDevice(sampleRate, channelCount, readFn, preBufferSize);
		}catch(e1){}
		
		try{
			return new webkitAudioDevice(sampleRate, channelCount, readFn, preBufferSize);
		}catch(e2){}
		throw "No audio device available.";
	}

	global.AudioDevice = AudioDevice;
}(this));
