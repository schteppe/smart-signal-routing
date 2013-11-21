var EventEmitter = require('./EventEmitter').EventEmitter
,   LineNode = require('./LineNode').LineNode
,   LineSegment = require('./LineSegment').LineSegment
,   Vec2 = require('./Vec2').Vec2
,   PF = require('pathfinding')

exports.Line = Line;

/**
 * A line in the diagram.
 * @constructor
 * @class Line
 * @extends {EventEmitter}
 */
function Line(options){
    options = options || {};
    EventEmitter.call(this);
    this.diagram =  options.diagram || null; // Diagram
    this.from =     options.from    || null; // Connector
    this.to =       options.to      || null; // Connector (connected in both ends) or Vec2 (connected in one end)
    this.nodes = [];    // All nodes that the Line passes to get from start to goal
    this.segments = []; // Line segments between start and goal
};
Line.prototype = new Object(EventEmitter.prototype);

/**
 * Set the "to" object that the line is supposed to connect to.
 * @method setTo
 * @param  {mixed} connectorOrVec2
 * @return {Line}                 Self.
 */
Line.prototype.setTo = function(connectorOrVec2) {
    this.to = connectorOrVec2;
    if(!(connectorOrVec2 instanceof Vec2))
        connectorOrVec2.lines.push(this);
    return this;
};

/**
 * Empty this line
 * @method reset
 */
Line.prototype.reset = function() {
    this.nodes.length = 0;
    this.segments.length = 0;
};

/**
 * Emit the change event
 * @method emitChange
 * @private
 */
Line.prototype.emitChange = function() {
    this.emit({
        type:"change",
    });
};

/**
 * Emit an event signalling that one of the line ends moved
 * @method emitEndsChange
 * @private
 */
Line.prototype.emitEndsChange = function() {
    this.emit({
        type:"endsChange",
    });
};

/**
 * @method emitDestroy
 * @private
 */
Line.prototype.emitDestroy = function() {
    this.emit({
        type:"destroy",
    });
};

/**
 * Compute the Line path, using as little effort as possible.
 * @method setSimple
 * @todo Should go from box margin?
 */
Line.prototype.setSimple = function(){
    // Must runtime require connector here. Why? Cross require!
    var Connector = require('./Connector').Connector;

    this.reset();

    var fromPos = this.from.getPosition(),
        fromPos2 = this.from.getPosition(true),
        toPos = this.to instanceof Connector ? this.to.getPosition() : this.to;

    // Add start point
    this.nodes.push(new LineNode(fromPos));
    this.nodes.push(new LineNode(fromPos2));

    // Add middle point
    var middleNode = new LineNode({
        x:fromPos2.x,
        y:toPos.y,
    });
    this.nodes.push(middleNode);

    // Add end point
    this.nodes.push(new LineNode(toPos));

    // Create segments
    this.generateSegments();

    this.emitChange();

    return this;
};

/**
 * Compute the Line path, avoiding other boxes and lines in the Diagram. If no nice path could be found, the simplest path is used.
 * @method setNice
 * @todo
 * @return {Line} Self
 */
