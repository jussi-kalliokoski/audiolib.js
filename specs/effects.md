Effects
=======

Abstract
--------

This document describes how EFFECT extensions to audiolib.js should be designed, and what functionality they should provide.
EFFECT extensions are used as effects to be applied either on audio buffers or per-sample basis.

   *PLEASE NOTE*: This spec is a draft and a work in progress, and should not be referenced to as anything else. However, as such it does already provide some guidelines and recommendations that should not be disregarded. For suggestions of improvements, fork, blame or raise an issue.

EFFECT
------

EFFECT is a class interface for a single-channel effect, that operates on a "single sample in, single sample out" basis. The EFFECT interface interacts with BUFFEREFFECT interface in such a manner that the usage as buffer-based multi-channel effects is automatically provided, and is not in the hands of the plugin developer to implement.

This is, unless your effect is by nature multi-channel. You can give a hint of such behaviour by defining the ``` channelCount ``` of your effect's prototype to something other than 1.

The EFFECT interface is specified as follows:

```

class interface EFFECT
{
	public Float32 pushSample(Float32 sample, channel=0 /* only applicable on multichannel effects */);
	public Float32 getMix(channel=0);
	public __constructor__(sampleRate, channelCount /* only applicable on multichannel effects */, /* plugin specific arguments */);

	/* This is up to the plugin developer only if the effect is a multi-channel one. */
	public readonly Uint channelCount;

	/* Functionality provided in the EFFECT class automatically, does not concern the plugin developer. */
	public String name;
	public readonly String fxid;
	public readonly String type;
	public readonly Boolean sink;
	public readonly Boolean source;
	public Float32 mix;
	public ArrayChain join(Effect fx1, Effect fx2, ..., Effect fxX);
}

```

 ``` pushSample ``` should take in a single sample, process it according to the channel provided. Unless a multi-channel effect, this should return the result.

 ``` getMix ``` should return the previously returned value of pushSample, without processing or moving in the sample-time. In the case of a multi-channel effect, this should also take in the argument channel that specifies for which channel to return the result for.

 ``` __constructor__ ``` is not an actual property of the EFFECT, but describes how the EFFECT constructor should be created. The constructor should take sample rate as the first argument, the rest of the arguments are freely specified by the plugin author.


 ``` name ``` or ``` fxid ``` is the name of the EFFECT. You should always refer to ``` fxid ``` when trying to identify the effect via these means, ``` name ``` can be specified for individual instances.

 ``` type ``` is a string containing the type of the EFFECT, and should always be 'effect' for EFFECT.

 ``` sink ``` is a boolean indicating whether the EFFECT is a sink, and should always be true for EFFECT, otherwise see [GENERATOR](https://github.com/jussi-kalliokoski/audiolib.js/blob/master/specs/generators.md).

 ``` source ``` is a boolean indicating whether the EFFECT is a source, and should always be true for EFFECT, otherwise see PROCESSOR.

 ``` mix ``` is a Float32 value determining the dry/wet ratio of the effect. Zero (0.0) indicates a completely dry mix, whereas One(1.0) indicates a completely wet mix. Used for interfacing with BUFFEREFFECT and EFFECTCHAIN. Default value is 0.5, where both dry and wet are applied at half the volume.

 ``` join ``` creates an ARRAYCHAIN of this EFFECT, joining it with the effects specified as arguments to the function.


On integration, the ``` __constructor__ ``` is provided with a property function called ``` createBufferBased(channelCount, /* plugin-specific arguments */ ``` that creates a BUFFEREFFECT of the EFFECT.

Integration
-----------

Integration is done with the ``` audioLib.effects() ``` function. Integration makes instances of EFFECT instances of the internal EffectClass, arms the constructor with the property function ``` createBufferBased() ``` , provides the additional functionality described in the EFFECT interface and attaches the EFFECT to ``` audioLib.effects ``` by the name specified.

```

Effect audioLib.effects(String name, Function __constructor__, optional Object prototype);

```

 ``` name ``` is the name to attach the EFFECT to ``` audioLib.effects ``` with, and will also be applied as the ``` fxid ``` and default ``` name ``` of the EFFECT.

 ``` __constructor__ ``` is the constructor of the EFFECT. If not specified, the function does nothing but return a property of ``` audioLib.effects ``` by the name specified by ``` name ``` argument.

 ``` prototype ``` is an object that the default EFFECT prototype will be extended with. If not specified, will default to the prototype property of ``` __constructor__ ```

Example
-------

Here is the code for an example EFFECT of the name 'PureEffect', that outputs the input signal as it is.

```javascript

audioLib.effects('PureEffect', function (sampleRate){
	this.sampleRate = sampleRate;
}, {
	prevSample: 0.0,
	pushSample: function(sample){
		this.prevSample = sample;
		return sample;
	},
	getMix: function(){
		return this.prevSample;
	}
});

```
