AudioKit.Tools.offset = function (buffer, offset) {
    "use strict";

    if ( buffer instanceof Float32Array ) {
        return buffer.subarray(offset);
    }

    return buffer;
};
