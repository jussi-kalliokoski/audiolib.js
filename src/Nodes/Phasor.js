"use strict";

var Node = require('../Node');
var Tools = require('../Tools');
var ArrayMath = require('dsp');

/**
 * A Node that takes frequency values as input to generate phase values as output.
 *
 * @class
*/
function Phasor (options) {
    Node.call(this, options);
    this.lastPhase = this.parameters.initialPhase;
};

Phasor.prototype.defaults = {
    frequency: 440,
    initialPhase: null
};

/**
 * Calculates the phase based on the frequency.
 *
 * @param {Float32Array} phase The array to write the phase to.
*/
Phasor.prototype.process = function (phase, frequency) {
    frequency = frequency || this.parameters.frequency
    var offset = this.blockSize - Tools.calculateOffset(
        phase,
        frequency || frequency
    );
    frequency = Tools.offset(frequency, offset);

    ArrayMath.add(phase, frequency, phase);
    ArrayMath.mul(phase, 1 / this.sampleRate, phase);

    var lastPhase = this.lastPhase;

    // If `lastPhase` hasn't been initialized, we force the first phase to be 0.
    if (lastPhase === null) lastPhase = -phase[0];

    for ( var i = 0; i < phase.length; i++ ) {
        phase[i] = lastPhase = lastPhase + phase[i];
    }

    ArrayMath.fract(phase, phase);
    this.lastPhase = lastPhase;
};

Node.inheritBy(Phasor);
module.exports = Phasor;
