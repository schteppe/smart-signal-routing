var EventEmitter = require('./EventEmitter').EventEmitter
,   Vec2 = require('./Vec2').Vec2
,   Line = require('./Line').Line

exports.Connector = Connector;

/**
 * A Connector on a box.
 * @constructor
 * @class Connector
 */
function Connector(options){
    options = options || {};
    EventEmitter.call(this);
    this.position = options.position    || 0; // Normalized coordinates. 0=center, -1 and 1=corners on box side
    this.box =      options.box         || null;
    this.side =     options.side        || "right";
    this.lines = []; // Connected lines

    var that = this;

    // Propagate change event
    this.box.on("change",function(e){
        that.emit({
            type : "change",
        });
        for (var i = 0; i < that.lines.length; i++) {
            that.lines[i].emitEndsChange();
        };
    });
};
Connector.prototype = new Object(EventEmitter.prototype);

/**
 * Get the diagram position of this Connector
 * @method getPosition
 * @return {Vec2}
 */
Connector.prototype.getPosition = function(addMargin){
    var p = new Vec2(),
        b = this.box,
        bp = b.position,
        pos = this.position,
        w = b.width,
        h = b.height,
        m = b.margin;

    switch(this.side){
        case "top":
            p.x = bp.x + w/2 * ( 1 + pos );
            p.y = bp.y;
            if(addMargin) p.y += m;
            break;
        case "left":
            p.x = bp.x;
            p.y = bp.y + h/2 * ( 1 + pos );
            if(addMargin) p.x -= m;
            break;
        case "right":
            p.x = bp.x + w;
            p.y = bp.y + h/2 * ( 1 + pos );
            if(addMargin) p.x += m;
            break;
        case "bottom":
            p.x = bp.x + w/2 * ( 1 + pos );
            p.y = bp.y + h;
            if(addMargin) p.y -= m;
            break;
        default:
            throw new Error("Side not supported: "+this.side);
    }

    return p;
};

/**
 * Creates a Line connected to this Connector and to a point. The point is initially the same position as the connector.
 * @method spawnLine
 * @return {Line}
 */
Connector.prototype.spawnLine = function(){
    var l = this.box.diagram.createLine({
        from : this,
        to : this.getPosition(), // Add an initial position
    });
    this.lines.push(l);
    return l;
};

/**
 * Clone this object
 * @method clone
 * @return {Connector}
 */
Connector.prototype.clone = function() {
    return new Connector({
        position : this.position,
        box : this.box,
        side : this.side,
    });
};
