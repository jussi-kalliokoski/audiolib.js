void function () {
    "use strict";

    /**
     * A Node that takes frequency values as input to generate phase values as output.
     *
     * @class
    */
    function Phasor () {
        AudioKit.Node.apply(this, arguments);
    }

    Phasor.prototype.defaults = {
        frequency: 440,
        pulseWidth: 0.5
    };

    /**
     * Calculates the phase based on the frequency.
     *
     * @param {Float32Array} phase The array to write the phase to.
    */
    Phasor.prototype.process = function (phase) {
        var offset = this.blockSize - AudioKit.Tools.calculateOffset(
            phase,
            this.frequency,
            this.pulseWidth
        );

        var frequency = AudioKit.Tools.offset(this.params.frequency, offset);
        var pulseWidth = AudioKit.Tools.offset(this.params.pulseWidth, offset);

        this._calculatePhases(phase);

        ArrayMath.fract(phase, phase);

        if ( pulseWidth !== 0.5 ) {
            this._modulatePulseWidth(phase, phase, pulseWidth);
        }
    };

    Phasor.prototype._calculatePhases = function (phase, frequency) {
        ArrayMath.pow(frequency, 2, frequency);
        ArrayMath.add(frequency, frequency, 1);
        ArrayMath.mul(frequency, frequency, frequency);

        var lastPhase = this.lastPhase[0] % 1;

        ArrayMath.add(phase, 1 / this.sampleRate / 2);
        ArrayMath.mul(phase, phase, frequency);

        for ( var i = 0; i < phase.length; i++ ) {
            phase[i] = lastPhase = lastPhase + phase[i];
        }

        lastPhase[0] = lastPhase;
    };

    Phasor.prototype._modulatePulseWidth = function (destination, phase, pulseWidth) {
        /* FIXME: this gives weird results */
        var i;

        if ( pulseWidth instanceof Float32Array ) {
            for ( i = 0; i < destination.length; i++ ) {
                destination[i] = phase[i] < pulseWidth[i] ?
                    phase[i] / pulseWidth[i] : (phase[i] - pulseWidth[i]) / (1 - pulseWidth[i]);
            }
        } else {
            for ( i = 0; i < destination.length; i++ ) {
                destination[i] = phase[i] < pulseWidth ?
                    phase[i] / pulseWidth : (phase[i] - pulseWidth) / (1 - pulseWidth);
            }
        }
    };

    AudioKit.Node.inheritBy(Phasor);
    AudioKit.Nodes.Phasor = Phasor;
}();
