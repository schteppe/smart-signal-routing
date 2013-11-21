var EventEmitter = require('./EventEmitter').EventEmitter
,   Vec2 = require('./Vec2').Vec2

exports.LineNode = LineNode;

/**
 * A node in a Line.
 * @constructor
 * @class LineNode
 * @extends {EventEmitter}
 */
function LineNode(options){
    options = options || {};
    EventEmitter.call(this);
    this.position = new Vec2( options.x||0, options.y||0 );
};
LineNode.prototype = new Object(EventEmitter.prototype);
