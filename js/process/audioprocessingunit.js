/**
 * A helper class for buffer-based audio analyzers, such as FFT.
 *
 * @param {Number} bufferSize Size of the buffer (a power of 2)
*/

function AudioProcessingUnit(bufferSize){
	var k;
	for (k in AudioProcessingUnit.prototype){
		if (AudioProcessingUnit.prototype.hasOwnProperty(k)){
			this[k] = AudioProcessingUnit.prototype[k];
		}
	}
	this.resetBuffer.apply(this, arguments);
}

AudioProcessingUnit.prototype = {
	bufferPos:	-1,
	pushSample: function(s){
		this.bufferPos = (this.bufferPos + 1) % this.buffer.length;
		this.bufferPos === 0 && this.process(this.buffer);
		this.buffer[this.bufferPos] = s;
		return s;
	},
	getMix: function(){
		return this.buffer[this.bufferPos];
	},
	resetBuffer: function(bufferSize){
		this.bufferSize	= isNaN(bufferSize) ? this.bufferSize : bufferSize;
		this.buffer	= new Float32Array(this.bufferSize);
		this.bufferPos	= -1;
	}
};
