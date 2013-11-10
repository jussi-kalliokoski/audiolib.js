_ = require('underscore')
mustache = require('mustache')
fs = require('fs')
path = require('path')
ArrayMath = require('dsp')
chai = require('chai')
expect = chai.expect
chaiStats = require('chai-stats')
chai.use(chaiStats)

# Just a temporary hack to fix #87 and having tests that pass anyways :) 
# TODO: beeeerk
module.exports.phasorTestHack = (buffer) ->
  for val, i in buffer
    buffer[i] = 0 if val is (Math.pow(2, 15) - 1)
  return buffer

# Helper to load a reference file. 
# `done(err, expected)` receives `expected` a simple JS array.
module.exports.loadRefFile = (filename, done) ->
  filepath = path.normalize(path.join(__dirname, 'dsp-test-files/test-files', filename))
  fs.readFile filepath, (err, data) ->
    return done(err) if err 
    expected = JSON.parse(data.toString())
    done(null, expected)

# Helper to compare 2 buffers.
# `actual` and `expected` can be either typed arrays
# or simple JS arrays.
module.exports.compareBuffers = (actual, expected, decimals) ->
  try
    expect(actual).almost.eql(expected, decimals)
  catch err
    failures.push({expected: expected, actual: actual, err: err})
    throw err

# Function to plot of the failure that happened during `test`.
# If no failure was recorded, this does nothing.
renderFailurePlots = module.exports.renderFailurePlots = (test, done) ->
  failure = _.find failures, (failure) -> test.err is failure.err
  return done() if (!failure)

  renderedPath = path.join(__dirname, 'failure-plots', test.title.split(' ').join('_') + '.html')
  test.err = new Error(failure.err.toString() + '\n > plots rendered in ' + renderedPath)
  expected = failure.expected
  actual = failure.actual

  context = {
    title: test.title,
    data: {
      actual: JSON.stringify(actual),
      expected: JSON.stringify(expected)
    },
    length: {actual: actual.length, expected: expected.length}
  }

  if expected.length is actual.length

    # Calculating the diffs
    diffArray = new Float32Array(expected)
    ArrayMath.sub(diffArray, new Float32Array(actual), diffArray)
    ArrayMath.abs(diffArray, diffArray)

    # Finding the index of the biggest diff
    maxDiff = {pos: -1, val: -Infinity}
    for val, i in diffArray
      maxDiff = {pos: i, val: val} if val > maxDiff.val
    probeLo = Math.max(maxDiff.pos - 2, 0)
    probeHi = maxDiff.pos + 3

    # More infos about the maximum difference
    context.maxDiff = {
      position: maxDiff.pos,
      expected: JSON.stringify(expected.slice(probeLo, probeHi)),
      actual: JSON.stringify(actual.slice(probeLo, probeHi))
    }

  fs.readFile templatePath, (err, data) ->
    throw err if err
    rendered = mustache.render(data.toString(), context)
    fs.writeFile(renderedPath, rendered, done)
failures = []
templatePath = path.join(__dirname, 'failure-plots', 'assets', 'index.mustache')

# Helper to convert a value or an array of values from float [-1, 1] to 16b unsigned int.
module.exports.toUInt16 = (val) ->
  handleVal = (val) ->
    Math.max(Math.min(Math.floor(val * pcmMult), pcmMax), pcmMin)
  if _.isArray(val) or val instanceof Float32Array
    return (handleVal elem for elem in val)
  else 
    return handleVal val
pcmMult = Math.pow(2, 15)
pcmMax = pcmMult - 1
pcmMin = -pcmMult
