var EventEmitter = require('./EventEmitter').EventEmitter
,   Vec2 = require('./Vec2').Vec2
,   Connector = require('./Connector').Connector

exports.Box = Box;

/**
 * A box in the diagram.
 * @constructor
 * @class Box
 */
function Box(options){
    options = options || {};
    EventEmitter.call(this);
    this.diagram = options.diagram || null;
    this.position = new Vec2(options.x||0 , options.y||0);
    this.width = options.width || 150;
    this.height = options.height || 100;
    this.margin = options.margin || 10;
    this.connectors = [];
};
Box.prototype = new Object(EventEmitter.prototype);

/**
 * Create a connector on one of the box sides
 * @method createConnector
 * @param  {Object} options
 * @return {Box} Self.
 */
Box.prototype.createConnector = function(options){
    options = options || {};
    options.box = this;
    var c = new Connector(options);
    this.connectors.push(c);
    this.emit({
        type:"createConnector",
        connector : c,
    });
    return c;
};

/**
 * Set the box position
 * @method setPosition
 * @param  {Number} x
 * @param  {Number} y
 * @return {Box} Self
 * @todo Should check if it crosses other boxes - and stop if it does?
 * @todo Emit event for end points of lines changing positions
 */
Box.prototype.setPosition = function(x,y){
    this.position.x = x;
    this.position.y = y;
    this.emit({
        type:"change"
    });
    return this;
};

/**
 * Get the bounding box of the box, including the margin.
 * @method getBoundingBox
 */
Box.prototype.getBoundingBox = function(){
    var p = this.position,
        m = this.margin;
    return [
        new Vec2(p.x - m,                 p.y - m               ),
        new Vec2(p.x + m + this.width,    p.y + m + this.height ),
    ];
};

/**
 * Get connectors on a given side.
 * @param  {String} side
 * @return {Array}
 */
Box.prototype.getSideConnectors = function(side) {
    var result = [];

    for(var i=0, cs=this.connectors; i<cs.length; i++){
        var c = cs[i];
        if(c.side == side)
            result.push(c);
    }

    return result;
}
