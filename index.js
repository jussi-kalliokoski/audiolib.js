var AudioKit = {}

AudioKit.Node = require('./src/Node')

AudioKit.Nodes = {}
AudioKit.Nodes.Phasor = require('./src/Nodes/Phasor')

AudioKit.WindowFunctions = require('./src/WindowFunctions')

if (typeof window !== 'undefined') window.AudioKit = AudioKit
else module.exports = AudioKit
