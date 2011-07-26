/**
 * Creates a Compressor Effect
 * 
 * @constructor
 * @this {Compressor}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} scaleBy (Optional) Signal scaling factor. If mixing n unscaled waveforms, use scaleBy=n.
 * @param {number} gain (Optional) Gain factor (1.0 - 2.0).
*/
function Compressor(sampleRate, scaleBy, gain){
    var self    = this,
        sample  = 0.0;
    self.sampleRate = sampleRate;
    self.scale = scaleBy || 1;
    self.gain = gain || 0.5;
    self.pushSample = function(s){
        s /= self.scale;
        sample = (1+self.gain)*s - self.gain*s*s*s;
        return sample;
    };
    self.getMix = function(){
        return sample;
    };

}
