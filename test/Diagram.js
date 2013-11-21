var Diagram = require('../src/Diagram').Diagram
,   Vec2 = require('../src/Vec2').Vec2
,   LineSegment = require('../src/LineSegment').LineSegment

exports.construct = function(test){
    var d = new Diagram();
    test.done();
};

exports.createLine = function(test){
    var d = new Diagram();
    d.createLine();
    test.done();
};

// Todo hit line
exports.hitTest = function(test){
    var d = new Diagram();
    var b1 = d.createBox({ x:0, y:0,    width:100, height:100 }),
        b2 = d.createBox({ x:0, y:200,  width:100, height:100 });

    // Hit b1
    var result = d.hitTest(50,50);
    test.equal(result.length,1);
    test.ok(result[0] === b1);

    // Hit b2
    result = d.hitTest(50,250);
    test.equal(result.length,1);
    test.ok(result[0] === b2);

    // Hit b2 outside it but with precision
    result = d.hitTest(50,195,{ precision:10 });
    test.equal(result.length,1);
    test.ok(result[0] === b2);

    test.done();
};

// Todo: check several lines
exports.rayCast = function(test){
    var d = new Diagram();
    var b1 = d.createBox({ x:0, y:0,   width:100, height:100 }),
        b2 = d.createBox({ x:0, y:200, width:100, height:100 });

    var result = d.rayCast(200,50,3);
    test.equal(result.length,2);
    test.ok(result[0] instanceof Vec2);
    test.ok(result[1] === b1);

    // Add a line...
    var c1 = b1.createConnector({ side:"bottom" });
    var c2 = b2.createConnector({ side:"top" });
    var l = c1.spawnLine();
    l.setTo(c2);
    l.setSimple();

    result = d.rayCast(200,50,3);
    test.equal(result.length,2);
    test.ok(result[0] instanceof Vec2);
    test.ok(result[1] === b1);

    result = d.rayCast(200,150,3);
    test.equal(result.length,2,"Could not hit a line");
    test.ok(result[0] instanceof Vec2);
    test.ok(result[1] instanceof LineSegment);
    test.ok(result[1].line === l);

    test.done();
};
