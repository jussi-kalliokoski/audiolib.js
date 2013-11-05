void function () {
    "use strict";

    /**
     * A Node that takes frequency values as input to generate phase values as output.
     *
     * @class
    */
    function Phasor () {
        AudioKit.Node.apply(this, arguments);
        this.lastPhase = this.parameters.initialPhase;
    }

    Phasor.prototype.defaults = {
        frequency: 440,
        pulseWidth: 1,
        initialPhase: 0
    };

    /**
     * Calculates the phase based on the frequency.
     *
     * @param {Float32Array} phase The array to write the phase to.
    */
    Phasor.prototype.process = function (phase) {
        var offset = this.blockSize - AudioKit.Tools.calculateOffset(
            phase,
            this.parameters.frequency,
            this.parameters.pulseWidth
        );

        var frequency = AudioKit.Tools.offset(this.parameters.frequency, offset);
        var pulseWidth = AudioKit.Tools.offset(this.parameters.pulseWidth, offset);

        this._calculatePhases(phase, frequency);
        ArrayMath.fract(phase, phase);

        if ( pulseWidth !== 0.5 ) {
            this._modulatePulseWidth(phase, phase, pulseWidth);
        }
    };

    Phasor.prototype._calculatePhases = function (phase, frequency) {
        ArrayMath.add(phase, frequency, phase); 
        ArrayMath.mul(phase, 1 / this.sampleRate, phase);

        var lastPhase = phase[0] = this.lastPhase;
        for ( var i = 1; i < phase.length; i++ ) {
            phase[i] = lastPhase = lastPhase + phase[i];
        }

        this.lastPhase = lastPhase;
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
