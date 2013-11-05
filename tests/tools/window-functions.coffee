async = require('async')
testAgainstFile = require('../helpers').testAgainstFile

AudioKit = require('../../dist/audiokit')

DECIMALS = 5

describe "Tools.WindowFunctions", ->

  describe ".Bartlett()", ->
    it "should return correct results", (done) ->
      buffer = new Float32Array(1024)
      AudioKit.Tools.WindowFunctions.Bartlett(buffer)
      testAgainstFile(buffer, "window-functions/bartlett-window.json", DECIMALS, done)

  describe ".BartlettHann()", ->
    it "should return correct results", (done) ->
      buffer = new Float32Array(1024)
      AudioKit.Tools.WindowFunctions.BartlettHann(buffer)
      testAgainstFile(buffer, "window-functions/bartlett-hann-window.json", DECIMALS, done)

  describe ".Blackman()", ->
    it "should return correct results", (done) ->
      buffer = new Float32Array(1024)
      AudioKit.Tools.WindowFunctions.Blackman(buffer)
      testAgainstFile(buffer, "window-functions/blackman-window.json", DECIMALS, done)

  describe ".Cosine()", ->
    it "should return correct results", (done) ->
      buffer = new Float32Array(1024)
      AudioKit.Tools.WindowFunctions.Cosine(buffer)
      testAgainstFile(buffer, "window-functions/cosine-window.json", DECIMALS, done)

  describe ".Gauss()", ->
    it "should return correct results", (done) ->
      async.series([
        (next) ->
          buffer = new Float32Array(1024)
          AudioKit.Tools.WindowFunctions.Gauss(buffer, 0.5)
          testAgainstFile(buffer, "window-functions/gaussian-window-sigma-0.5.json", DECIMALS, next)
        (next) ->
          buffer = new Float32Array(1024)
          AudioKit.Tools.WindowFunctions.Gauss(buffer, 0.25)
          testAgainstFile(buffer, "window-functions/gaussian-window-sigma-0.25.json", DECIMALS, next)
        (next) ->
          buffer = new Float32Array(1024)
          AudioKit.Tools.WindowFunctions.Gauss(buffer, 0.9999)
          testAgainstFile(buffer, "window-functions/gaussian-window-sigma-0.9999.json", DECIMALS, done)
      ])


  describe ".Hamming()", ->
    it "should return correct results", (done) ->
      buffer = new Float32Array(1024)
      AudioKit.Tools.WindowFunctions.Hamming(buffer)
      testAgainstFile(buffer, "window-functions/hamming-window.json", DECIMALS, done)

  describe ".Hann()", ->
    it "should return correct results", (done) ->
      buffer = new Float32Array(1024)
      AudioKit.Tools.WindowFunctions.Hann(buffer)
      testAgainstFile(buffer, "window-functions/hann-window.json", DECIMALS, done)

  describe ".Lanczos()", ->
    it "should return correct results", (done) ->
      buffer = new Float32Array(1024)
      AudioKit.Tools.WindowFunctions.Lanczos(buffer)
      testAgainstFile(buffer, "window-functions/lanczos-window.json", DECIMALS, done)

  describe ".Rectangular()", ->
    it "should return correct results", (done) ->
      buffer = new Float32Array(1024)
      AudioKit.Tools.WindowFunctions.Rectangular(buffer)
      testAgainstFile(buffer, "window-functions/rectangular-window.json", DECIMALS, done)

  describe ".Triangular()", ->
    it "should return correct results", (done) ->
      buffer = new Float32Array(1024)
      AudioKit.Tools.WindowFunctions.Triangular(buffer)
      testAgainstFile(buffer, "window-functions/triangular-window.json", DECIMALS, done)
