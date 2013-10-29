EPSILON = 0.01

isWithinErrorMargin = (x, y) ->
  return true if x is y or (isNaN(x) and isNaN(y))
  return Math.abs((x - y) / x) < EPSILON

expectToBeWithinErrorMargin = (x, y, index) ->
  if not isWithinErrorMargin(x, y)
    throw new Error("Expected #{x} to be within error margin with #{y} at index #{index}")

describe "Tools.WindowFunctions", ->
  # Window function references borrowed from DSP.js
  DSPJS =
    Bartlett: (length, index) -> 2 / (length - 1) * ((length - 1) / 2 - Math.abs(index - (length - 1) / 2))
    BartlettHann: (length, index) -> 0.62 - 0.48 * Math.abs(index / (length - 1) - 0.5) - 0.38 * Math.cos((Math.PI * 2) * index / (length - 1))
    Blackman: (length, index, alpha) ->
      t = 2 * Math.PI * index / (length - 1)
      a0 = (1 - alpha) / 2
      a1 = -0.5
      a2 = alpha / 2
      return a0 + a1 * Math.cos(t) + a2 * Math.cos(2 * t)
    Cosine: (length, index) -> Math.cos(Math.PI * index / (length - 1) - Math.PI / 2)
    Gauss: (length, index, alpha) -> Math.pow(Math.E, -0.5 * Math.pow((index - (length - 1) / 2) / (alpha * (length - 1) / 2), 2))
    Hamming: (length, index) -> 0.54 - 0.46 * Math.cos((Math.PI * 2) * index / (length - 1))
    Hann: (length, index) -> 0.5 * (1 - Math.cos((Math.PI * 2) * index / (length - 1)))
    Lanczos: (length, index) ->
      x = Math.PI * (2 * index / (length - 1) - 1)
      return Math.sin(x) / (x)
    Rectangular: (length, index) -> 1
    Triangular: (length, index) -> 2 / length * (length / 2 - Math.abs(index - (length - 1) / 2))

  testBuffers = null
  getReference = (type, length, alpha) -> new Float32Array(_.map(_.range(length), (index) -> DSPJS[type](length, index, alpha)))
  testBuffer = (type, index, alpha) ->
    length = testBuffers[index].length
    buffer = new Float32Array(length)
    reference = getReference(type, length, alpha)
    AudioKit.Tools.WindowFunctions[type](buffer, alpha)
    for index in [ 0 ... buffer.length ]
      expectToBeWithinErrorMargin(reference[index], buffer[index], index)

  beforeEach ->
    testBuffers = [
      new Float32Array(_.range(64))
      new Float32Array(_.map(_.range(310), (index) -> Math.sin(index)))
    ]

  describe ".Bartlett()", ->
    it "should return correct results for test buffer #0", ->
      testBuffer("Bartlett", 0)

    it "should return correct results for test buffer #1", ->
      testBuffer("Bartlett", 1)

  describe ".BartlettHann()", ->
    it "should return correct results for test buffer #0", ->
      testBuffer("BartlettHann", 0)

    it "should return correct results for test buffer #1", ->
      testBuffer("BartlettHann", 1)

  describe ".Blackman()", ->
    it "should return correct results for test buffer #0", ->
      testBuffer("Blackman", 0, 0.25)
      testBuffer("Blackman", 0, 0.5)
      testBuffer("Blackman", 0, 0.9999)

    it "should return correct results for test buffer #1", ->
      testBuffer("Blackman", 1, 0.25)
      testBuffer("Blackman", 1, 0.5)
      testBuffer("Blackman", 1, 0.9999)

  describe ".Cosine()", ->
    it "should return correct results for test buffer #0", ->
      testBuffer("Cosine", 0)

    it "should return correct results for test buffer #1", ->
      testBuffer("Cosine", 1)

  describe ".Gauss()", ->
    it "should return correct results for test buffer #0", ->
      testBuffer("Gauss", 0, 0.25)
      testBuffer("Gauss", 0, 0.5)
      testBuffer("Gauss", 0, 0.9999)

    it "should return correct results for test buffer #1", ->
      testBuffer("Gauss", 1, 0.25)
      testBuffer("Gauss", 1, 0.5)
      testBuffer("Gauss", 1, 0.9999)

  describe ".Hamming()", ->
    it "should return correct results for test buffer #0", ->
      testBuffer("Hamming", 0)

    it "should return correct results for test buffer #1", ->
      testBuffer("Hamming", 1)

  describe ".Hann()", ->
    it "should return correct results for test buffer #0", ->
      testBuffer("Hann", 0)

    it "should return correct results for test buffer #1", ->
      testBuffer("Hann", 1)

  describe ".Lanczos()", ->
    it "should return correct results for test buffer #0", ->
      testBuffer("Lanczos", 0)

    it "should return correct results for test buffer #1", ->
      testBuffer("Lanczos", 1)

  describe ".Rectangular()", ->
    it "should return correct results for test buffer #0", ->
      testBuffer("Rectangular", 0)

    it "should return correct results for test buffer #1", ->
      testBuffer("Rectangular", 1)

  describe ".Triangular()", ->
    it "should return correct results for test buffer #0", ->
      testBuffer("Triangular", 0)

    it "should return correct results for test buffer #1", ->
      testBuffer("Triangular", 1)
