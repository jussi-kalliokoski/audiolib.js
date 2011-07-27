// Adapted from http://www.musicdsp.org/files/Audio-EQ-Cookbook.txt

/**
 * Parent constructor for Biquad Filter Effects
 * 
 * @constructor
 * @this {BiquadFilter}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} a0 (Optional) Bit resolution of output signal. Defaults to 8.
*/
function BiquadFilter(sampleRate, a0, a1, a2, b1, b2){
    var self    = this,
        sample  = 0.0;
    self.inputs     = [0,0];
    self.outputs    = [0,0];
    self.sampleRate = sampleRate;
    self.coefs      = { a0:a0, a1:a1, a2:a2, b1:b1, b2:b2 };
    
    self.pushSample = function(s){
        var c = self.coefs,
            i = self.inputs,
            o = self.outputs;
        sample = c.a0 * s + c.a1 * i[0] + c.a2 * i[1] - c.b1 * o[0] - c.b2 * o[1];
        i.pop();
        i.unshift(s);
        o.pop();
        o.unshift(sample);
        
        return sample;
    };
    self.getMix = function(){
        return sample;
    };
    
    self.reset = function(){
        self.inputs = self.outputs = [0,0];
    };

}

/**
 * Creates a Biquad Low-Pass Filter Effect
 * 
 * @constructor
 * @this {BiquadFilter}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} cutoff Low-pass cutoff frequency (hz).
 * @param {number} Q Filter Q-factor (Q<0.5 filter underdamped, Q>0.5 filter overdamped)
*/
BiquadFilter.LowPass = function(sampleRate, cutoff, Q){
    var w0      = 2* Math.PI*cutoff/sampleRate,
        cosw0   = Math.cos(w0),
        sinw0   = Math.sin(w0),
        alpha   = sinw0/(2*Q),
        b0      =  (1 - cosw0)/2,
        b1      =   1 - cosw0,
        b2      =   b0,
        a0      =   1 + alpha,
        a1      =  -2*cosw0,
        a2      =   1 - alpha;
    return new BiquadFilter(sampleRate, b0/a0, b1/a0, b2/a0, a1/a0, a2/a0);
}

/**
 * Creates a Biquad High-Pass Filter Effect
 * 
 * @constructor
 * @this {BiquadFilter}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} cutoff High-pass cutoff frequency (hz).
 * @param {number} Q Filter Q-factor (Q<0.5 filter underdamped, Q>0.5 filter overdamped)
*/
BiquadFilter.HighPass = function(sampleRate, cutoff, Q){
    var w0      = 2* Math.PI*cutoff/sampleRate,
        cosw0   = Math.cos(w0),
        sinw0   = Math.sin(w0),
        alpha   = sinw0/(2*Q),
        b0      =  (1 + cosw0)/2,
        b1      = -(1 + cosw0),
        b2      =   b0,
        a0      =   1 + alpha,
        a1      =  -2*cosw0,
        a2      =   1 - alpha;
    return new audioLib.BiquadFilter(sampleRate, b0/a0, b1/a0, b2/a0, a1/a0, a2/a0);
}

/**
 * Creates a Biquad All-Pass Filter Effect
 * 
 * @constructor
 * @this {BiquadFilter}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} f0 Significant frequency: filter will cause a phase shift of 180deg at f0 (hz).
 * @param {number} Q Filter Q-factor (Q<0.5 filter underdamped, Q>0.5 filter overdamped)
*/
BiquadFilter.AllPass = function(sampleRate, f0, Q){
    var w0      = 2* Math.PI*f0/sampleRate,
        cosw0   = Math.cos(w0),
        sinw0   = Math.sin(w0),
        alpha   = sinw0/(2*Q),
        b0      =  1 - alpha,
        b1      = -2*cosw0,
        b2      =  1 + alpha,
        a0      =  b2,
        a1      =  b1,
        a2      =  b0;
    return new audioLib.BiquadFilter(sampleRate, b0/a0, b1/a0, b2/a0, a1/a0, a2/a0);
}
