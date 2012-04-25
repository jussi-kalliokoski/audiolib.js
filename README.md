# audiolib.js
## Overview

audiolib.js is a powerful toolkit for audio written in JS.

It ships with most of the common tools such as:

* Reverbs
* Comb/IIR/Biquad/All-Pass/Low-Pass/Band-Pass/High-Pass filters
* Delays
* Oscillators
* FFT and other analyzing tools
* Step sequencers
* Envelope controls
* Noise generators
* Samplers

In addition, it hosts these tools in a comprehensive framework, that makes it simple to write a single effect and provides the higher level abstraction on top of that, making the whole system comfortable for both users and plugin authors.

As for the higher level abstraction, audiolib.js features a sophisticated automation API, alongside with pre-processing hooks, sample level access and buffer level management.

audiolib.js is bundled with some tools to make an audio developer's life in a browser much easier, such as sink.js for a consistent API between the experimental browser audio APIs. To complement that, audiolib.js also bundles pcmdata.js that is a WAV encoder/decoder, so that you can turn the recordings you make using Sink.js into WAV files that the user can save. Other tools include the AudioWorker API that allows you to create web workers from strings or functions, bundling audiolib.js and its plugins, all ready to use from the worker.


## How to get it

audiolib.js is available both in browser and CLI environments.

### Node

To install via npm:

```
$ npm install audiolib
```

Please note that you'll need [grunt](http://gruntjs.com/) for this to work.

### Browser

For browser environments, download the latest version [here](https://github.com/jussi-kalliokoski/audiolib.js/downloads), or get the [source code](https://github.com/jussi-kalliokoski/audiolib.js) from GitHub and build it yourself. Don't worry, instructions are included.

## Documentation

Documentation is available at http://docs.audiolibjs.org/ . Tutorials can be found in the [wiki](https://github.com/jussi-kalliokoski/audiolib.js/wiki)

## Demos

(if you have your own, please fork & add | msg me)

* [JSMad](http://jsmad.org/)
* [Orbisyn](http://niiden.com/orbisyn/)
* [jams.no.de](http://jams.no.de)
* [ofmlabs codecs](http://codecs.ofmlabs.org/)

## Libraries bundled with audiolib.js

* [sink.js](https://github.com/jussi-kalliokoski/sink.js), for output and buffer handling.
* [PCMData.js](https://github.com/jussi-kalliokoski/pcmdata.js), for WAV codecs. (project deprecated and adopted)
* [binary.js](https://github.com/jussi-kalliokoski/binary.js), for PCMData.js and general binary data processing. (project deprecated and adopted)
* [fft.js](https://github.com/jussi-kalliokoski/fft.js), for super fast FT. (project deprecated and adopted)

## Related libraries

* [XAudioJS](https://github.com/grantgalitz/XAudioJS) is an alternative audio sink with built-in resampling and a Flash fallback. More developer-controlled output environment, that might be more sane for example games.
* [dynamicaudio.js](http://github.com/bfirsh/dynamicaudio.js) is a Flash fallback for Mozilla Audio Data API.
* [Audiolet](https://github.com/oampo/Audiolet) is a graph-based audio routing framework with a lot of nice stuff.
* [DSP.js](https://github.com/corbanbrook/dsp.js) is an extensive DSP toolkit originally designed for the Mozilla Audio Data API.

## Plugins

Specifications for plugin developers can be found in https://github.com/jussi-kalliokoski/audiolib.js/tree/master/specs

## Credits 

This project is maintained by [Jussi Kalliokoski](https://github.com/jussi-kalliokoski), with significant contributions from [David Govea](https://github.com/davidgovea). The project is funded by the awesome [ofmlabs](http://ofmlabs.org) !

## License

Licensed under MIT license.

## Example usage

```javascript
/* Create an output. */

var dev = audioLib.Sink(function(sampleBuffer){
	// Fill the buffer here.
}, channelCount, preBufferSize, sampleRate);

/*
 Note that all the arguments are optional,
 so if you want to create a write-only
 device, you can leave the arguments blank.
 Also, it is highly discouraged to set any
 of the arguments if you aren't sure that you
 need them. Use null if you need to skip
 arguments.
*/

/* Writing buffers: */
dev.writeBuffer(buffer);

/*
 You can also attach multiple listeners
 to the same Sink instance.
*/
dev.on('audioprocess', function(...){});


/* Effects */

var del = audioLib.Delay(sampleRate, delay, feedback);

var flt = audioLib.IIRFilter(sampleRate, cutoffFreq, resonance);

var flt = audioLib.LP12Filter(sampleRate, cutoffFreq, resonance);

var flt = audioLib.Reverb(sampleRate, channelCount, wet, dry, roomSize, damping);

var dist = audioLib.BiquadFilter(sampleRate, b0, b1, b2, a1, a2);

/* to feed a new input sample */
effect.pushSample(sample);
/* to get the output */
sample = effect.getMix();

/* Synthesis */

var osc = audioLib.Oscillator(sampleRate, frequency);

/* to generate a new sample */
osc.generate();
/* to get the output */
osc.getMix();

/* Sampler */

var sampler = audioLib.Sampler(sampleRate, sampleBuffer, defaultPitch);

/* Envelopes */

var adsr = audioLib.ADSREnvelope(sampleRate, attack, decay, sustain, release);

/* to trigger the gate */
adsr.triggerGate(isOpen);
/* to update the value ** Do this on every sample fetch for this to work properly. */
adsr.generate();
/* Get the value */
adsr.value; // 0.0 - 1.0, unless you put something more as sustain

var stepSeq = new audioLib.StepSequencer(sampleRate, stepLength, stepArray, attack);

/* To start the sequence over */
stepSeq.triggerGate();
/* to update the value ** Do this on every sample fetch for this to work properly. */
stepSeq.generate();
/* Get the value */
stepSeq.value; // 0.0 - 1.0

/* Recording */

var rec = dev.record();

/* To stop */
rec.stop();
// To export wav
var audioElement = new Audio(
	'data:audio/wav;base64,' +
	btoa( rec.toWav() ) // presuming btoa is supported
);

/* Resampling buffers */
audioLib.Sampler.resample(buffer, fromSampleRate,
	fromFrequency, toSampleRate, toFrequency);

/*
 If you are used to buffer based approach (for example DSP.js)
 and don't need to do any raw manipulation, all the effects
 can be used as buffer based too.
*/

var bufFx = audioLib.Delay/* or any effect */.createBufferBased(
	channelCount, /* the parameters needed by the specific effect */);

bufFx.append(buffer);

```

### Audio Workers

You can also use audiolib.js inside Audio Workers (Firefox 6.0+ only), but this is a whole another story. There are many approaches to that, you can include audiolib.js via an external javascript worker file, but audiolib.js offers an alternative approach to this: inline workers. Inline audio workers include the source code already downloaded, and thus creates a new worker that already contains audiolib.js. Inline Audio Workers also allow you to inject code into workers. Here is some code to get started, also see tests/audioworker.html.

```javascript

var worker = audioLib.AudioWorker(function(){
	device = audioLib.Sink(function(buffer, channelCount){
		/* Do some audio processing, like you weren't in a worker. */
	});
}, true /* enables injections */);

/* Injection */

worker.inject(function(){
	/* Execute some code inside the worker. */
});

/* Close the worker */

worker.terminate();

```

It's important to remember that even though that code looks like it's running in the same environment as the code it's written in, it's actually not and runs in the context of the worker, meaning you can't cross-reference variables. Also, the injections are sandboxed, so if you need to create a global variable, drop var.
