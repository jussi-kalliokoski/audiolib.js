function Delay(samplerate, time, feedback)
{
	var	self		= this,
		bufferSize	= (!samplerate ? 44100 : samplerate) * 2,
		arrayType	= window.Float32Array || Array,
		buffer		= new arrayType(bufferSize),
		bufferPos	= 0,
		speed		= 0,
		prevTime	= 0,
		sample		= 0.0,

		floor		= Math.floor;

	function calcCoeff(){
		speed = bufferSize / self.samplerate / self.time * 1000;
		prevTime = self.time;
	}

	function fillBuffer(sample, from, to){
		var i = from;
		while (i++ !== to){
			if (i >= bufferSize){
				i=0;
			}
			buffer[i] = sample;
		}
	}

	function algo0(s){
		buffer[bufferPos++] += s;
		if (bufferPos > self.time / 1000 * self.samplerate){
			bufferPos = 0;
		}
		buffer[bufferPos] = buffer[bufferPos] * self.feedback;
	}

	function algo1(s){
		var startPos = floor(bufferPos);
		if (prevTime !== self.time){
			calcCoeff();
		}
		bufferPos += speed;
		if (bufferPos >= bufferSize){
			bufferPos -= bufferSize;
		}
		fillBuffer(s + buffer[floor(bufferPos)] * self.feedback, startPos, floor(bufferPos));
	}

	this.time = !time ? 1000 : time; //ms
	this.feedback = 0.0; // 0.0 - 1.0
	this.algorithm = 0; // ['No resampling(faster)', 'Resampling (slower, beta)']
	this.samplerate = samplerate;

	this.pushSample = function(s){
		if (this.algorithm === 0){
			algo0(s);
		} else {
			algo1(s);
		}
		sample = buffer[floor(bufferPos)];
		return sample;
	};

	this.getMix = function(){
		return sample;
	};
}
