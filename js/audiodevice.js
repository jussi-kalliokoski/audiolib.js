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
		allowedSampleRates	= propertyEnum([44100, 22050]),

		intToStr		= String.fromCharCode;

	function mozAudioDevice(sampleRate, channelCount, readFn, preBufferSize){
		sampleRate	= allowedSampleRates[sampleRate] ? sampleRate : 44100;
		preBufferSize	= allowedBufferSizes[preBufferSize] ? bufferSize : sampleRate / 2;
		var	self			= this,
			currentWritePosition	= 0,
			tail			= null,
			audioDevice		= new Audio(),
			timer,
			subarray		= (Float32Array.prototype.subarray) ? 'subarray' : 'slice'; // Fix for https://bugzilla.mozilla.org/show_bug.cgi?id=630117

		function bufferFill(){
			var written, currentPosition, available, soundData;
			if (tail){
				written = audioDevice.mozWriteAudio(tail);
				currentWritePosition += written;
				if (written < tail.length){
					tail = tail[subarray](written);
					return tail;
				}
				tail = null;
			}

			currentPosition = audioDevice.mozCurrentSampleOffset();
			available = Number( currentPosition + preBufferSize * channelCount - currentWritePosition) + 0;
			if (available > 0){
				soundData = new Float32Array(available);
				readFn(soundData);
				self.recordData(soundData);
				written = audioDevice.mozWriteAudio(soundData);
				if (written < soundData.length){
					tail = soundData[subarray](written);
				}
				currentWritePosition += written;
			}
		}

		audioDevice.mozSetup(channelCount, sampleRate);
		timer = setInterval(bufferFill, 20);

		this.kill = function(){
			clearInterval(timer);
		};
		this.activeRecordings = [];

		this.sampleRate		= sampleRate;
		this.channelCount	= channelCount;
		this.type		= 'moz';
	}

	function webkitAudioDevice(sampleRate, channelCount, readFn, preBufferSize){
		sampleRate	= allowedSampleRates[sampleRate] ? sampleRate : 44100;
		preBufferSize	= allowedBufferSizes[preBufferSize] ? bufferSize : 8192;
		var	self		= this,
			context		= new (global.AudioContext || global.webkitAudioContext)(sampleRate),
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
			self.recordData(soundData);

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
		this.activeRecordings = [];

		this.sampleRate		= context.sampleRate;
		this.channelCount	= channelCount;
		this.type		= 'webkit';
	}

	function dummyAudioDevice(sampleRate, channelCount, readFn, preBufferSize){
		sampleRate	= allowedSampleRates[sampleRate] ? sampleRate : 44100;
		preBufferSize	= allowedBufferSizes[preBufferSize] ? bufferSize : 8192;
		var 	self		= this,
			arrayType	= window.Float32Array || Array,
			timer;

		function bufferFill(){
			var	soundData = new arrayType(preBufferSize);
			readFn(soundData);
			self.recordData(soundData);
		}

		this.kill = function(){
			clearInterval(timer);
		}
		this.activeRecordings = [];

		setInterval(bufferFill, preBufferSize / sampleRate * 1000);

		this.sampleRate		= sampleRate;
		this.channelCount	= channelCount;
		this.type		= 'dummy';
	}

	function AudioDevice(sampleRate, channelCount, readFn, preBufferSize){
		try{
			return new mozAudioDevice(sampleRate, channelCount, readFn, preBufferSize);
		}catch(e1){}
		
		try{
			return new webkitAudioDevice(sampleRate, channelCount, readFn, preBufferSize);
		}catch(e2){}

		if (AudioDevice.dummy){
			return new dummyAudioDevice(sampleRate, channelCount, readFn, preBufferSize);
		}

		throw "No audio device available.";
	}

	function intToString(integ, length){
		return length ? intToStr(integ & 255) + intToString(integ >> 8, length - 1) : '';
	}

	function arrayToWav(input, sampleRate, channelCount, bitsPerSample){
		sampleRate = sampleRate || 44100;
		channelCount = channelCount || 1;
		bitsPerSample = bitsPerSample || 8;

		var	bytesPerSample	= bitsPerSample / 8,
			byteRate	= sampleRate * blockAlign,
			blockAlign	= channelCount * bytesPerSample,
			length		= input.length,
			sampleSize	= Math.pow(2, bitsPerSample) - 1,
			head,
			i, n, m,
			data		= '',
			chunk		= '';

		function sampleToString(sample){
			return intToString(Math.floor((sample + 1) * sampleSize / 2), bytesPerSample);
		}
		// Create wave header
		head =	'WAVEfmt ' +
			intToString(16, 4) +
			intToString(1, 2) +
			intToString(channelCount, 2) +
			intToString(sampleRate, 4) +
			intToString(byteRate, 4) +
			intToString(blockAlign, 2) +
			intToString(bitsPerSample, 2);
		data = 'RIFF' + intToString(head.length, 4) + head;

		for (i=0, n=0; i<length; i++, n = (n+1)%65500){
			if (!n){
				if (i){
					data += chunk;
				}
				chunk = 'data' + intToString( length - i > 65500 ? 65500 : length - i, 4 );
			}
			chunk += sampleToString(input[i]);
		}
		data += chunk;
		return data;
	}

	function Recording(bindTo){
		this.boundTo = bindTo;
		this.buffers = [];
		bindTo.activeRecordings.push(this);
	}

	Recording.prototype = {
		toWav: function(){
			return arrayToWav(this.join(), this.boundTo.sampleRate, this.boundTo.channelCount);
		}, add: function(buffer){
			this.buffers.push(buffer);
		}, clear: function(){
			this.buffers = [];
		}, stop: function(){
			var	recordings = this.boundTo.activeRecordings,
				i;
			for (i=0; i<recordings.length; i++){
				if (recordings[i] === this){
					recordings.splice(i--, 1);
				}
			}
		}, join: function(){
			var	arrayType	= window.Float32Array || Array,
				bufferLength	= 0,
				bufPos		= 0,
				buffers		= this.buffers,
				newArray,
				n, i, l		= buffers.length;

			for (i=0; i<l; i++){
				bufferLength += buffers[i].length;
			}
			newArray = new arrayType(bufferLength);
			for (i=0; i<l; i++){
				for (n=0; n<buffers[i].length; n++){
					newArray[bufPos + n] = buffers[i][n];
				}
				bufPos += buffers[i].length;
			}
			return newArray;
		}
	};

	mozAudioDevice.prototype = webkitAudioDevice.prototype = dummyAudioDevice.prototype = {
		record: function(){
			return new Recording(this);
		}, recordData: function(buffer){
			var	activeRecs	= this.activeRecordings,
				i, l		= activeRecs.length;
			for (i=0; i<l; i++){
				activeRecs[i].add(buffer);
			}
		}
	};

	AudioDevice.dummy = false;
	AudioDevice.arrayToWav = arrayToWav;
	AudioDevice.integerToString = intToString;
	AudioDevice.createDummy = function(a,b,c,d){ return new dummyAudioDevice(a,b,c,d); };

	global.AudioDevice = AudioDevice;
}(this));
