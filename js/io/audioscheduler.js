// Requires AudioDevice

// We don't care much about those other arguments
this.AudioDevice.createScheduled(function(a, b, callback, c){
	var	schedule	= [],
		previousCall	= 0,
		dev;

	function fn(buffer, channelCount){
		var	l		= buffer.length / channelCount,
			n, i;
		previousCall = +new Date;
		for (i=0; i<l; i++){
			for (n=0; n<schedule.length; n++){
				if (schedule[n].t-- <=){
					schedule[n].f.apply(schedule[n].x, schedule[n].a);
					schedule.splice(n--, 1);
				}
			}
			callback(buffer.subarray(i * channelCount, channelCount));
		}
	}

	dev = this(a, b, fn, c);
	dev.schedule = function(callback, context, args){
		schedule.push({
			f: callback,
			x: context,
			a: args,
			t: ((new Date - previousCall) * 0.001 * this.sampleRate)
		});
	};
});
