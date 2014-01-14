_ = require('underscore')
ArrayMath = require('dsp')
seed = require('seed-random')

helpers = require('../../helpers')
compareBuffers = helpers.compareBuffers2
Noise = require('../../../src/Nodes/Noise')


describe "Nodes.Noise", ->

  describe "process", ->

    it "should work with white noise", () ->
      totalSamples = Math.pow(2, 20)
      blockCount = 4096
      blockSize = totalSamples / blockCount
      uniqSpectrumSize = blockSize / 2 + 1
      noise = new Noise({sampleRate: 44100, blockSize: blockSize, parameters: {color: "white"}})
      fft = new ArrayMath.FFT(blockSize)

      buffer = new Float32Array(blockSize)
      bufferRe = new Float32Array(blockSize)
      bufferIm = new Float32Array(blockSize)
      amplitudes = new Float32Array(uniqSpectrumSize)

      # Taking the spectrum of the noise on many blocks, and calculating the average
      # of all those spectrums
      for num in [0..blockCount]
        noise.process(buffer)
        fft.forward(bufferRe, bufferIm, buffer)
        ArrayMath.absCplx(bufferRe, bufferRe, bufferIm)
        ArrayMath.add(amplitudes, amplitudes, bufferRe.subarray(0, uniqSpectrumSize))
      ArrayMath.mul(amplitudes, 1/blockCount, amplitudes)

      # Calculating the average of the amplitudes for all frequencies
      amplitudes = amplitudes.slice(1)
      avg = _.toArray(amplitudes).reduce (total, val) ->
        total + val
      , 0
      avg = avg / amplitudes.length
      
      # Checking we get what's expected
      expected = new Float32Array(uniqSpectrumSize - 1)
      ArrayMath.add(expected, avg, expected)
      compareBuffers(amplitudes, expected, 1)

    it.skip "should work with pink noise", () ->
      totalSamples = Math.pow(2, 20)
      blockCount = 512
      blockSize = totalSamples / blockCount
      uniqSpectrumSize = blockSize / 2 + 1
      noise = new Noise({sampleRate: 44100, blockSize: blockSize, parameters: {color: "pink"}})
      fft = new ArrayMath.FFT(blockSize)

      buffer = new Float32Array(blockSize)
      bufferRe = new Float32Array(blockSize)
      bufferIm = new Float32Array(blockSize)
      amplitudes = new Float32Array(uniqSpectrumSize)

      # Taking the spectrum of the noise on many blocks, and calculating the average
      # of all those spectrums
      for num in [0..blockCount]
        noise.process(buffer)
        fft.forward(bufferRe, bufferIm, buffer)
        ArrayMath.absCplx(bufferRe, bufferRe, bufferIm)
        ArrayMath.add(amplitudes, amplitudes, bufferRe.subarray(0, uniqSpectrumSize))
      ArrayMath.mul(amplitudes, 1/blockCount, amplitudes)

      # Calculating the average of the amplitudes for all frequencies
      amplitudes = amplitudes.slice(1)
      avg = _.toArray(amplitudes).reduce (total, val) ->
        total + val
      , 0
      avg = avg / amplitudes.length
      
      # Checking we get what's expected
      expected = new Float32Array(uniqSpectrumSize - 1)
      ArrayMath.add(expected, avg, expected)
      compareBuffers(amplitudes, expected, 1)

    beforeEach () ->
      seed('someSeed', {global: true})

    afterEach (done) ->
      seed.resetGlobal()
      helpers.renderFailurePlots(this.currentTest, done)
