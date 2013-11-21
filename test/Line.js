var Line = require('../src/Line').Line
,   Diagram = require('../src/Diagram').Diagram

exports.construct = function(test){
    var l = new Line();
    test.done();
};

exports.clone = function(test){
    var l = new Line();
    var l2 = l.clone();
    // Todo check stuff
    test.done();
}

exports.setNice = function(test){
    var d = new Diagram();

    // Create a couple of boxes
    var b1 = d.createBox(),
        b2 = d.createBox().setPosition(200,30);

    // Create connectors on them
    var c1 = b1.createConnector({ position:0, side:"right" }),
        c2 = b2.createConnector({ position:0.2, side:"left" });

    var l = c1.spawnLine().setTo(c2);

    l.setNice();

    // Todo check the results

    test.done();
};
