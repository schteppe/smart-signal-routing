var EventEmitter = require('./EventEmitter').EventEmitter
,   Box = require('./Box').Box
,   Line = require('./Line').Line
,   Vec2 = require('./Vec2').Vec2
,   _ = require('underscore')

exports.Diagram = Diagram;

/**
 * The diagram area.
 * @constructor
 * @class Diagram
 */
function Diagram(options){
    options = options || {};
    EventEmitter.call(this);
    this.boxes = [];
    this.lines = [];
};
Diagram.prototype = new Object(EventEmitter.prototype);

/**
 * Create a box in the diagram
 * @method createBox
 * @param  {Object} options
 * @return {Box}
 */
Diagram.prototype.createBox = function(options){
    options = options || {};
    options.diagram = this;
    var b = new Box(options);
    this.boxes.push(b);
    this.emit({
        type : "createBox",
        box : b,
    });
    return b;
};

/**
 * Create a line in the diagram
 * @method createLine
 * @param  {Object} options
 * @return {Line}
 */
Diagram.prototype.createLine = function(options){
    options = options || {};
    options.diagram = this;
    var b = new Line(options);
    this.lines.push(b);
    this.emit({
        type : "createLine",
        line : b,
    });
    return b;
};

/**
 * Delete a box in the diagram
 * @method destroyBox
 * @param  {Object} options
 */
Diagram.prototype.destroyBox = function(b){
    var i = this.boxes.indexOf(b);
    if(i!=-1)
        this.boxes.splice(i,1);
    this.emit({
        type : "destroyBox",
        box : b,
    });
};

/**
 * Delete a box in the diagram
 * @method destroyBox
 * @param  {Object} options
 */
Diagram.prototype.destroyLine = function(l){
    var i = this.lines.indexOf(l);
    if(i!=-1)
        this.lines.splice(i,1);
    l.emitDestroy();
    this.emit({
        type : "destroyLine",
        line : l,
    });
};

/**
 * Get the bounding box of the diagram contents
 * @method getBoundingBox
 */
Diagram.prototype.getBoundingBox = function(aabbMin,aabbMax) {
    // Todo
};

/**
 * Run a hit test. Matches boxes and lines.
 * @method hitTest
 * @param  {Number} x
 * @param  {Number} y
 * @return {Array} An array of objects that were hit.
 * @todo should use bounding boxes
 */
Diagram.prototype.hitTest = function(x,y,options) {
    options = options || {};
    var settings = {
        precision : 10,
    };

    var p = settings.precision;
    var v = new Vec2(x,y);
    var result = [];

    // Check boxes
    for(var i=0; i<this.boxes.length; i++){
        var b = this.boxes[i];
        if( x < b.position.x-p ||
            x > b.position.x+b.width+p ||
            y < b.position.y-p ||
            y > b.position.y+b.height+p ){
            continue;
        }
        result.push(b);
    }

    // Check connectors
    for(var i=0; i<this.boxes.length; i++){
        var b = this.boxes[i];

        for(var j=0; j<b.connectors.length; j++){
            var c = b.connectors[j];
            if( v.equal(c.getPosition(),p) ){
                result.push(c);
            }
        }
    }

    // Check line segments
    for(var i=0; i<this.lines.length; i++){
        var l = this.lines[i];
        for(var j = 0; j<l.segments.length; j++){
            var s = l.segments[j];
            if(s.from.position.equal(v,p) ){
                result.push(s);
            }
        }
    }

    // Check line nodes
    for(var i=0; i<this.lines.length; i++){
        var l = this.lines[i];
        for(var j = 0; j<l.nodes.length; j++){
            var n = l.nodes[j];
            if(n.position.equal(v,p) ){
                result.push(n);
            }
        }
    }

    return result;
};

/**
 * Raycast a point onto other objects in the Diagram area.
 * @param  {Number} x
 * @param  {Number} y
 * @param  {Number} direction 0=top, 1=right, 2=bottom, 3=left
 * @param  {Object} options
 * @return {Array} An array with [point1,object1,point2,object2...]
 */
