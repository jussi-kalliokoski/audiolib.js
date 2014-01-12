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

/*
SimpleOscillator.prototype.process = function (dst) {
    var offset = this.blockSize - dst.length;
    var waveform = this.params.waveform;
    var phases = this.params.phase;

    if ( offset ) {
        phases = phases.subarray(offset);
    }

    SimpleOscillator.Waveforms[waveform](dst, phases);
};

SimpleOscillator.Waveforms = {

    square: function (dst, phases) {
        ArrayMath.mul(dst, phases, Math.PI * 2);
        ArrayMath.sin(dst, dst);
        ArrayMath.sign(dst, dst);
    },

    sawtooth: function (dst, phases) {
        ArrayMath.mul(dst, dst, -2);
        ArrayMath.add(dst, dst, 1);
    },

    inverseSawtooth: function (dst, phases) {
        ArrayMath.mul(dst, dst, 2);
        ArrayMath.sub(dst, dst, 1);
    },

    triangle: function (dst, phases) {
        for ( var i = 0; i < dst.length; i++ ) {
            dst[i] = dst[i] < 0.5 ? 4 * dst[i] - 1 : 3 - 4 * dst[i];
        }
    },

    pulse: function (dst, phases) {
        for ( var i = 0; i < dst.length; i++ ) {
            dst[i] = dst[i] < 0.5 ?
                dst[i] < 0.25 ?
                    dst[i] * 8 - 1 :
                    -dst[i] * 8 - 1 :
                -1;
        }
    }
};
*/
