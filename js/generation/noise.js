function Noise(){
	this.reset.apply(this, arguments);
}

Noise.prototype = {
	/* The sample rate of the Noise. */
	sampleRate:	44100,
	/* The color of the Noise. */
	color:		'white',
	b0:		0,
	b1:		0,
	b2:		0,
	b3:		0,
	b4:		0,
	b5:		0,
	c1:		null,
	c2:		null,
	c3:		null,
	c4:		null,
	q:		15,
	q0:		null,
	q1:		null,
	/* Brown seed. */
	brownQ:		0,
	/* Current value of the Noise. */
	value:		0,
	reset: function(sampleRate, color){
		this.sampleRate		= isNaN(sampleRate) ? this.sampleRate : sampleRate;
		this.color		= typeof color === 'string' ? color : this.color;
		this.c1			= (1 << this.q) - 1;
		this.c2			= (~~(this.c1 /3)) + 1;
		this.c3			= 1 / this.c1;
		this.c1			= this.c2 * 6;
		this.c4			= 3 * (this.c2 - 1);
		this.q0			= Math.exp(-200 * Math.PI / this.sampleRate);
		this.q1			= 1 - this.q0;
	},
	generate: function(){
		this.value	= this[this.color]();
	},
	getMix: function(){
		return this.value;
	},
	white: function(){
		var r = Math.random();
		return (r * this.c1 - this.c4) * this.c3;
	},
	pink: function(){
		var	w	= this.white();
		this.b0 = 0.997 * this.b0 + 0.029591 * w;
		this.b1 = 0.985 * this.b1 + 0.032534 * w;
		this.b2 = 0.950 * this.b2 + 0.048056 * w;
		this.b3 = 0.850 * this.b3 + 0.090579 * w;
		this.b4 = 0.620 * this.b4 + 0.108990 * w;
		this.b5 = 0.250 * this.b5 + 0.255784 * w;
		return 0.55 * (this.b0 + this.b1 + this.b2 + this.b3 + this.b4 + this.b5);
	},
	brown: function(){
		var	w	= this.white();
		this.brownQ	= (this.q1 * w + this.q0 * this.brownQ);
		return 6.2 * this.brownQ;
	}
};