Line.prototype.setNice = function(){
    this.reset();

    var boxes = this.diagram.boxes,
        leftNodes = [],     // Nodes on the left of each box
        rightNodes = [],    // etc
        topNodes = [],
        bottomNodes = [],
        from = this.from,
        to = this.to,
        nodes = [];         // Nodes to be traversed

    for(var i=0; i<boxes.length; i++){
        leftNodes.push([]);
        rightNodes.push([]);
        topNodes.push([]);
        bottomNodes.push([]);
    }

    // Generate the start and goal nodes
    var fp = from.getPosition(),
        ep = this.to.getPosition ? to.getPosition() : to,
        startNode = new PF.Node(ep.x, ep.y,0),
        endNode = new PF.Node(fp.x, fp.y,0);
    nodes.push( endNode, startNode );

    // Project these points onto the corresponding margins if they are on a box
    var Connector = require('./Connector').Connector;
    if(from instanceof Connector){
        var n = new PF.Node(from.position.x,from.position.y);
        var m = from.box.margin;

        // find box index
        var bi = boxes.indexOf(from.box);

        switch(from.side){
            case "left":    n.x -= m; leftNodes  [bi].push(n); break;
            case "right":   n.x += m; rightNodes [bi].push(n); break;
            case "bottom":  n.y -= m; bottomNodes[bi].push(n); break;
            case "top":     n.y += m; topNodes   [bi].push(n); break;
        }

        n.neighbors.push(startNode);
        startNode.neighbors.push(n);
        nodes.push(n);

    } else {
        // Node is a loose point...
        // Need to project it to neighboring boxes and stuff.
    }

    // Add all nodes on the box margin
    for(var i=0; i<boxes.length; i++){
        var b = boxes[i],
            bp = b.position,
            m = b.margin;

        // At input/outputs
        var inputNode = b.inputNode =   new PF.Node(bp.x-m,         bp.y+b.height/2,0); // On the left
        leftNodes[i].push(inputNode);
        nodes.push( inputNode );

        var outputNode = b.outputNode = new PF.Node(bp.x+b.width+m,bp.y+b.height/2,0); // On the right
        rightNodes[i].push(outputNode);
        nodes.push( outputNode );

        // At all corners
        b.topLeftNode =         new PF.Node(bp.x        -m,   bp.y         -m,   0);
        b.topRightNode =        new PF.Node(bp.x+b.width+m,   bp.y         -m,   0);
        b.bottomRightNode =     new PF.Node(bp.x+b.width+m,   bp.y+b.height+m,   0);
        b.bottomLeftNode =      new PF.Node(bp.x        -m,   bp.y+b.height+m,   0);
        topNodes[i]   .push(b.topLeftNode,    b.topRightNode);
        bottomNodes[i].push(b.bottomLeftNode, b.bottomRightNode);
        leftNodes[i]  .push(b.topLeftNode,    b.bottomLeftNode);
        rightNodes[i] .push(b.topRightNode,   b.bottomRightNode);

        b.topLeftNode    .neighbors.push(b.topRightNode,    inputNode);
        b.topRightNode   .neighbors.push(b.topLeftNode,     outputNode);
        b.bottomRightNode.neighbors.push(b.bottomLeftNode,  outputNode);
        b.bottomLeftNode .neighbors.push(b.bottomRightNode, inputNode);

        inputNode .neighbors.push( b.topLeftNode,  b.bottomLeftNode  );
        outputNode.neighbors.push( b.topRightNode, b.bottomRightNode );

        nodes.push( b.topLeftNode );
        nodes.push( b.topRightNode );
        nodes.push( b.bottomLeftNode );
        nodes.push( b.bottomRightNode );

    }

    for(var i=0; i<boxes.length; i++){
        var b = boxes[i];
        //                                 left    right   top     bottom
        project(b.outputNode,       nodes, false,  true,   false,  false,  b, boxes, leftNodes, rightNodes, topNodes, bottomNodes);
        project(b.inputNode,        nodes, true,   false,  false,  false,  b, boxes, leftNodes, rightNodes, topNodes, bottomNodes);

        project(b.topLeftNode,      nodes, false,  false,  true,   false,  b, boxes, leftNodes, rightNodes, topNodes, bottomNodes);
        project(b.topLeftNode,      nodes, true,   false,  false,  false,  b, boxes, leftNodes, rightNodes, topNodes, bottomNodes);

        project(b.topRightNode,     nodes, false,  true,   false,  false,  b, boxes, leftNodes, rightNodes, topNodes, bottomNodes);
        project(b.topRightNode,     nodes, false,  false,  true,   false,  b, boxes, leftNodes, rightNodes, topNodes, bottomNodes);

        project(b.bottomLeftNode,   nodes, true,   false,  false,  false,  b, boxes, leftNodes, rightNodes, topNodes, bottomNodes);
        project(b.bottomLeftNode,   nodes, false,  false,  false,  true,   b, boxes, leftNodes, rightNodes, topNodes, bottomNodes);

        project(b.bottomRightNode,  nodes, false,  true,   false,  false,  b, boxes, leftNodes, rightNodes, topNodes, bottomNodes);
        project(b.bottomRightNode,  nodes, false,  false,  false,  true,   b, boxes, leftNodes, rightNodes, topNodes, bottomNodes);
    }

    // Run pathfinding algo
    var finder = new PF.AStarFinderMinTurns(),
        fromNode = boxes[0].outputNode,
        toNode = boxes[1].inputNode;
    var path = finder.findPath(fromNode,toNode,nodes);

    if(path.length){
        for (var i = 0; i < path.length; i++) {
            var node = new LineNode({
                x : path[i][0],
                y : path[i][1],
            });
            this.nodes.push(node);
        };
        this.generateSegments();
        this.emitChange();
    } else {
        this.setSimple();
    }

    return this;
};

