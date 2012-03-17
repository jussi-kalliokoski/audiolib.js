/**
 * Creates a StepSequencer.
 *
 * @control
 *
 * @arg =!sampleRate
 * @arg =!stepLength
 * @arg =!steps
 * @arg =!attack
 *
 * @param type:UInt units:Hz default:44100 sampleRate Sample Rate the apparatus operates on.
 * @param type:Float min:0 units:ms default:200 stepLength The time a single step of the sequencer lasts.
 * @param type:Array<Float> default:0 steps Array of steps (positive float) for the sequencer to iterate.
 * @param type:Float min:0.0 max:1.0 default:0.0 attack The time the linear transition between the steps. Measured in steps.
 * @param type:Float default:0.0 phase The current phase of the sequencer.
*/
function StepSequencer (sampleRate, stepLength, steps, attack) {
	var	self	= this,
		phase	= 0;

	this.sampleRate		= isNaN(sampleRate) ? this.sampleRate : sampleRate;
	this.stepLength		= isNaN(stepLength) ? this.stepLength : stepLength;
	this.steps		= steps || [1, 0];
	this.attack		= isNaN(attack) ? this.attack : attack;
}

StepSequencer.prototype = {
	sampleRate:	44100,
	stepLength:	200,
	steps:		null,
	attack:		0,
	phase:		0,
	/* The current value of the step sequencer */
	value:		0,

/**
 * Moves the step sequencer one sample further in sample time.
 *
 * @return {Number} The current value of the step sequencer.
*/
	generate: function () {
		var	self		= this,
			stepLength	= self.sampleRate / 1000 * self.stepLength,
			steps		= self.steps,
			sequenceLength	= stepLength * steps.length,
			step, overStep, prevStep, stepDiff,
			val;
		self.phase	= (self.phase + 1) % sequenceLength;
		step		= self.phase / sequenceLength * steps.length;
		overStep	= step % 1;
		step		= ~~(step);
		prevStep	= (step || steps.length) - 1;
		stepDiff	= steps[step] - steps[prevStep];
		val		= steps[step];
		if (overStep < self.attack)  {
			val -= stepDiff - stepDiff / self.attack * overStep;
		}
		self.value = val;
		return val;
	},
/**
 * Returns the current value of the step sequencer.
 *
 * @return {Number} The current value of the step sequencer.
*/
	getMix: function () {
		return this.value;
	},
/**
 * Triggers the gate for the step sequencer, resetting its phase to zero.
 *
 * @method StepSequencer
*/
	triggerGate: function () {
		this.phase = 0;
	}
};
