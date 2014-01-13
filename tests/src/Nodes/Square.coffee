ArrayMath = require('dsp')
helpers = require('../../helpers')
compareBuffers = helpers.compareBuffers2
Square = require('../../../src/Nodes/Square')

describe.skip "Nodes.Square", ->

  describe "process", ->

    it "should return correct results with a constant 440Hz frequency", (done) ->
      helpers.loadRefFile "waveforms/square-440-hz.json", (err, refData) ->
        throw err if err
        blockSize = 4410/2
        square = new Square({sampleRate: 44100, blockSize: blockSize, parameters: {frequency: 440}})

        buffer1 = new Float32Array(blockSize)
        buffer2 = new Float32Array(blockSize)
        square.process(buffer1)
        square.process(buffer2);debugger

        compareBuffers(helpers.toUInt16(buffer1), refData.slice(0, blockSize))
        compareBuffers(helpers.toUInt16(buffer2), refData.slice(blockSize, blockSize * 2))
        done()

    afterEach (done) ->
      helpers.renderFailurePlots(this.currentTest, done)
