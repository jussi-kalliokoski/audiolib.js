testAgainstFile = require('../helpers').testAgainstFile
helpers = require('../helpers')

AudioKit = require('../../dist/audiokit')

DECIMALS = 0

describe "nodes.Phasor", ->

  describe "process", ->

    it "should return correct results for a 440Hz phasor", (done) ->
      buffer = new Float32Array(4410)
      phasor = new AudioKit.Nodes.Phasor({sampleRate: 44100, blockSize: 4410, parameters: {frequency: 440}})
      phasor.process(buffer)
      testAgainstFile(buffer, "waveforms/phasor-440-hz.json", {decimals: DECIMALS, toUInt16: true}, done)
