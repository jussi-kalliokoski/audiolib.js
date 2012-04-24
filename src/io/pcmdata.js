/*
pcmdata.js
Uses binary.js and stream.js to parse PCM wave data.
On GitHub:
 * pcmdata.js	http://goo.gl/4uu06
 * binary.js	http://goo.gl/ZaWqK

binary.js repository also includes stream.js

MIT License
*/

(function (global, Math) {

	var	fromCharCode	= String.fromCharCode,
		// the following two aren't really *performance optimization*, but compression optimization.
		y		= true,
		n		= false;

	function convertToBinaryLE (num, size) {
		return size ? fromCharCode(num & 255) + convertToBinaryLE(num >> 8, size - 1) : '';
	}

	function convertToBinaryBE (num, size) { // I don't think this is right
		return size ? convertToBinaryBE(num >> 8, size - 1) + fromCharCode(255 - num & 255) : '';
	}

	function convertToBinary (num, size, bigEndian) {
		return bigEndian ? convertToBinaryBE(num, size) : convertToBinaryLE(num, size);
	}

	function convertFromBinary (str, bigEndian) {
		var	l	= str.length,
			last	= l - 1,
			n	= 0,
			pow	= Math.pow,
			i;
		if (bigEndian) {
			for (i=0; i<l; i++) {
				n += (255 - str.charCodeAt(i)) * pow(256, last - i);
			}
		} else {
			for (i=0; i < l; i++) {
				n += str.charCodeAt(i) * pow(256, i);
			}
		}
		return n;
	}

	// The main function creates all the functions used.
	function Binary (bitCount, signed, /* false === unsigned */ isQ, from /* false === to */) {

		// This is all just for major optimization benefits.
		var	pow			= Math.pow,
			floor			= Math.floor,
			convertFromBinary	= Binary.convertFromBinary,
			convertToBinary		= Binary.convertToBinary,
			byteCount		= bitCount / 8,
			bitMask			= pow(2, bitCount),
			semiMask		= bitMask / 2,
			intMask			= semiMask - 1,
			invSemiMask		= 1 / semiMask,
			invIntMask		= 1 / intMask;

		return from ?
			isQ ?
				signed ? function (num, bigEndian) {
					num = floor(num < 0 ? num * semiMask + bitMask : num * intMask);
					return convertToBinary(
						num,
						byteCount,
						bigEndian
					);
				} : function (num, bigEndian) {
					return convertToBinary(
						floor(num * intMask),
						byteCount,
						bigEndian
					);
				}
			:
				signed ? function (num, bigEndian) {
					return convertToBinary(
						num < 0 ? num + bitMask : num,
						byteCount,
						bigEndian
					);
				} : function (num, bigEndian) {
					return convertToBinary(
						num,
						byteCount,
						bigEndian
					);
				}
		:
			isQ ?
				signed ? function (str, bigEndian) {
					var num = convertFromBinary(str, bigEndian);
					return num > intMask ? (num - bitMask) * invSemiMask : num * invIntMask;
				} : function (str, bigEndian) {
					return convertFromBinary(str, bigEndian) * invIntMask;
				}
			:
				signed ? function (str, bigEndian) {
					var num = convertFromBinary(str, bigEndian);
					return num > intMask ? num - bitMask : num;
				} : function (str, bigEndian) {
					return convertFromBinary(str, bigEndian);
				};
	}

	Binary.convertToBinary		= convertToBinary;
	Binary.convertFromBinary	= convertFromBinary;
	// these are deprecated because JS doesn't support 64 bit uint, so the conversion can't be performed.
/*
	Binary.fromQ64			= Binary(64, y, y, y);
	Binary.toQ64			= Binary(64, y, y, n);
*/
	Binary.fromQ32			= Binary(32, y, y, y);
	Binary.toQ32			= Binary(32, y, y, n);
	Binary.fromQ24			= Binary(24, y, y, y);
	Binary.toQ24			= Binary(24, y, y, n);
	Binary.fromQ16			= Binary(16, y, y, y);
	Binary.toQ16			= Binary(16, y, y, n);
	Binary.fromQ8			= Binary( 8, y, y, y);
	Binary.toQ8			= Binary( 8, y, y, n);
	Binary.fromInt32		= Binary(32, y, n, y);
	Binary.toInt32			= Binary(32, y, n, n);
	Binary.fromInt16		= Binary(16, y, n, y);
	Binary.toInt16			= Binary(16, y, n, n);
	Binary.fromInt8			= Binary( 8, y, n, y);
	Binary.toInt8			= Binary( 8, y, n, n);
	Binary.fromUint32		= Binary(32, n, n, y);
	Binary.toUint32			= Binary(32, n, n, n);
	Binary.fromUint16		= Binary(16, n, n, y);
	Binary.toUint16			= Binary(16, n, n, n);
	Binary.fromUint8		= Binary( 8, n, n, y);
	Binary.toUint8			= Binary( 8, n, n, n);

	global.Binary = Binary;
}(this, Math));
(function (global, Binary) {

function Stream (data) {
	this.data = data;
}

var	proto	= Stream.prototype = {
		read:		function (length) {
			var	self	= this,
				data	= self.data.substr(0, length);
			self.skip(length);
			return data;
		},
		skip:		function (length) {
			var	self	= this,
				data	= self.data	= self.data.substr(length);
			self.pointer	+= length;
			return data.length;
		},
		readBuffer:	function (buffer, bitCount, type) {
			var	self		= this,
				converter	= 'read' + type + bitCount,
				byteCount	= bitCount / 8,
				l		= buffer.length,
				i		= 0;
			while (self.data && i < l) {
				buffer[i++] = self[converter]();
			}
			return i;
		}
	},
	i, match;

function newType (type, bitCount, fn) {
	var	l	= bitCount / 8;
	proto['read' + type + bitCount] = function (bigEndian) {
		return fn(this.read(l), bigEndian);
	};
}

for (i in Binary) {
	match	= /to([a-z]+)([0-9]+)/i.exec(i);
	if (match) newType(match[1], match[2], Binary[i]);
}

global.Stream	= Stream;
Stream.newType	= newType;

}(this, this.Binary));
this.PCMData = (function (Binary, Stream) {

var ByteArray = typeof Uint8Array === 'undefined' ? Array : Uint8Array;

function PCMData (data) {
	return (typeof data === 'string' ? PCMData.decode : PCMData.encode)(data);
}

PCMData.decodeFrame = function (frame, bitCount, result) {
	if (bitCount === 8) {
		var buffer	= new ByteArray(result.length);
		(new Stream(frame)).readBuffer(buffer, 8, 'Uint');
		for (bitCount=0; bitCount<result.length; bitCount++) {
			result[bitCount] = (buffer[bitCount] - 127.5) * 127.5;
		}
	} else {
		(new Stream(frame)).readBuffer(result, bitCount, 'Q');
	}
	return result;
};

PCMData.encodeFrame = function (frame, bitCount) {
	var	properWriter	= Binary[(bitCount === 8 ? 'fromUint' : 'fromQ') + bitCount],
		l		= frame.length,
		r		= '',
		i;
	if (bitCount === 8) {
		for (i=0; i<l; i++) {
			r += properWriter(frame[i] * 127.5 + 127.5);
		}
	} else {
		for (i=0; i<l; i++) {
			r += properWriter(frame[i]);
		}
	}
	return r;
};

PCMData.decode = function (data, asyncCallback) {
	var	stream			= new Stream(data),
		sGroupID1		= stream.read(4),
		dwFileLength		= stream.readUint32();
		stream			= new Stream(stream.read(dwFileLength));
	var	sRiffType		= stream.read(4),
		sGroupID2		= stream.read(4),
		dwChunkSize1		= stream.readUint32(),
		formatChunk		= new Stream(stream.read(dwChunkSize1)),
		wFormatTag		= formatChunk.readUint16(),
		wChannels		= formatChunk.readUint16(),
		dwSamplesPerSec		= formatChunk.readUint32(),
		dwAvgBytesPerSec	= formatChunk.readUint32(),
		wBlockAlign		= formatChunk.readUint16(),
		sampleSize		= wBlockAlign / wChannels,
		dwBitsPerSample		= /* dwChunkSize1 === 16 ? */ formatChunk.readUint16() /* : formatChunk.readUint32() */,
		sGroupID,
		dwChunkSize,
		sampleCount,
		chunkData,
		samples,
		dataTypeList,
		i,
		chunks	= {},
		output	= {
			channelCount:	wChannels,
			bytesPerSample:	wBlockAlign / wChannels,
			sampleRate:	dwAvgBytesPerSec / wBlockAlign,
			chunks:		chunks,
			data:		samples
		};

	function readChunk () {
		sGroupID		= stream.read(4);
		dwChunkSize		= stream.readUint32();
		chunkData		= stream.read(dwChunkSize);
		dataTypeList		= chunks[sGroupID] = chunks[sGroupID] || [];

		if (sGroupID === 'data') {
			sampleCount		= ~~(dwChunkSize / sampleSize);
			samples			= output.data = new Float32Array(sampleCount);
			PCMData.decodeFrame(chunkData, sampleSize * 8, samples);
		} else {
			dataTypeList.push(chunkData);
		}

		if (!asyncCallback) return;

		if (stream.data) {
			setTimeout(readChunk, 1);
		} else {
			asyncCallback(output);
		}
	}

	if (asyncCallback) {
		if (stream.data) {
			readChunk();
		} else {
			asyncCallback(output);
		}
	} else {
		while (stream.data) {
			readChunk();
		}
	}

	return output;
};

PCMData.encode = function (data, asyncCallback) {
	var	
		dWord		= Binary.fromUint32,
		sWord		= Binary.fromUint16,
		samples		= data.data,
		sampleRate	= data.sampleRate,
		channelCount	= data.channelCount || 1,
		bytesPerSample	= data.bytesPerSample || 1,
		bitsPerSample	= bytesPerSample * 8,
		blockAlign	= channelCount * bytesPerSample,
		byteRate	= sampleRate * blockAlign,
		length		= samples.length,
		dLength		= length * bytesPerSample,
		padding		= Math.pow(2, bitsPerSample - 1) - 1,
		chunks		= [],
		chunk		= '',
		chunkType,
		i, n, chunkData;

		
		chunks.push(
			'fmt '				+	// sGroupID		4 bytes		char[4]
			dWord(16)			+	// dwChunkSize		4 bytes		uint32 / dword
			sWord(1)			+	// wFormatTag		2 bytes		uint16 / ushort
			sWord(channelCount)		+	// wChannels		2 bytes		uint16 / ushort
			dWord(sampleRate)		+	// dwSamplesPerSec	4 bytes		uint32 / dword
			dWord(byteRate)			+	// dwAvgBytesPerSec	4 bytes		uint32 / dword
			sWord(blockAlign)		+	// wBlockAlign		2 bytes		uint16 / ushort
			sWord(bitsPerSample)			// dwBitsPerSample	2 or 4 bytes	uint32 / dword OR uint16 / ushort
		);

		chunks.push(
			'data'				+	// sGroupID		4 bytes		char[4]
			dWord(dLength)			+	// dwChunkSize		4 bytes		uint32 / dword
			PCMData.encodeFrame(samples, bitsPerSample)
		);

		chunkData = data.chunks;

		if (chunkData) {
			for (i in chunkData) {
				if (chunkData.hasOwnProperty(i)) {
					chunkType = chunkData[i];
					for (n=0; n<chunkType.length; n++) {
						chunk = chunkType[n];
						chunks.push(i + dWord(chunk.length) + chunk);
					}
				}
			}
		}

		chunks = chunks.join('');
		chunks = 'RIFF'			+	// sGroupId		4 bytes		char[4]
			dWord(chunks.length)	+	// dwFileLength		4 bytes		uint32 / dword
			'WAVE'			+	// sRiffType		4 bytes		char[4]
			chunks;

		if (asyncCallback) setTimeout(function () {
			asyncCallback(chunks);
		}, 1);

		return chunks;
};

return PCMData;

}(this.Binary, this.Stream));
