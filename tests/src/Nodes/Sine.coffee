ArrayMath = require('dsp')
helpers = require('../../helpers')
compareBuffers = helpers.compareBuffers
Sine = require('../../../src/Nodes/Sine')

TOLERANCE = 0.01
AMPLITUDE = Math.pow(2, 15) - 1

describe "Nodes.Sine", ->

  describe "process", ->

    it "should return correct results with a constant 440Hz frequency", (done) ->
      helpers.loadRefFile "waveforms/sine-440-hz.json", (err, refData) ->
        throw err if err
        blockSize = 4410/2
        sine = new Sine({sampleRate: 44100, blockSize: blockSize, parameters: {frequency: 440}})

        buffer1 = new Float32Array(blockSize)
        buffer2 = new Float32Array(blockSize)
        sine.process(buffer1)
        sine.process(buffer2)

        compareBuffers(helpers.toUInt16(buffer1), refData.slice(0, blockSize), AMPLITUDE, TOLERANCE)
        compareBuffers(helpers.toUInt16(buffer2), refData.slice(blockSize, blockSize * 2), AMPLITUDE, TOLERANCE)
        done()

    afterEach (done) ->
      helpers.renderFailurePlots(this.currentTest, done)
