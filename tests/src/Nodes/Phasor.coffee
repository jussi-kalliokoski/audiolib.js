helpers = require('../../helpers')
phasorTestHack = helpers.phasorTestHack
compareBuffers = helpers.compareBuffers
Phasor = require('../../../src/Nodes/Phasor')

DECIMALS = -0.5 # result is valid at +- 1.59

describe "Nodes.Phasor", ->

  describe "process", ->

    it "should return correct results for a 440Hz phasor", (done) ->
      buffer1 = new Float32Array(4410 / 2)
      buffer2 = new Float32Array(4410 / 2)
      phasor = new Phasor({sampleRate: 44100, blockSize: 4410, parameters: {frequency: 440}})
      phasor.process(buffer1)
      phasor.process(buffer2)
      helpers.loadRefFile "waveforms/phasor-440-hz.json", (err, expected) ->
        throw err if err
        expected1 = phasorTestHack(expected.slice(0, buffer1.length))
        expected2 = phasorTestHack(expected.slice(buffer1.length, buffer1.length + buffer2.length))

        compareBuffers(helpers.toUInt16(buffer1), expected1, DECIMALS)
        compareBuffers(helpers.toUInt16(buffer2), expected2, DECIMALS)
        done()

    afterEach (done) ->
      helpers.renderFailurePlots(this.currentTest, done)