Diagram.prototype.rayCast = function(x,y,direction,options){
    options = options || {};

    var result = [];

    var settings = {
        ignore : [],
        onlyFirst : false,
        onMargin : false,
    };

    _.extend(settings,options);

    if(direction < 0 || direction > 3){
        throw new Error("Raycast direction not recognized");
    }

    var isTop =    direction == 0,
        isRight =  direction == 1,
        isBottom = direction == 2,
        isLeft =   direction == 3;

    // Want to sort the boxes array, but we better get an own copy of it s owe don't mess it up
    var boxes = this.boxes.slice(0);

    // Sort so we get the closest boxes first.
    // This is needed since we will stop projecting after the first hit.
    boxes.sort(function(a,b){
        var ap = a.position,
            bp = b.position,
            am = settings.onMargin ? a.margin : 0,
            bm = settings.onMargin ? b.margin : 0;

        if(isLeft)        return (bp.x+bm+b.width)  - (ap.x+am+a.width);    // Descending .x
        else if(isTop)    return (bp.y+bm+b.height) - (ap.y+am+a.height);   // Descending .y
        else if(isRight)  return (ap.x-am)          - (bp.x-bm);            // Ascending  .x
        else if(isBottom) return (ap.y-am)          - (bp.y-bm);            // Ascending  .y
        return 0; // ?
    });

    for(var j=0; j<boxes.length; j++){
        var b = boxes[j],
            bp = b.position,
            m = settings.onMargin ? b.margin : 0,
            w = b.width,
            h = b.height;

        if(settings.ignore.indexOf(b) != -1){
            continue; // Skip box
        }

        // Can we even hit the box with a ray in the given direction?
        if((isRight || isLeft) && !(y > bp.y-m && y < bp.y+h+m)){
            continue;
        }
        if((isTop || isBottom) && !(x > bp.x-m && x < bp.x+w +m)){
            continue;
        }

        var point;
        if(isRight){
            if(!(x < bp.x)) continue;
            point = new Vec2(bp.x - m, y); // Hit on the left side of the box

        } else if(isLeft){
            if(!(x > bp.x+w)) continue;
            point = new Vec2(bp.x+w+m,y); // Hit on the right side of the box

        } else if(isTop){
            if(!(y > bp.y)) continue;
            point = new Vec2(x,bp.y + h + m); // Hit on bottom

        } else if(isBottom){
            if(!(y < bp.y + h)) continue;
            point = new Vec2(x, bp.y - m); // Hit on top

        } else {
            throw new Error("WTF!?");
        }

        result.push(point,b);

        if(settings.onlyFirst){
            break; // We only need one projection on the first, nearest one
        }
    }

    // Check lines
    var segments = [],
        lines = this.lines;

    for(var i=0; i<lines.length; i++){
        var l = lines[i],
            segs = l.segments,
            skip = false;

        if(settings.ignore.indexOf(l) != -1){
            continue; // Skip line
        }

        for(var j=0; j<segs.length; j++){
            var s = segs[j];

            // If margin collisions is off, we can reject the colinear collisions already
            var colinear = (
                s.isHorizontal && ( direction==1 || direction==3 )
            ) || (
                !s.isHorizontal && ( direction==0 || direction==2 )
            );

            if(!settings.onMargin && colinear){
                continue;
            }

            if(settings.ignore.indexOf(s) != -1){
                continue; // Skip segment
            }

            segments.push(s);
        }
    }

    var aabbMin = new Vec2(),
        aabbMax = new Vec2(),
        aabbMinA = new Vec2(),
        aabbMaxA = new Vec2(),
        aabbMinB = new Vec2(),
        aabbMaxB = new Vec2();

    // Sort the segments by distance
    segments.sort(function(a,b){
        a.getAABB(aabbMinA,aabbMaxA,0);
        b.getAABB(aabbMinB,aabbMaxB,0);
        if(isLeft)          return aabbMaxB.x - aabbMaxA.x; // Descending .x
        else if(isRight)    return aabbMinA.x - aabbMinB.x; // Ascending .x
        else if(isTop)      return aabbMaxB.y - aabbMaxA.y; // Descending .y
        else if(isBottom)   return aabbMinA.y - aabbMinB.y; // Ascending .y
        else return 0;
    });
    for(var i=0; i<segments.length; i++){
        var s = segments[i];
        s.getAABB(aabbMin,aabbMax,0);

        // Can we even hit the margin box with a ray in the given direction?
        if((isRight || isLeft) && !(y > aabbMin.y && y < aabbMax.y)){
            continue;
        }
        if((isTop || isBottom) && !(x > aabbMin.x && x < aabbMax.x)){
            continue;
        }

        var point;
        if(isRight){
            if(x > aabbMin.x) continue;
            point = new Vec2(aabbMin.x, y); // Hit on the left side of the box

        } else if(isLeft){
            if(x < aabbMax.x) continue;  // Skip if we are to the left of the hittable area
            point = new Vec2(aabbMax.x, y); // Hit on the right side of the box

        } else if(isTop){
            if(y < aabbMin.y) continue;
            point = new Vec2(x,aabbMin.y); // Hit on bottom

        } else if(isBottom){
            if(y > aabbMax.y) continue;
            point = new Vec2(x, aabbMax.y); // Hit on top

        } else {
            throw new Error("WTF!?");
        }

        result.push(point,s);

        if(settings.onlyFirst){
            break; // We only need one projection on the first, nearest one
        }
    }

    return result;
};
