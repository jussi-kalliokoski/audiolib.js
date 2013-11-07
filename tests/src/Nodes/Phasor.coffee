ArrayMath = require('dsp')
helpers = require('../../helpers')
phasorTestHack = helpers.phasorTestHack
compareBuffers = helpers.compareBuffers
Phasor = require('../../../src/Nodes/Phasor')

DECIMALS = -0.5 # result is valid at +- 1.59

describe "Nodes.Phasor", ->

  describe "process", ->

    it "should return correct results with a constant 440Hz frequency", (done) ->
      helpers.loadRefFile "waveforms/phasor-440-hz.json", (err, refData) ->
        throw err if err
        blockSize = 4410/2
        phasor = new Phasor({sampleRate: 44100, blockSize: blockSize, parameters: {frequency: 440}})

        buffer1 = new Float32Array(blockSize)
        buffer2 = new Float32Array(blockSize)
        phasor.process(buffer1)
        phasor.process(buffer2)

        expected1 = phasorTestHack(refData.slice(0, blockSize))
        expected2 = phasorTestHack(refData.slice(blockSize, blockSize * 2))

        compareBuffers(helpers.toUInt16(buffer1), expected1, DECIMALS)
        compareBuffers(helpers.toUInt16(buffer2), expected2, DECIMALS)
        done()

    it "should return correct results for a ramp from 220Hz to 440Hz", (done) ->
      helpers.loadRefFile "waveforms/phasor-moving-frequency-220-to-440-hz.json", (err, refData) ->
        throw err if err
        blockCount = 10
        blockSize = 4410/blockCount
        phasor = new Phasor({sampleRate: 44100, blockSize: blockSize})

        frequencyRamp = new Float32Array(4410)
        ArrayMath.ramp(frequencyRamp, 220, 440)

        for i in [0...blockCount]
          buffer = new Float32Array(blockSize)
          frequencies = frequencyRamp.subarray(i * blockSize, (i+1) * blockSize)
          phasor.process(buffer, frequencies)
          expected = phasorTestHack(refData.slice(i * blockSize, (i+1) * blockSize))
          compareBuffers(helpers.toUInt16(buffer), expected, DECIMALS)
        done()

    afterEach (done) ->
      helpers.renderFailurePlots(this.currentTest, done)
