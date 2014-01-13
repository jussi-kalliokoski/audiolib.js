// Simple sound check with two sine waves,
// 220Hz on the left channel, 440Hz on the right channel.

var sink = require('./utils').sink;
var Sine = require('../src/Nodes/Sine');

var blockSize = 4410/2;
var sine1 = new Sine({sampleRate: 44100, blockSize: blockSize, parameters: {frequency: 220}});
var sine2 = new Sine({sampleRate: 44100, blockSize: blockSize, parameters: {frequency: 440}});

var buffer1, buffer2;

sink(function() {
  buffer1 = new Float32Array(blockSize);
  buffer2 = new Float32Array(blockSize);
  sine1.process(buffer1);
  sine2.process(buffer2);
  return [buffer1, buffer2]; 
});
