"use strict";

var Node = require('../Node');
var Phasor = require('./Phasor');
var Tools = require('../Tools');
var ArrayMath = require('dsp');

/**
 * A blabla.
 *
 * @class
*/
function Sine (options) {
    Node.call(this, options);
    this.phasor = new Phasor(options);
};

Sine.prototype.defaults = {
    frequency: 440,
    initialPhase: null
};

/**
 * blabla
 *
 * @param {Float32Array} blabla.
*/
Sine.prototype.process = function (dst, frequency) {
    this.phasor.process(dst, frequency);
    ArrayMath.mul(dst, Math.PI * 2, dst);
    ArrayMath.sin(dst, dst);
};

Node.inheritBy(Sine);
module.exports = Sine;
