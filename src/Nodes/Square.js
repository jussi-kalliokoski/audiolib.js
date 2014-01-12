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
function Square (options) {
    Node.call(this, options);
    this.phasor = new Phasor(options);
};

Square.prototype.defaults = {
    frequency: 440,
    initialPhase: null
};

/**
 * blabla
 *
 * @param {Float32Array} blabla.
*/
Square.prototype.process = function (dst, frequency) {
    this.phasor.process(dst, frequency);
    ArrayMath.mul(dst, Math.PI * 2, dst);
    ArrayMath.sin(dst, dst);
    ArrayMath.sign(dst, dst);
};

Node.inheritBy(Square);
module.exports = Square;
