AudioKit.Tools.calculateOffset = function () {
    "use strict";

    return Math.min.apply(_.map(_.filter(arguments, function (buffer) {
        return buffer instanceof Float32Array;
    }), function (buffer) {
        return buffer.length;
    }));
};
