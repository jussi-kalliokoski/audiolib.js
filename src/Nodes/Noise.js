"use strict";

var Node = require('../Node');
var Tools = require('../Tools');
var ArrayMath = require('dsp');

/**
 * A Node that takes frequency values as input to generate phase values as output.
 *
 * @class
*/
function Noise () {
    Node.apply(this, arguments);
    this.setColor(this.parameters.color);
}

Noise.prototype.defaults = {
    color: "white"
};

Noise.colors = {
    white: function () {},

    brown: function (dst, filter, sampleRate) {
        filter.a[0] = Math.exp(-200 * Math.PI / sampleRate);
        filter.b[0] = 1 - filter.a[0];
        filter.filter(dst, new Float32Array(dst));
        ArrayMath.mul(dst, dst, 6.2);
    },

    pink: function (dst, filter) {
        filter.filter(dst, new Float32Array(dst));
        ArrayMath.mul(dst, dst, 0.55);
    }
};


Noise.prototype.process = function (dst) {
    var color = this.parameters.color;
    var filter = this.filter;
    var sampleRate = this.sampleRate;

    ArrayMath.random(dst, -1, 1);
    Noise.colors[color](dst, filter, sampleRate);
};

Noise.prototype.setColor = function (color) {
    var filter = null;

    switch ( color ) {
    case "white":
        break;
    case "brown":
        this.filter = new ArrayMath.Filter(1, 1);
        break;
    case "pink":
        this.filter = new ArrayMath.Filter(6, 6);
        this.filter.setA(new Float32Array([0.997, 0.985, 0.950, 0.850, 0.620, 0.250]));
        this.filter.setB(new Float32Array([
            0.029591,
            0.032534,
            0.048056,
            0.090579,
            0.108990,
            0.255784
        ]));
        break;
    default:
        throw new Error("Not implemented");
    }

    this.parameters.color = color;
};

Node.inheritBy(Noise);
module.exports = Noise;
