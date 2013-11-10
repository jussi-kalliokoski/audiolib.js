"use strict";

module.exports = {

    Bartlett: function (buffer) {
        var max = buffer.length - 1;
        ArrayMath.ramp(buffer, 0, max);
        ArrayMath.add(buffer, -max / 2, buffer);
        ArrayMath.abs(buffer, buffer);
        ArrayMath.sub(buffer, max / 2, buffer);
        ArrayMath.mul(buffer, 2 / max, buffer);
    },

    BartlettHann: function (buffer) {
        var max = buffer.length - 1;
        ArrayMath.ramp(buffer, 0, max);
        ArrayMath.mul(buffer, 1 / max, buffer);
        var temporaryBuffer = new Float32Array(buffer);
        ArrayMath.mul(buffer, 2 * Math.PI, buffer);
        ArrayMath.cos(buffer, buffer);
        ArrayMath.mul(buffer, 0.38, buffer);
        ArrayMath.add(temporaryBuffer, -0.5, temporaryBuffer);
        ArrayMath.abs(temporaryBuffer, temporaryBuffer);
        ArrayMath.mul(temporaryBuffer, 0.48, temporaryBuffer);
        ArrayMath.sub(temporaryBuffer, 0.62, temporaryBuffer);
        ArrayMath.sub(buffer, temporaryBuffer, buffer);
    },

    Blackman: function (buffer, alpha) {
        var max = buffer.length - 1;
        ArrayMath.ramp(buffer, 0, max);
        ArrayMath.mul(buffer, 1 / max, buffer);
        ArrayMath.mul(buffer, 2 * Math.PI, buffer);
        var temporaryBuffer = new Float32Array(buffer);
        ArrayMath.cos(buffer, buffer);
        ArrayMath.mul(buffer, -0.5, buffer);
        ArrayMath.mul(temporaryBuffer, 2, temporaryBuffer);
        ArrayMath.cos(temporaryBuffer, temporaryBuffer);
        ArrayMath.mul(temporaryBuffer, alpha / 2, temporaryBuffer);
        ArrayMath.add(temporaryBuffer, (1 - alpha) / 2, temporaryBuffer);
        ArrayMath.add(buffer, buffer, temporaryBuffer);
    },

    Cosine: function (buffer) {
        var max = buffer.length - 1;
        ArrayMath.ramp(buffer, 0, max);
        ArrayMath.mul(buffer, Math.PI / max, buffer);
        ArrayMath.add(buffer, -Math.PI / 2, buffer);
        ArrayMath.cos(buffer, buffer);
    },

    Gauss: function (buffer, alpha) {
        var max = buffer.length - 1;
        ArrayMath.ramp(buffer, 0, max);
        ArrayMath.add(buffer, -max / 2, buffer);
        ArrayMath.mul(buffer, 2 * alpha * max, buffer);
        ArrayMath.pow(buffer, buffer, 2);
        ArrayMath.mul(buffer, -0.5, buffer);
        var temporaryBuffer = new Float32Array(buffer.length);
        ArrayMath.add(temporaryBuffer, Math.E, temporaryBuffer);
        ArrayMath.pow(buffer, temporaryBuffer, buffer);
    },

    Hamming: function (buffer) {
        var max = buffer.length - 1;
        ArrayMath.ramp(buffer, 0, max);
        ArrayMath.mul(buffer, 2 * Math.PI / max, buffer);
        ArrayMath.cos(buffer, buffer);
        ArrayMath.mul(buffer, 0.46, buffer);
        ArrayMath.sub(buffer, 0.54, buffer);
    },

    Hann: function (buffer) {
        var max = buffer.length - 1;
        ArrayMath.ramp(buffer, 0, max);
        ArrayMath.mul(buffer, 2 * Math.PI / max, buffer);
        ArrayMath.cos(buffer, buffer);
        ArrayMath.sub(buffer, 1.0, buffer);
        ArrayMath.mul(buffer, 0.5, buffer);
    },

    Lanczos: function (buffer) {
        var max = buffer.length - 1;
        ArrayMath.ramp(buffer, 0, max);
        ArrayMath.mul(buffer, 2 / max, buffer);
        ArrayMath.add(buffer, -1, buffer);
        ArrayMath.mul(buffer, Math.PI, buffer);
        var temporaryBuffer = new Float32Array(buffer);
        ArrayMath.sin(buffer, buffer);
        ArrayMath.div(buffer, buffer, temporaryBuffer);
    },

    Rectangular: function (buffer) {
        ArrayMath.add(buffer, 1, new Float32Array(buffer.length));
    },

    Triangular: function (buffer) {
        var max = buffer.length - 1;
        ArrayMath.ramp(buffer, 0, max);
        ArrayMath.add(buffer, -max / 2, buffer);
        ArrayMath.abs(buffer, buffer);
        ArrayMath.sub(buffer, buffer.length / 2, buffer);
        ArrayMath.mul(buffer, 2 / buffer.length, buffer);
    }
};
