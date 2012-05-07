function Codec (name, codec) {
	var nameCamel = name[0].toUpperCase() + name.substr(1).toLowerCase();
	Codec[name] = codec;

	if (codec.decode) {
		audioLib.Sampler.prototype['load' + nameCamel] = function (filedata) {
			this.load.apply(this, [Codec[name].decode(filedata)].concat([].slice.call(arguments, 1)));
		};
	}

	if (codec.encode) {
		audioLib.AudioDevice.Recording.prototype['to' + nameCamel] = function (bytesPerSample) {
			return Codec[name].encode({
				data:		this.join(),
				sampleRate:	this.boundTo.sampleRate,
				channelCount:	this.boundTo.channelCount,
				bytesPerSample:	bytesPerSample
			});
		};
	}

	return codec;
}
