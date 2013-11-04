AudioKit.Tools.calculateOffset = function () {
    "use strict";

    if (typeof require !== 'undefined') var _ = require('underscore')

    return Math.min.apply(Math, _.map(_.filter(arguments, function (buffer) {
        return buffer instanceof Float32Array;
    }), function (buffer) {
        return buffer.length;
    }));
};
