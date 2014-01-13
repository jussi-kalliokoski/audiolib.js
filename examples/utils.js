var _ = require('underscore');
var Speaker = require('speaker');
var pcmUtils = require('pcm-boilerplate');

exports.sink = function(pullBlock) {
  var format = {
    numberOfChannels: 2,  // 2 channels
    bitDepth: 16,         // 16-bit samples
    sampleRate: 44100     // 44,100 Hz sample rate
  };

  // Create the Speaker instance
  var speaker = new Speaker(_.extend(format, {channels: format.numberOfChannels}));
  
  // The stream encoding our audio to PCM
  var streamEncoder = new pcmUtils.StreamEncoder(format);
  streamEncoder.pipe(speaker);

  // Loop pulling the audio
  var pullAudio = function pullAudio () {
    if (streamEncoder.write(pullBlock())) pullAudio();
    else streamEncoder.once('drain', pullAudio);
  };
  pullAudio();
};
