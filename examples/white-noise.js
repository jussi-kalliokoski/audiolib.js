// Simple sound check with a white noise.

var sink = require('./utils').sink;
var Noise = require('../src/Nodes/Noise');

var blockSize = 4410/2;
var noise = new Noise({sampleRate: 44100, blockSize: blockSize, parameters: {color: 'white'}});

var buffer;

sink(function() {
  buffer = new Float32Array(blockSize);
  noise.process(buffer);
  return [buffer, buffer];
});
