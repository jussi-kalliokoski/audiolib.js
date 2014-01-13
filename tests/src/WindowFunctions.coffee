_ = require('underscore')
ArrayMath = require('dsp')
async = require('async')
helpers = require('../helpers')

WindowFunctions = require('../../src/WindowFunctions')

PRECISION = 5

describe "Tools.WindowFunctions", ->

  describe ".Bartlett()", ->
    it "should return correct results", (done) ->
      helpers.loadRefFile "window-functions/bartlett-window.json", (err, refData) ->
        throw err if err
        buffer = new Float32Array(1024)
        WindowFunctions.Bartlett(buffer)
        helpers.compareBuffers2(_.toArray(buffer), refData, PRECISION)
        done()

  describe ".BartlettHann()", ->
    it "should return correct results", (done) ->
      helpers.loadRefFile "window-functions/bartlett-hann-window.json", (err, refData) ->
        throw err if err
        buffer = new Float32Array(1024)
        WindowFunctions.BartlettHann(buffer)
        helpers.compareBuffers2(_.toArray(buffer), refData, PRECISION)
        done()

  describe.skip ".Blackman()", ->
    it "should return correct results", (done) ->
      helpers.loadRefFile "window-functions/blackman-window.json", (err, refData) ->
        throw err if err
        buffer = new Float32Array(1024)
        WindowFunctions.Blackman(buffer)
        helpers.compareBuffers2(_.toArray(buffer), refData, PRECISION)
        done()

  describe.skip ".Cosine()", ->
    it "should return correct results", (done) ->
      helpers.loadRefFile "window-functions/cosine-window.json", (err, refData) ->
        throw err if err
        buffer = new Float32Array(1024)
        WindowFunctions.Cosine(buffer)
        helpers.compareBuffers2(_.toArray(buffer), refData, PRECISION)
        done()

  describe.skip ".Gauss()", ->

    it "should return correct results with sigma 0.5", (done) ->
      helpers.loadRefFile "window-functions/gaussian-window-sigma-0.5.json", (err, refData) ->
        throw err if err
        buffer = new Float32Array(1024)
        WindowFunctions.Gauss(buffer, 0.5)
        helpers.compareBuffers2(_.toArray(buffer), refData, PRECISION)
        done()

    it "should return correct results with sigma 0.25", (done) ->
      helpers.loadRefFile "window-functions/gaussian-window-sigma-0.25.json", (err, refData) ->
        throw err if err
        buffer = new Float32Array(1024)
        WindowFunctions.Gauss(buffer, 0.25)
        helpers.compareBuffers2(_.toArray(buffer), refData, PRECISION)
        done()

    it "should return correct results with sigma 0.9999", (done) ->
      helpers.loadRefFile "window-functions/gaussian-window-sigma-0.9999.json", (err, refData) ->
        throw err if err
        buffer = new Float32Array(1024)
        WindowFunctions.Gauss(buffer, 0.9999)
        helpers.compareBuffers2(_.toArray(buffer), refData, PRECISION)
        done()

  describe ".Hamming()", ->
    it "should return correct results", (done) ->
      helpers.loadRefFile "window-functions/hamming-window.json", (err, refData) ->
        throw err if err
        buffer = new Float32Array(1024)
        WindowFunctions.Hamming(buffer)
        helpers.compareBuffers2(_.toArray(buffer), refData, PRECISION)
        done()

  describe ".Hann()", ->
    it "should return correct results", (done) ->
      helpers.loadRefFile "window-functions/hann-window.json", (err, refData) ->
        throw err if err
        buffer = new Float32Array(1024)
        WindowFunctions.Hann(buffer)
        helpers.compareBuffers2(_.toArray(buffer), refData, PRECISION)
        done()

  describe.skip ".Lanczos()", ->
    it "should return correct results", (done) ->
      helpers.loadRefFile "window-functions/lanczos-window.json", (err, refData) ->
        throw err if err
        buffer = new Float32Array(1024)
        WindowFunctions.Lanczos(buffer)
        helpers.compareBuffers2(_.toArray(buffer), refData, PRECISION)
        done()

  describe.skip ".Rectangular()", ->
    it "should return correct results", (done) ->
      helpers.loadRefFile "window-functions/rectangular-window.json", (err, refData) ->
        throw err if err
        buffer = new Float32Array(1024)
        WindowFunctions.Rectangular(buffer)
        helpers.compareBuffers2(_.toArray(buffer), refData, PRECISION)
        done()

  describe ".Triangular()", ->
    it "should return correct results", (done) ->
      helpers.loadRefFile "window-functions/triangular-window.json", (err, refData) ->
        throw err if err
        buffer = new Float32Array(1024)
        WindowFunctions.Triangular(buffer)
        helpers.compareBuffers2(_.toArray(buffer), refData, PRECISION)
        done()
