/**
 * UIControl is a tool for creating smooth, latency-balanced UI controls to interact with audio.
 *
 * @constructor
 * @this {UIControl}
 * @param {Number} sampleRate The sample rate of the UI control.
 * @param {Number} value The initial value of the UI control.
*/
function UIControl(sampleRate, value){
	this.sampleRate	= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.schedule	= [];
	this.reset(value);
}

UIControl.prototype = {
	/** The sample rate of the UI control */
	sampleRate:	44100,
	/** The value of the UI control */
	value:		1,
	/** The internal schedule array of the UI control */
	schedule:	null,
	/** The internal clock of the UI control, indicating the previous time of a buffer callback */
	clock:		0,
/**
 * Returns the current value of the UI control
 *
 * @return {Number} The current value of the UI control
*/
	getMix:		function(){
		return this.value;
	},
	/** Moves the UI control one sample forward in the sample time */
	generate:	function(){
		var i;
		for (i=0; i<this.schedule.length; i++){
			if (this.schedule[i].t--){
				this.value = this.schedule[i].v;
				this.schedule.splice(i--, 1);
			}
		}
	},
/**
 * Sets the value of the UI control, latency balanced
 *
 * @param {Number} value The new value.
*/
	setValue:	function(value){
		this.schedule.push({
			v:	value,
			t:	~~((+new Date - this.clock) / 1000 * this.sampleRate)
		});
	},
	reset: function(value){
		this.value	= isNaN(value) ? this.value : value;
		this.clock	= +new Date;
	}
};
