_ = require('underscore')
mustache = require('mustache')
fs = require('fs')
path = require('path')
ArrayMath = require('../dist/webarraymath')
chai = require('chai')
expect = chai.expect
chaiStats = require('chai-stats')
chai.use(chaiStats)

module.exports.testAgainstFile = (actual, filename, opts, done) ->
  decimals = opts.decimals or 5
  toUInt16 = opts.toUInt16 or false 
  origActual = _.toArray(actual)
  actual = if toUInt16 then floatArrayToInt(actual) else actual
  filepath = path.normalize(path.join(__dirname, 'dsp-test-files/test-files', filename))

  fs.readFile filepath, (err, data) ->
    throw err if err
    expected = JSON.parse(data.toString())

    try
      expect(actual).almost.eql(expected, decimals)

    catch assertErr
      return renderFailurePlots expected, actual, (err) ->
        throw err if err
        errStr = assertErr.toString()

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
          debugger
          # Building a more useful error message
          errStr += ' \n > biggest diff ' + maxDiff.val + ', position ' + maxDiff.pos + ' : '
          errStr += '\n\t\texpected' + JSON.stringify(expected.slice(probeLo, probeHi))
          errStr += '\n\t\tactual ' + JSON.stringify(actual.slice(probeLo, probeHi))
          errStr += '\n\t\torig actual' + JSON.stringify(origActual.slice(probeLo, probeHi)) if toUInt16

        throw new Error(errStr + '\n > plots rendered in ' + renderedPath)
    done()

renderFailurePlots = module.exports.renderFailurePlots = (expected, actual, done) ->
  fs.readFile templatePath, (err, data) ->
    throw err if err
    rendered = mustache.render(data.toString(), {
      dataActual: JSON.stringify(actual),
      dataExpected: JSON.stringify(expected)
    })
    fs.writeFile(renderedPath, rendered, done)

floatArrayToInt = module.exports.floatArrayToInt = (array) ->
  floatToInt val for val in array
  
floatToInt = (val) ->
  Math.max(Math.min(Math.floor(val * pcmMult), pcmMax), pcmMin)
pcmMult = Math.pow(2, 15)
pcmMax = pcmMult - 1
pcmMin = -pcmMult

templatePath = path.join(__dirname, 'plots', 'index.mustache')
renderedPath = path.join(__dirname, 'plots', 'index.html')
