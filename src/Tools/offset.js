"use strict";

var _ = require('underscore');

// TODO: Does what ?
module.exports.offset = function (buffer, offset) {
    if ( buffer instanceof Float32Array ) {
        return buffer.subarray(offset);
    }

    return buffer;
};

// TODO: Does what ?
module.exports.calculateOffset = function () {
    return Math.min.apply(Math, _.map(_.filter(arguments, function (buffer) {
        return buffer instanceof Float32Array;
    }), function (buffer) {
        return buffer.length;
    }));
};
