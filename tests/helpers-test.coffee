assert = require('assert')
helpers = require('./helpers')

describe "helpers", () ->

  describe "assertPeriodicApproxEqual", () ->

    it "should accept values directly within tolerance", () ->
      helpers.assertPeriodicApproxEqual(1, 1, 1000, 0)
      helpers.assertPeriodicApproxEqual(1, 1, 1000, 0.1)
      helpers.assertPeriodicApproxEqual(100, 200, 1000, 0.1)
      helpers.assertPeriodicApproxEqual(-100, -300, 1000, 0.2)
      
    it "should accept values modulo within tolerance", () ->
      helpers.assertPeriodicApproxEqual(900, 1100, 1000, 0.2)
      helpers.assertPeriodicApproxEqual(100, 1050, 1000, 0.2)
      helpers.assertPeriodicApproxEqual(1900, 5010, 1000, 0.2)
      helpers.assertPeriodicApproxEqual(1100, 5000, 1000, 0.2)
      helpers.assertPeriodicApproxEqual(-100, 50, 1000, 0.2)
      helpers.assertPeriodicApproxEqual(-1100, -980, 1000, 0.2)
      helpers.assertPeriodicApproxEqual(-11000, 5000, 1000, 0.2)

    it "should reject values not within tolerance bounds", () ->
      assert.throws(() -> helpers.assertPeriodicApproxEqual(100, 201, 1000, 0.1))
      assert.throws(() -> helpers.assertPeriodicApproxEqual(900, 1100, 1000, 0.1))
      assert.throws(() -> helpers.assertPeriodicApproxEqual(100, 1250, 1000, 0.1))
      assert.throws(() -> helpers.assertPeriodicApproxEqual(1000, 5500, 1000, 0.1))
      assert.throws(() -> helpers.assertPeriodicApproxEqual(-10000, 5500, 1000, 0.1))
