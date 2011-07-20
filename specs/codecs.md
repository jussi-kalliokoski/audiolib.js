Codecs
======

Abstract
--------

This document describes how CODEC extensions to audiolib.js should be designed, and what functionality they should provide. CODEC extensions are generally used for decoding and/or encoding, and a CODEC extension must provide both or either functionality.

   *PLEASE NOTE*: This spec is a draft and a work in progress, and should not be referenced to as anything else. However, as such it does already provide some guidelines and recommendations that should not be disregarded. For suggestions of improvements, fork, blame or raise an issue.

Encoding
--------

Encoding interface is specified as follows:

```

interface Encoder inherits Codec
{
	public String encodeFrame(ArrayType samples, Int bitCount);
	public String encode(AudioData data, optional asyncCallback);
}

```

 ``` encode ``` should encode the provided AudioData either asynchronously if asyncCallback argument is truthy, calling asyncCallback with the result as an argument when finished, or return result. Keep in mind that even if you decide that making the function asynchronous is not wise, the callback should still occur asynchronously, for example using ``` setTimeout() ```, otherwise you might break some functionality others are relying on.

 ``` encodeFrame ``` should encode the provided array sample using bitCount as the sample size, returning the result as a string.

Decoding
--------

Decoding interface is specified as follows:

```

interface Decoder inherits Codec
{
	public ArrayType decodeFrame(String data, Int bitCount, ArrayType result);
	public AudioData decode(String data, optional asyncCallback);
}

```

 ``` decode ``` should decode the provided file data String to an AudioData object, either asynchronously if asyncCallback argument is truthy, calling asyncCallback with the result as an argument when finished, or return result. Keep in mind that even if you decide that making the function asynchronous is not wise, the callback should still occur asynchronously, for example using ``` setTimeout() ```, otherwise you might break some functionality others are relying on.

 ``` decodeFrame ``` should decode a provided String encoded frame using bitCount as the sample size and result as the ArrayType in which to read the data to. Should return the result.

AudioData
---------

AudioData interface is specified as follows:

```

interface AudioData
{
	public Int sampleRate;
	public Int channelCount;
	public ArrayType samples;
	/* The rest are optional */
	// Representation of the extra chunks contained in the file data, such as TAG, should be used when encoding the file if possible.
	public Object chunks;
	// Should be used in encoding if possible.
	public Int sampleSize; // bytes
	/* Any other data collected from the file that's possible to be used in encoding. */
}

```

Codec
-----

Codec interface is specified as a generic data type that inherits from Object:

```

interface Codec inherits Object
{
}

```

Example
-------

Here's an example of what a simple CODEC plugin might look like:

```javascript

var myCodec = {
	encodeFrame: function(data, bitCount){
		//doSomething
	},
	encode: function(data, asyncCallback){
		//doSomething, async or not
	}
	decodeFrame: function(data, bitCount, result){
		//doSomething
	},
	decode: function(data, asyncCallback){
		//doSomething, async or not
	}
};

audioLib.codecs('mpx', myCodec); // Handles all the necessary bindings to file loading, samplers, record, etc. and to audioLib.codecs object.

```

MIT license.
