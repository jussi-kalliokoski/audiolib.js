void function () {
    "use strict";

    function SimpleOscillator () {
        AudioKit.Source.apply(this, arguments);
    }

    SimpleOscillator.prototype.defaults = {
        phase: 0,
        waveform: "sine"
    };

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
        sine: function (dst, phases) {
            ArrayMath.mul(dst, phases, Math.PI * 2);
            ArrayMath.sin(dst, dst);
        },

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
}();
