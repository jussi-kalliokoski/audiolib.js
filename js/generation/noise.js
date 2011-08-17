function Noise(){
	this.reset();
}

Noise.prototype = {
	/* The sample rate of the Noise. */
	sampleRate:	44100,
	/* The color of the Noise. */
	color:		'white',
	q:		15,
	c1:		null,
	c2:		null,
	c3:		null,
	c4:		null,
	/* Brown seed. */
	brownQ:		0,
	/* Pink seed. */
	pinkQ:		0,
	/* Current value of the Noise. */
	value:		0,
	/* The values of the octaves of the pink noise. */
	pinkVals:	null,
	/* The amount of octaves for the white noise. */
	pinkPrecision:	16,
	/* The amount of octaves for the white noise - 1. */
	pinkPrecision1:	15,
	/* The pink noise position counter. */
	count:		1,
	/* The length of the counter in bits. */
	CTZBitCount:	64, // The maximum in JS, 2011
	reset: function(sampleRate, color){
		this.sampleRate		= isNaN(sampleRate) ? this.sampleRate : sampleRate;
		this.color		= typeof color === 'string' ? color : this.color;
		this.pinkVals		= new Float32Array(this.pinkPrecision);
		this.pinkPrecision1	= this.pinkPrecision - 1;
		this.c1			= (1 << this.q) - 1;
		this.c2			= (~~(this.c1 /3)) + 1;
		this.c3			= 1 / this.c1;
		this.c1			= this.c2 * 6;
		this.c4			= 3 * (this.c2 - 1);
	},
	generate: function(){
		this.value	= this[this.color]();
	},
	getMix: function(){
		return this.value;
	},
	CTZ: function(n){
		var i = 0;
		while( (num >> i) & 1 === 0 && i < this.CTZBitCount ){
			i++;
		}
		return i;
	},
	white: function(){
		var r = Math.random();
		return (r * this.c1 - this.c4) * this.c3;
	},
	pink: function(){
		var	k	= this.CTZ(this.count) & this.pinkPrecision1,
			p	= this.pinkVals[k],
			r;

		for(;;){
			r			= this.white();
			this.pinkVals[k]	= r;
			r -= p;
			this.pinkQ		+= r;
			if (this.pinkQ < -4 || this.pinkQ > 4){
				this.pinkQ	-= r;
			} else {
				break;
			}
		}

		this.count++;

		return (this.white() + this.pinkQ) * 0.125;
	},
	brown: function(){
		var r;
		for (;;){
			r = this.white();
			this.brownQ += r;
			if (this.brownQ < -8 || this.brownQ > 8){
				this.brownQ -= r;
			} else {
				break;
			}
		}
		return this.brownQ * 0.0625;
	}
};
