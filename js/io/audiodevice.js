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
		allowedSampleRates	= propertyEnum([48000, 44100, 22050]),

		intToStr		= String.fromCharCode;

	function mozAudioDevice(readFn, channelCount, preBufferSize, sampleRate){
		sampleRate	= allowedSampleRates[sampleRate] ? sampleRate : 44100;
		preBufferSize	= allowedBufferSizes[preBufferSize] ? bufferSize : sampleRate / 2;
		var	self			= this,
			currentWritePosition	= 0,
			tail			= null,
			audioDevice		= new Audio(),
			timer; // Fix for https://bugzilla.mozilla.org/show_bug.cgi?id=630117

		function bufferFill(){
			var written, currentPosition, available, soundData;
			if (tail){
				written = audioDevice.mozWriteAudio(tail);
				currentWritePosition += written;
				if (written < tail.length){
					tail = tail.subarray(written);
					return tail;
				}
				tail = null;
			}

			currentPosition = audioDevice.mozCurrentSampleOffset();
			available = Number( currentPosition + preBufferSize * channelCount - currentWritePosition) + 0;
			if (available > 0){
				soundData = new Float32Array(available);
				readFn(soundData, self.channelCount);
				self.recordData(soundData);
				written = audioDevice.mozWriteAudio(soundData);
				if (written < soundData.length){
					tail = soundData.subarray(written);
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

	function webkitAudioDevice(readFn, channelCount, preBufferSize, sampleRate){
		sampleRate	= allowedSampleRates[sampleRate] ? sampleRate : 44100;
		preBufferSize	= allowedBufferSizes[preBufferSize] ? bufferSize : 4096;
		var	self		= this,
			context		= new (window.AudioContext || webkitAudioContext)(),
			node		= context.createJavaScriptNode(preBufferSize, 0, channelCount),
			// For now, we have to accept that the AudioContext is at 48000Hz, or whatever it decides, and that we have to use a dummy buffer source.
			inputBuffer	= context.createBufferSource(/* sampleRate */);

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

			readFn(soundData, channelCount);
			self.recordData(soundData);

			for (i=0; i<l; i++){
				for (n=0; n < channelCount; n++){
					channels[n][i] = soundData[i * channelCount + n];
				}
			}
		}

		node.onaudioprocess = bufferFill;
		// Connect the dummy buffer to the JS node to get a push.
		inputBuffer.connect(node);
		node.connect(context.destination);

		this.kill = function(){
			// ??? I have no idea how to do this.
		};
		this.activeRecordings = [];

		this.sampleRate		= context.sampleRate;
		this.channelCount	= channelCount;
		this.type		= 'webkit';
	}

	function dummyAudioDevice(readFn, channelCount, preBufferSize, sampleRate){
		sampleRate	= allowedSampleRates[sampleRate] ? sampleRate : 44100;
		preBufferSize	= allowedBufferSizes[preBufferSize] ? bufferSize : 8192;
		var 	self		= this,
			timer;

		function bufferFill(){
			var	soundData = new Float32Array(preBufferSize * channelCount);
			readFn(soundData, self.channelCount);
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
/**
 * Creates an AudioDevice according to specified parameters, if possible.
 *
 * @param {Function} readFn A callback to handle the buffer fills.
 * @param {number} channelCount Channel count.
 * @param {number} preBufferSize (Optional) Specifies a pre-buffer size to control the amount of latency.
 * @param {number} sampleRate Sample rate (ms).
*/
	function AudioDevice(readFn, channelCount, preBufferSize, sampleRate){
		try{
			return new mozAudioDevice(readFn, channelCount, preBufferSize, sampleRate);
		}catch(e1){}
		
		try{
			return new webkitAudioDevice(readFn, channelCount, preBufferSize, sampleRate);
		}catch(e2){}

		if (AudioDevice.dummy){
			return new dummyAudioDevice(readFn, channelCount, preBufferSize, sampleRate);
		}

		throw "No audio device available.";
	}

/**
 * Converts an integer to binary data.
 *
 * @param {number} integ The number to convert.
 * @param {number} length The byte count of the outputted data.
 * return {String} Binary data.
*/
	function intToString(integ, length){
		return length ? intToStr(integ & 255) + intToString(integ >> 8, length - 1) : '';
	}

/**
 * Converts an array to PCM data.
 *
 * @param {Array} input The array containing the wave data.
 * @param {number} sampleRate (Optional) Sample Rate (ms) of the outputted data.
 * @param {number} channelCount (Optional) The number of channels of the outputted data.
 * @param {number} bytesPerSample (Optional) The number of bytes per sample of the outputted data.
 * @return {String} PCM wave data.
*/

	function arrayToWav(input, sampleRate, channelCount, bytesPerSample){
		sampleRate = sampleRate || 44100;
		channelCount = channelCount || 1;
		bytesPerSample = bytesPerSample || 1;

		var	bitsPerSample	= bytesPerSample * 8,
			blockAlign	= channelCount * bytesPerSample,
			byteRate	= sampleRate * blockAlign,
			length		= input.length,
			dLength		= length * bytesPerSample,
			silencePadding	= (Math.pow(2, bitsPerSample) - 1) / 2,
			sampleSize	= bytesPerSample === 2 ? 32760 : silencePadding,
			head,
			i, n, m,
			data		= '',
			chunk		= '';


		function sampleToString(sample){
			return intToString(Math.floor(silencePadding + sample * sampleSize), bytesPerSample);
		}
		// Create wave header
		data =	'RIFF' +			// sGroupID		4 bytes		char
			intToString(36 + dLength, 4) +	// dwFileLength		4 bytes		uint
			'WAVE' +			// sRiffType		4 bytes		char
			'fmt ' +			// sGroupId		4 bytes		char
			intToString(16, 4) +		// dwChunkSize		4 bytes		uint
			intToString(1, 2) +		// wFormatTag		2 bytes		ushort
			intToString(channelCount, 2) +	// wChannels		2 bytes		ushort
			intToString(sampleRate, 4) +	// dwSamplesPerSec	4 bytes		uint
			intToString(byteRate, 4) +	// dwAvgBytesPerSec	4 bytes		uint
			intToString(blockAlign, 2) +	// wBlockAlign		2 bytes		ushort
			intToString(bitsPerSample, 2) +	// dwBitsPerSample	2 bytes		uint
			'data' +			// sGroupId		4 bytes		char
			intToString(dLength, 4);	// dwChunkSize		4 bytes		uint

		for (i=0; i<length; i++){
			data += sampleToString(input[i]);
		}
		return data;
	}

	function Recording(bindTo){
		this.boundTo = bindTo;
		this.buffers = [];
		bindTo.activeRecordings.push(this);
	}

	Recording.prototype = {
		toWav: function(bytesPerSample){
			return arrayToWav(this.join(), this.boundTo.sampleRate, this.boundTo.channelCount, bytesPerSample);
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
			var	bufferLength	= 0,
				bufPos		= 0,
				buffers		= this.buffers,
				newArray,
				n, i, l		= buffers.length;

			for (i=0; i<l; i++){
				bufferLength += buffers[i].length;
			}
			newArray = new Float32Array(bufferLength);
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

/**
 * {Boolean} Determines whether to use a dummy audio device if no supported API is present.
*/
	AudioDevice.dummy = false;
	AudioDevice.arrayToWav = arrayToWav;
	AudioDevice.integerToString = intToString;
	AudioDevice.createDummy = function(a,b,c,d){ return new dummyAudioDevice(a,b,c,d); };

	global.AudioDevice = AudioDevice;
}(this));
