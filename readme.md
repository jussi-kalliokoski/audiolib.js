audiolib.js
===========

audiolib.js is a powerful audio tools library for javascript.

Amongst other things, it's bundled with [sink.js](https://github.com/jussi-kalliokoski/sink.js) that provides a Sink class which has a consistent callback audio output API that supports both Firefox4's Audio Data API and Chrome 10's Web Audio API.

Usage
-----

```javascript
// Create an output.
var dev = audioLib.Sink(function(sampleBuffer){
	// Fill the buffer here.
}, channelCount, preBufferSize, sampleRate);

// Note that all the arguments are optional, so if you want to create a write-only device, you can leave the arguments blank.
// Writing buffers:
dev.writeBuffer(buffer);

// If you want your application to work as a background tab in Firefox 5+, do this before creating the device:
audioLib.Sink.backgroundWork = true;

// Effects

var del = new audioLib.Delay(sampleRate, delay, feedback);

var flt = new audioLib.IIRFilter(sampleRate, cutoffFreq, resonance);

var flt = new audioLib.LP12Filter(sampleRate, cutoffFreq, resonance);

var flt = new audioLib.LowPassFilter(sampleRate, cutoffFreq, resonance);

var dist = new audioLib.Distortion(sampleRate);

// to feed a new input sample
effect.pushSample(sample);
// to get the output
sample = effect.getMix();

// Synthesis

var osc = new audioLib.Oscillator(sampleRate, frequency);

// to generate a new sample
osc.generate(fm1, fm2, ..., fmX);
// to get the output
osc.getMix();

// Sampler

var sampler = new audioLib.Sampler(sampleRate, sampleBuffer, defaultPitch);

// Envelopes

var adsr = new audioLib.ADSREnvelope(sampleRate, attack, decay, sustain, release);

// to trigger the gate
adsr.triggerGate(isOpen);
// to update the value ** Do this on every sample fetch for this to work properly. also returns the current value
adsr.generate();
// Get the value
adsr.value; // 0.0 - 1.0, unless you put something more as sustain

var stepSeq = new audioLib.StepSequencer(sampleRate, stepLength, stepArray, attack);

// To start the sequence over
stepSeq.triggerGate();
// to update the value ** Do this on every sample fetch for this to work properly. also returns the current value
stepSeq.generate();
// Get the value
stepSeq.value; // 0.0 - 1.0

//Recording

var rec = dev.record();

// To stop
rec.stop();
// To export wav
var audioElement = new Audio(
	'data:audio/wav;base64,' +
	btoa( rec.toWav() ) // presuming btoa is supported
);

// Resampling buffers
audioLib.Sampler.resample(buffer, fromSampleRate, fromFrequency, toSampleRate, toFrequency);

// Effect chains
var fx = new audioLib.EffectChain(fx1, fx2, fx3 /*, ...*/);
// Or...
var fx = fx1.join(fx2, fx3 /*, ...*/);

// Used just as if it were a single effect:
sample = fx.pushSample(sample);

// You can adjust mix or other properties of the chain simply as it were an array.
fx[0].mix = 0.75;

// If you are used to buffer based approach (for example DSP.js) and don't need to do any raw manipulation, all the effects can be used as buffer based too.
var bufFx = audioLib.Delay/* or any effect */.createBufferBased(channelCount, /* the parameters needed by the specific effect */);

bufFx.append(buffer);

```

Audio Workers
-------------

You can also use audiolib.js inside Audio Workers (Firefox 6.0+ only), but this is a whole another story. There are many approaches to that, you can include audiolib.js via an external javascript worker file, but audiolib.js offers an alternative approach to this: inline workers. Inline audio workers include the source code already downloaded, and thus creates a new worker that already contains audiolib.js. Inline Audio Workers also allow you to inject code into workers. Here is some code to get started, also see tests/audioworker.html.

```javascript

var worker = audioLib.AudioWorker(function(){
	device = audioLib.Sink(function(buffer, channelCount){
		// Do some audio processing, like you weren't in a worker.
	});
}, true /* enables injections */);

// Injection

worker.inject(function(){
	// Execute some code inside the worker.
});

// Close the worker

worker.terminate();

```

It's important to remember that even though that code looks like it's running in the same environment as the code it's written in, it's actually not and runs in the context of the worker, meaning you can't cross-reference variables. Also, the injections are sandboxed, so if you need to create a global variable, drop var.

Node.JS
-------

To install the latest version on NodeJS, please use the NPMJS:

```shell

$ npm install audiolib

```

You can now use ``` require('audiolib') ``` to use the library just as you would on the clientside.

Demos
-----

(if you have your own, please fork & add | msg me)

* [JSMad](http://jsmad.org/)
* [Orbisyn](http://niiden.com/orbisyn/)
* [jams.no.de](http://jams.no.de)

Libraries bundled with audiolib.js
----------------------------------

* [sink.js](https://github.com/jussi-kalliokoski/sink.js), for output and buffer handling.
* [PCMData.js](https://github.com/jussi-kalliokoski/pcmdata.js), for WAV codecs.
* [binary.js](https://github.com/jussi-kalliokoski/binary.js), for PCMData.js and general binary data processing.
* [fft.js](https://github.com/jussi-kalliokoski/fft.js), for super fast FT.

Related libraries
-----------------

* [XAudioJS](https://github.com/grantgalitz/XAudioJS) is an alternative audio sink with built-in resampling and a Flash fallback. More developer-controlled output environment, that might be more sane for example games.
* [dynamicaudio.js](http://github.com/bfirsh/dynamicaudio.js) is a Flash fallback for Mozilla Audio Data API.
* [Audiolet](https://github.com/oampo/Audiolet) is a graph-based audio routing framework with a lot of nice stuff.
* [DSP.js](https://github.com/corbanbrook/dsp.js) is an extensive DSP toolkit originally designed for the Mozilla Audio Data API.

Plugins
-------

Specifications for plugin developers can be found in https://github.com/jussi-kalliokoski/audiolib.js/tree/master/specs

Licensed under MIT license.
