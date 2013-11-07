helpers = require('../../helpers')
phasorTestHack = helpers.phasorTestHack
compareBuffers = helpers.compareBuffers
Phasor = require('../../../src/Nodes/Phasor')

DECIMALS = -0.5 # result is valid at +- 1.59

describe "Nodes.Phasor", ->

  describe "process", ->

    it "should return correct results for a 440Hz phasor", (done) ->
      buffer = new Float32Array(4410)
      phasor = new Phasor({sampleRate: 44100, blockSize: 4410, parameters: {frequency: 440}})
      phasor.process(buffer)
      helpers.loadRefFile "waveforms/phasor-440-hz.json", (err, expected) ->
        throw err if err
        compareBuffers(helpers.toUInt16(buffer), phasorTestHack(expected), DECIMALS)
        done()

    afterEach (done) ->
      helpers.renderFailurePlots(this.currentTest, done)
