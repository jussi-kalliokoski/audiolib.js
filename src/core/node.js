void function () {
    "use strict";

    if (typeof require !== 'undefined') var _ = require('underscore')

    function Node (options) {
        if ( ! ( this instanceof Node ) ) {
            throw new Error(this.constructor.name + " cannot be called without `new`");
        }

        options = options || {};
        this.parameters = _.extend({}, this.defaults, options.parameters);
        this.sampleRate = options.sampleRate || 48000;
        this.blockSize = options.blockSize || 4096;
    }

    Node.prototype = {
        constructor: Node
    };

    Node.inheritBy = function (NodeClass) {
        var proto = _.extend(Object.create(this.prototype), NodeClass.prototype);
        proto.constructor = NodeClass;
        _.extend(NodeClass, this);
        NodeClass.prototype = proto;
    };

    AudioKit.Node = Node;
}();