// Project nodes to other boxes
// Todo should this be a method in the Diagram?
function project(node,nodes,isLeft,isRight,isTop,isBottom,fromBox,boxes,leftNodes,rightNodes,topNodes,bottomNodes){

    // Want to sort the boxes array, but we better get an own copy of it so we don't mess it up
    var boxes2 = boxes.slice(0);

    // Sort so we get the closest boxes first.
    // This is needed since we will stop projecting after the first hit.
    boxes2.sort(function(a,b){
        if(isLeft)   return b.x - a.x; // Descending .x
        if(isRight)  return a.x - b.x; // Ascending  .x
        if(isTop)    return a.y - b.y; // Ascending  .y
        if(isBottom) return b.y - a.y; // Descending .y
        return 0; // ?
    });

    for(var j=0; j<boxes2.length; j++){
        var otherBox = boxes2[j];
        if(otherBox === fromBox){
            continue; // Skip current box
        }

        var otherBoxLeftNodes = leftNodes[j],
            otherBoxRightNodes = rightNodes[j],
            otherBoxTopNodes = topNodes[j],
            otherBoxBottomNodes = bottomNodes[j];

        var onCorrectSide = false,  // Whether the node is on the correct side of the box to make a projection
            sideNodes = [],         // List of nodes on the same box side as the newly created hit node
            searchDir = "y",        // Direction to look for neighboring nodes to the new hit node
            withinRange = false;

        // Can we hit the box with a ray in the given direction?
        if(isRight || isLeft) withinRange = node.y > otherBox.position.y-otherBox.margin && node.y < otherBox.position.y+otherBox.height+otherBox.margin;
        if(isTop || isBottom) withinRange = node.x > otherBox.position.x-otherBox.margin && node.x < otherBox.position.x+otherBox.width +otherBox.margin;

        if(isRight){
            onCorrectSide = node.x < otherBox.position.x;
            hitNode = new PF.Node(otherBox.position.x - otherBox.margin, node.y, 0); // Hit on the left side of the box
            sideNodes = otherBoxLeftNodes;

        } else if(isLeft){
            onCorrectSide = node.x > otherBox.position.x+otherBox.width;
            hitNode = new PF.Node(otherBox.position.x+otherBox.width+otherBox.margin,node.y,0); // Hit on the right side of the box
            sideNodes = otherBoxRightNodes;

        } else if(isTop){
            onCorrectSide = node.y > otherBox.position.y;
            hitNode = new PF.Node(node.x,otherBox.position.y + otherBox.height + otherBox.margin,0); // Hit on bottom
            sideNodes = otherBoxBottomNodes;
            searchDir = "x";

        } else if(isBottom){
            onCorrectSide = node.y < otherBox.position.y + otherBox.height;
            hitNode = new PF.Node(node.x, otherBox.position.y - otherBox.margin, 0); // Hit on top
            sideNodes = otherBoxTopNodes;
            searchDir = "x";

        } else {
            // node is not attached to a box
            console.log("here");
        }

        if(withinRange && onCorrectSide){

            // Save the new node
            nodes.push( hitNode );

            // Add connection between the new node and the node we projected from
            node.neighbors.push(hitNode);
            hitNode.neighbors.push(node);

            // Add connection to the closest neighbors on the box. This is done by measuring distance.
            var closestTop=null,
                closestBelow=null,
                x=searchDir;
            for(var k=0; k!==sideNodes.length; k++){
                var n = sideNodes[k];
                if(hitNode[x]>n[x] && (closestTop==null   || (Math.abs(n[x]-hitNode[x])<Math.abs(hitNode[x]-closestTop[x]))))
                    closestTop = n;
                if(hitNode[x]<n[x] && (closestBelow==null || (Math.abs(n[x]-hitNode[x])<Math.abs(hitNode[x]-closestBelow[x]))))
                    closestBelow = n;
            }
            if(closestTop){
                // Found a neighbor on the positive side of the new node.
                hitNode.neighbors.push(closestTop);
                closestTop.neighbors.push(hitNode);
            }
            if(closestBelow && closestBelow !== closestTop){ // Closest nodes may not be the same node
                // Found a node on the negative side
                hitNode.neighbors.push(closestBelow);
                closestBelow.neighbors.push(hitNode);
            }

            // Add the new node on the same side of the box.
            sideNodes.push(hitNode);

            if(closestTop && closestBelow){

                // Since we added a new node in between closestTop and closestBelow, we might as well remove the neighborhoodness between the two.
                // They *should* be neighbors.
                var idx = closestTop.neighbors.indexOf(closestBelow);
                if(idx!=-1){
                    closestTop.neighbors.splice(idx,1);
                }

                idx = closestBelow.neighbors.indexOf(closestTop);
                if(idx!=-1){
                    closestBelow.neighbors.splice(idx,1);
                }
            }

            return; // We only need one projection on the first, nearest one
        }
    }
}

/**
 * Compute the Line path, avoiding other boxes and lines in the Diagram, and try to change as little as possible of the path relative to the old Line.  If no nice path could be found, the simplest path is used.
 * @method setMinDisturb
 * @todo
 * @return {Line} Self.
 */
Line.prototype.setMinDisturb = function(oldLine){
    this.reset();
    this.setSimple();
    return this;
};

/**
 * Clone the line. Useful together with setMinDisturb().
 * @method clone
 * @return {Line}
 */
Line.prototype.clone = function() {
    var l = new Line({
        from : this.from.clone(),
        to : this.to.clone(),
    });
    for(var i=0; i<this.nodes.length; i++){
        l.nodes.push(this.nodes[i].clone());
    }
    l.generateSegments();
    return l;
};

/**
 * Generates new line segments given the current nodes.
 * @method generateSegments
 * @return {Line} Self
 */
Line.prototype.generateSegments = function() {
    this.segments.length = 0;
    for(var i=0; i<this.nodes.length-1; i++){
        var n = this.nodes[i],
            next = this.nodes[i+1];
        this.segments.push(new LineSegment({
            from:n,
            to:next,
            line:this,
            isHorizontal : Math.abs(n.position.x-next.position.x) > Math.abs(n.position.y-next.position.y),
        }));
    }
    return this;
}
