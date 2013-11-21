var EventEmitter = require('./EventEmitter').EventEmitter;

exports.LineSegment = LineSegment;

/**
 * A segment of a line, connecting a LineNodes (or a point) to another LineNode (or point).
 * @constructor
 * @class LineNode
 * @extends {EventEmitter}
 */
function LineSegment(options){
    options = options || {};
    EventEmitter.call(this);
    this.line =     options.line    || null;
    this.from =     options.from    || null;
    this.to =       options.to      || null;
    this.isHorizontal = typeof(options.isHorizontal)=="undefined" ? true : !!options.isHorizontal; // If false: vertical
};
LineSegment.prototype = new Object(EventEmitter.prototype);

/**
 * Sets the position of this linesegment. If it is horizontal, the position is along the the horizontal axis.
 * @method setPosition
 * @param  {Number} x
 * @return {linesegment} Self.
 * @todo
 */
LineSegment.prototype.setPosition = function(x){
    if(this.isHorizontal){
        this.from.position.x = x;
        this.to.position.x = x;
    } else {
        this.from.position.y = x;
        this.to.position.y = x;
    }

    this.line.emitChange();

    return this;
};

LineSegment.prototype.length = function(){
    var r = this.from.position.subtract(this.to.position);
    return r.norm();
};

LineSegment.prototype.getAABB = function(aabbMin,aabbMax,margin){
    var fp = this.from.position,
        tp = this.to.position;
    aabbMin.x = Math.min(fp.x, tp.x) - margin;
    aabbMin.y = Math.min(fp.y, tp.y) - margin;
    aabbMax.x = Math.max(fp.x, tp.x) + margin;
    aabbMax.y = Math.max(fp.y, tp.y) + margin;
};
