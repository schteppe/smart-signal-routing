(function(e){if("function"==typeof bootstrap)bootstrap("ssr",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeSSR=e}else"undefined"!=typeof window?window.SSR=e():global.SSR=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
module.exports = require('./src/PathFinding');

},{"./src/PathFinding":2}],2:[function(require,module,exports){
module.exports = {
    'Node'                 : require('./core/Node'),
    'Grid'                 : require('./core/Grid'),
    'Heap'                 : require('./core/Heap'),
    'Util'                 : require('./core/Util'),
    'Heuristic'            : require('./core/Heuristic'),
    'AStarFinder'          : require('./finders/AStarFinder'),
    'BestFirstFinder'      : require('./finders/BestFirstFinder'),
    'BreadthFirstFinder'   : require('./finders/BreadthFirstFinder'),
    'DijkstraFinder'       : require('./finders/DijkstraFinder'),
    'BiAStarFinder'        : require('./finders/BiAStarFinder'),
    'BiBestFirstFinder'    : require('./finders/BiBestFirstFinder'),
    'BiBreadthFirstFinder' : require('./finders/BiBreadthFirstFinder'),
    'BiDijkstraFinder'     : require('./finders/BiDijkstraFinder'),
    'AStarFinderMinTurns'  : require('./finders/AStarFinderMinTurns'),
};

},{"./core/Grid":3,"./core/Heap":4,"./core/Heuristic":5,"./core/Node":6,"./core/Util":7,"./finders/AStarFinder":8,"./finders/AStarFinderMinTurns":9,"./finders/BestFirstFinder":10,"./finders/BiAStarFinder":11,"./finders/BiBestFirstFinder":12,"./finders/BiBreadthFirstFinder":13,"./finders/BiDijkstraFinder":14,"./finders/BreadthFirstFinder":15,"./finders/DijkstraFinder":16}],3:[function(require,module,exports){
var Node = require('./Node');

/**
 * The Grid class, which serves as the encapsulation of the layout of the nodes.
 * @constructor
 * @param {number} width Number of columns of the grid.
 * @param {number} height Number of rows of the grid.
 * @param {Array.<Array.<(number|boolean)>>} [matrix] - A 0-1 matrix
 *     representing the walkable status of the nodes(0 or false for walkable).
 *     If the matrix is not supplied, all the nodes will be walkable.  */
function Grid(width, height, matrix) {

    /**
     * The number of columns of the grid.
     * @type number
     */
    this.width = width;
    /**
     * The number of rows of the grid.
     * @type number
     */
    this.height = height;

    this.matrix = matrix;

    /**
     * A 2D array of nodes.
     */
    this.nodes = this._buildNodes(width, height, matrix);

}

/**
 * Build and return the nodes.
 * @private
 * @param {number} width
 * @param {number} height
 * @param {Array.<Array.<number|boolean>>} [matrix] - A 0-1 matrix representing
 *     the walkable status of the nodes.
 * @see Grid
 */
Grid.prototype._buildNodes = function(width, height, matrix) {
    var i, j,
        nodes = new Array(height),
        row;

    for (i = 0; i < height; ++i) {
        nodes[i] = new Array(width);
        for (j = 0; j < width; ++j) {
            nodes[i][j] = new Node(j, i, 0); // z == 0 in 2D
        }
    }

    if (matrix === undefined) {
        matrix = [];
        for (i = 0; i < height; ++i) {
            matrix.push([]);
            for (j = 0; j < width; ++j) {
                matrix[i][j] = 0; // 0 => walkable
            }
        }
        this.matrix = matrix;
    }

    if (matrix.length !== height || matrix[0].length !== width) {
        throw new Error('Matrix size does not fit');
    }

    for (i = 0; i < height; ++i) {
        for (j = 0; j < width; ++j) {
            if (!matrix[i][j]) { // 0 => walkable
                var n = nodes[i][j];
                // Add neighbors if they are walkable
                if(i!=0        && !matrix[i-1][j]) n.neighbors.push(nodes[i-1][j]);
                if(i!=height-1 && !matrix[i+1][j]) n.neighbors.push(nodes[i+1][j]);
                if(j!=0        && !matrix[i][j-1]) n.neighbors.push(nodes[i][j-1]);
                if(j!=width-1  && !matrix[i][j+1]) n.neighbors.push(nodes[i][j+1]);
            }
        }
    }

    return nodes;
};


Grid.prototype.getNodeAt = function(x, y) {
    return this.nodes[y][x];
};


/**
 * Determine whether the node at the given position is walkable.
 * (Also returns false if the position is outside the grid.)
 * @param {number} x - The x coordinate of the node.
 * @param {number} y - The y coordinate of the node.
 * @return {boolean} - The walkability of the node.
 */
Grid.prototype.isWalkableAt = function(x, y) {
    return this.isInside(x, y) && this.matrix[y][x]==0;
};


/**
 * Determine whether the position is inside the grid.
 * XXX: `grid.isInside(x, y)` is wierd to read.
 * It should be `(x, y) is inside grid`, but I failed to find a better
 * name for this method.
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
Grid.prototype.isInside = function(x, y) {
    return (x >= 0 && x < this.width) && (y >= 0 && y < this.height);
};


/**
 * Set whether the node on the given position is walkable.
 * NOTE: throws exception if the coordinate is not inside the grid.
 * @param {number} x - The x coordinate of the node.
 * @param {number} y - The y coordinate of the node.
 * @param {boolean} walkable - Whether the position is walkable.
 */
Grid.prototype.setWalkableAt = function(x, y, walkable) {
    //this.nodes[y][x].walkable = walkable;
    this.matrix[y][x] = walkable ? 0 : 1;
    this.nodes = this._buildNodes(this.width,this.height,this.matrix);
};


/**
 * Get the neighbors of the given node.
 *
 *     offsets      diagonalOffsets:
 *  +---+---+---+    +---+---+---+
 *  |   | 0 |   |    | 0 |   | 1 |
 *  +---+---+---+    +---+---+---+
 *  | 3 |   | 1 |    |   |   |   |
 *  +---+---+---+    +---+---+---+
 *  |   | 2 |   |    | 3 |   | 2 |
 *  +---+---+---+    +---+---+---+
 *
 *  When allowDiagonal is true, if offsets[i] is valid, then
 *  diagonalOffsets[i] and
 *  diagonalOffsets[(i + 1) % 4] is valid.
 * @param {Node} node
 * @param {boolean} allowDiagonal
 * @param {boolean} dontCrossCorners
 */
Grid.prototype.getNeighbors = function(node) {
    return node.neighbors;
};


/**
 * Get a clone of this grid.
 * @return {Grid} Cloned grid.
 */
Grid.prototype.clone = function() {
    var i, j,

        width = this.width,
        height = this.height,
        thisNodes = this.nodes,

        newGrid = new Grid(width, height),
        row;

    for (i = 0; i < height; ++i) {
        for (j = 0; j < width; ++j) {

            // Must use the Node objects generated by newGrid! Otherwise the pathfinding algos won't be able to compare endNode===someNode
            var n = newGrid.getNodeAt(j,i);
                oldNode = this.getNodeAt(j,i);
            n.neighbors = [];
            for(var k=0; k<oldNode.neighbors.length; k++)
                n.neighbors.push(newGrid.getNodeAt(oldNode.neighbors[k].x, oldNode.neighbors[k].y));
        }
    }

    return newGrid;
};

module.exports = Grid;

},{"./Node":6}],4:[function(require,module,exports){
// From https://github.com/qiao/heap.js
// Generated by CoffeeScript 1.3.1
(function() {
  var Heap, defaultCmp, floor, heapify, heappop, heappush, heappushpop, heapreplace, insort, min, nlargest, nsmallest, updateItem, _siftdown, _siftup;

  floor = Math.floor, min = Math.min;

  /* 
  Default comparison function to be used
  */


  defaultCmp = function(x, y) {
    if (x < y) {
      return -1;
    }
    if (x > y) {
      return 1;
    }
    return 0;
  };

  /* 
  Insert item x in list a, and keep it sorted assuming a is sorted.
  
  If x is already in a, insert it to the right of the rightmost x.
  
  Optional args lo (default 0) and hi (default a.length) bound the slice
  of a to be searched.
  */


  insort = function(a, x, lo, hi, cmp) {
    var mid;
    if (lo == null) {
      lo = 0;
    }
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (lo < 0) {
      throw new Error('lo must be non-negative');
    }
    if (hi == null) {
      hi = a.length;
    }
    while (cmp(lo, hi) < 0) {
      mid = floor((lo + hi) / 2);
      if (cmp(x, a[mid]) < 0) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
    return ([].splice.apply(a, [lo, lo - lo].concat(x)), x);
  };

  /*
  Push item onto heap, maintaining the heap invariant.
  */


  heappush = function(array, item, cmp) {
    if (cmp == null) {
      cmp = defaultCmp;
    }
    array.push(item);
    return _siftdown(array, 0, array.length - 1, cmp);
  };

  /*
  Pop the smallest item off the heap, maintaining the heap invariant.
  */


  heappop = function(array, cmp) {
    var lastelt, returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    lastelt = array.pop();
    if (array.length) {
      returnitem = array[0];
      array[0] = lastelt;
      _siftup(array, 0, cmp);
    } else {
      returnitem = lastelt;
    }
    return returnitem;
  };

  /*
  Pop and return the current smallest value, and add the new item.
  
  This is more efficient than heappop() followed by heappush(), and can be 
  more appropriate when using a fixed size heap. Note that the value
  returned may be larger than item! That constrains reasonable use of
  this routine unless written as part of a conditional replacement:
      if item > array[0]
        item = heapreplace(array, item)
  */


  heapreplace = function(array, item, cmp) {
    var returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    returnitem = array[0];
    array[0] = item;
    _siftup(array, 0, cmp);
    return returnitem;
  };

  /*
  Fast version of a heappush followed by a heappop.
  */


  heappushpop = function(array, item, cmp) {
    var _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (array.length && cmp(array[0], item) < 0) {
      _ref = [array[0], item], item = _ref[0], array[0] = _ref[1];
      _siftup(array, 0, cmp);
    }
    return item;
  };

  /*
  Transform list into a heap, in-place, in O(array.length) time.
  */


  heapify = function(array, cmp) {
    var i, _i, _j, _len, _ref, _ref1, _results, _results1;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    _ref1 = (function() {
      _results1 = [];
      for (var _j = 0, _ref = floor(array.length / 2); 0 <= _ref ? _j < _ref : _j > _ref; 0 <= _ref ? _j++ : _j--){ _results1.push(_j); }
      return _results1;
    }).apply(this).reverse();
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      i = _ref1[_i];
      _results.push(_siftup(array, i, cmp));
    }
    return _results;
  };

  /*
  Update the position of the given item in the heap.
  This function should be called every time the item is being modified.
  */


  updateItem = function(array, item, cmp) {
    var pos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    pos = array.indexOf(item);
    _siftdown(array, 0, pos, cmp);
    return _siftup(array, pos, cmp);
  };

  /*
  Find the n largest elements in a dataset.
  */


  nlargest = function(array, n, cmp) {
    var elem, result, _i, _len, _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    result = array.slice(0, n);
    if (!result.length) {
      return result;
    }
    heapify(result, cmp);
    _ref = array.slice(n);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      elem = _ref[_i];
      heappushpop(result, elem, cmp);
    }
    return result.sort(cmp).reverse();
  };

  /*
  Find the n smallest elements in a dataset.
  */


  nsmallest = function(array, n, cmp) {
    var elem, i, los, result, _i, _j, _len, _ref, _ref1, _results;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (n * 10 <= array.length) {
      result = array.slice(0, n).sort(cmp);
      if (!result.length) {
        return result;
      }
      los = result[result.length - 1];
      _ref = array.slice(n);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        if (cmp(elem, los) < 0) {
          insort(result, elem, 0, null, cmp);
          result.pop();
          los = result[result.length - 1];
        }
      }
      return result;
    }
    heapify(array, cmp);
    _results = [];
    for (i = _j = 0, _ref1 = min(n, array.length); 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
      _results.push(heappop(array, cmp));
    }
    return _results;
  };

  _siftdown = function(array, startpos, pos, cmp) {
    var newitem, parent, parentpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    newitem = array[pos];
    while (pos > startpos) {
      parentpos = (pos - 1) >> 1;
      parent = array[parentpos];
      if (cmp(newitem, parent) < 0) {
        array[pos] = parent;
        pos = parentpos;
        continue;
      }
      break;
    }
    return array[pos] = newitem;
  };

  _siftup = function(array, pos, cmp) {
    var childpos, endpos, newitem, rightpos, startpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    endpos = array.length;
    startpos = pos;
    newitem = array[pos];
    childpos = 2 * pos + 1;
    while (childpos < endpos) {
      rightpos = childpos + 1;
      if (rightpos < endpos && !(cmp(array[childpos], array[rightpos]) < 0)) {
        childpos = rightpos;
      }
      array[pos] = array[childpos];
      pos = childpos;
      childpos = 2 * pos + 1;
    }
    array[pos] = newitem;
    return _siftdown(array, startpos, pos, cmp);
  };

  Heap = (function() {

    Heap.name = 'Heap';

    Heap.push = heappush;

    Heap.pop = heappop;

    Heap.replace = heapreplace;

    Heap.pushpop = heappushpop;

    Heap.heapify = heapify;

    Heap.nlargest = nlargest;

    Heap.nsmallest = nsmallest;

    function Heap(cmp) {
      this.cmp = cmp != null ? cmp : defaultCmp;
      this.nodes = [];
    }

    Heap.prototype.push = function(x) {
      return heappush(this.nodes, x, this.cmp);
    };

    Heap.prototype.pop = function() {
      return heappop(this.nodes, this.cmp);
    };

    Heap.prototype.peek = function() {
      return this.nodes[0];
    };

    Heap.prototype.contains = function(x) {
      return this.nodes.indexOf(x) !== -1;
    };

    Heap.prototype.replace = function(x) {
      return heapreplace(this.nodes, x, this.cmp);
    };

    Heap.prototype.pushpop = function(x) {
      return heappushpop(this.nodes, x, this.cmp);
    };

    Heap.prototype.heapify = function() {
      return heapify(this.nodes, this.cmp);
    };

    Heap.prototype.updateItem = function(x) {
      return updateItem(this.nodes, x, this.cmp);
    };

    Heap.prototype.clear = function() {
      return this.nodes = [];
    };

    Heap.prototype.empty = function() {
      return this.nodes.length === 0;
    };

    Heap.prototype.size = function() {
      return this.nodes.length;
    };

    Heap.prototype.clone = function() {
      var heap;
      heap = new Heap();
      heap.nodes = this.nodes.slice(0);
      return heap;
    };

    Heap.prototype.toArray = function() {
      return this.nodes.slice(0);
    };

    Heap.prototype.insert = Heap.prototype.push;

    Heap.prototype.remove = Heap.prototype.pop;

    Heap.prototype.top = Heap.prototype.peek;

    Heap.prototype.front = Heap.prototype.peek;

    Heap.prototype.has = Heap.prototype.contains;

    Heap.prototype.copy = Heap.prototype.clone;

    return Heap;

  })();

  if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
    module.exports = Heap;
  } else {
    window.Heap = Heap;
  }

}).call(this);

},{}],5:[function(require,module,exports){
/**
 * @namespace PF.Heuristic
 * @description A collection of heuristic functions.
 */
module.exports = {

  /**
   * Manhattan distance.
   * @param {number} dx - Difference in x.
   * @param {number} dy - Difference in y.
   * @return {number} dx + dy
   */
  manhattan: function(dx, dy, dz) {
      return dx + dy + dz;
  },

  /**
   * Euclidean distance.
   * @param {number} dx - Difference in x.
   * @param {number} dy - Difference in y.
   * @return {number} sqrt(dx * dx + dy * dy)
   */
  euclidean: function(dx, dy, dz) {
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  /**
   * Chebyshev distance.
   * @param {number} dx - Difference in x.
   * @param {number} dy - Difference in y.
   * @return {number} max(dx, dy)
   */
  chebyshev: function(dx, dy, dz) {
      return Math.max(dx, dy, dz);
  }

};

},{}],6:[function(require,module,exports){
var idCounter = 0;

/**
 * A node in grid.
 * This class holds some basic information about a node and custom
 * attributes may be added, depending on the algorithms' needs.
 * @constructor
 * @param {number} x - The x coordinate of the node
 * @param {number} y - The y coordinate of the node
 * @param {number} z - The z coordinate of the node
 */
function Node(x, y, z) {
    /**
     * The x coordinate of the node on the grid.
     * @type number
     */
    this.x = x;
    /**
     * The y coordinate of the node on the grid.
     * @type number
     */
    this.y = y;
    /**
     * The z coordinate of the node on the grid.
     * @type number
     */
    this.z = z;
    /**
     * Neighboring nodes that are walkable from this node.
     * @type array
     */
    this.neighbors = [];
};

module.exports = Node;

},{}],7:[function(require,module,exports){
/**
 * Backtrace according to the parent records and return the path.
 * (including both start and end nodes)
 * @param {Node} node End node
 * @return {Array.<Array.<number>>} the path
 */
function backtrace(node) {
    var path = [[node.x, node.y, node.z]];
    while (node.parent) {
        node = node.parent;
        path.push([node.x, node.y, node.z]);
    }
    return path.reverse();
}
exports.backtrace = backtrace;

/**
 * Backtrace from start and end node, and return the path.
 * (including both start and end nodes)
 * @param {Node}
 * @param {Node}
 */
function biBacktrace(nodeA, nodeB) {
    var pathA = backtrace(nodeA),
        pathB = backtrace(nodeB);
    return pathA.concat(pathB.reverse());
}
exports.biBacktrace = biBacktrace;

/**
 * Compute the length of the path.
 * @param {Array.<Array.<number>>} path The path
 * @return {number} The length of the path
 */
function pathLength(path) {
    var i, sum = 0, a, b, dx, dy, dz;
    for (i = 1; i < path.length; ++i) {
        a = path[i - 1];
        b = path[i];
        dx = a[0] - b[0];
        dy = a[1] - b[1];
        dz = a[2] - b[2];
        sum += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    return sum;
}
exports.pathLength = pathLength;


/**
 * Given the start and end coordinates, return all the coordinates lying
 * on the line formed by these coordinates, based on Bresenham's algorithm.
 * http://en.wikipedia.org/wiki/Bresenham's_line_algorithm#Simplification
 * @param {number} x0 Start x coordinate
 * @param {number} y0 Start y coordinate
 * @param {number} x1 End x coordinate
 * @param {number} y1 End y coordinate
 * @return {Array.<Array.<number>>} The coordinates on the line
 */
function getLine(x0, y0, x1, y1) {
    var abs = Math.abs,
        line = [],
        sx, sy, dx, dy, err, e2;

    dx = abs(x1 - x0);
    dy = abs(y1 - y0);

    sx = (x0 < x1) ? 1 : -1;
    sy = (y0 < y1) ? 1 : -1;

    err = dx - dy;

    while (true) {
        line.push([x0, y0]);

        if (x0 === x1 && y0 === y1) {
            break;
        }

        e2 = 2 * err;
        if (e2 > -dy) {
            err = err - dy;
            x0 = x0 + sx;
        }
        if (e2 < dx) {
            err = err + dx;
            y0 = y0 + sy;
        }
    }

    return line;
}
exports.getLine = getLine;


/**
 * Smoothen the give path.
 * The original path will not be modified; a new path will be returned.
 * @param {PF.Grid} grid
 * @param {Array.<Array.<number>>} path The path
 * @return {Array.<Array.<number>>} Smoothened path
 */
function smoothenPath(grid, path) {
    var len = path.length,
        x0 = path[0][0],        // path start x
        y0 = path[0][1],        // path start y
        x1 = path[len - 1][0],  // path end x
        y1 = path[len - 1][1],  // path end y
        sx, sy,                 // current start coordinate
        ex, ey,                 // current end coordinate
        lx, ly,                 // last valid end coordinate
        newPath,
        i, j, coord, line, testCoord, blocked;

    sx = x0;
    sy = y0;
    lx = path[1][0];
    ly = path[1][1];
    newPath = [[sx, sy]];

    for (i = 2; i < len; ++i) {
        coord = path[i];
        ex = coord[0];
        ey = coord[1];
        line = getLine(sx, sy, ex, ey);

        blocked = false;
        for (j = 1; j < line.length; ++j) {
            testCoord = line[j];

            if (!grid.isWalkableAt(testCoord[0], testCoord[1])) {
                blocked = true;
                newPath.push([lx, ly]);
                sx = lx;
                sy = ly;
                break;
            }
        }
        if (!blocked) {
            lx = ex;
            ly = ey;
        }
    }
    newPath.push([x1, y1]);

    return newPath;
}
exports.smoothenPath = smoothenPath;

},{}],8:[function(require,module,exports){
var Heap       = require('../core/Heap');
var Util       = require('../core/Util');
var Heuristic  = require('../core/Heuristic');

/**
 * A* path-finder.
 * based upon https://github.com/bgrins/javascript-astar
 * @constructor
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 * @param {integer} opt.weight Weight to apply to the heuristic to allow for suboptimal paths,
 *     in order to speed up the search.
 */
function AStarFinder(opt) {
    opt = opt || {};
    this.heuristic = opt.heuristic || Heuristic.manhattan;
    this.weight = opt.weight || 1;
}

/**
 * Find and return the the path.
 * @return {Array.<[number, number]>} The path, including both start and
 *     end positions.
 */
AStarFinder.prototype.findPath = function(startNode, endNode, nodes) {
    var openList = new Heap(function(nodeA, nodeB) {
            return nodeA.f - nodeB.f;
        }),
        heuristic = this.heuristic,
        weight = this.weight,
        abs = Math.abs, SQRT2 = Math.SQRT2,
        node, neighbors, neighbor, i, l, x, y, z, ng;

    // set the `g` and `f` value of the start node to be 0
    startNode.g = 0;
    startNode.f = 0;

    // push the start node into the open list
    openList.push(startNode);
    startNode.opened = true;

    // while the open list is not empty
    while (!openList.empty()) {
        // pop the position of node which has the minimum `f` value.
        node = openList.pop();
        node.closed = true;

        // if reached the end position, construct the path and return it
        if (node === endNode) {
            return Util.backtrace(endNode);
        }

        // get neigbours of the current node
        neighbors = node.neighbors;
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            if (neighbor.closed) {
                continue;
            }

            x = neighbor.x;
            y = neighbor.y;
            z = neighbor.z;

            // get the distance between current node and the neighbor
            // and calculate the next g score
            ng = node.g + Math.sqrt(Math.pow(x - node.x,2) + Math.pow(y - node.y,2) + Math.pow(z-node.z,2));

            // check if the neighbor has not been inspected yet, or
            // can be reached with smaller cost from the current node
            if (!neighbor.opened || ng < neighbor.g) {
                neighbor.g = ng;
                neighbor.h = neighbor.h || weight * heuristic(abs(x - endNode.x), abs(y - endNode.y), abs(z - endNode.z));
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = node;

                if (!neighbor.opened) {
                    openList.push(neighbor);
                    neighbor.opened = true;
                } else {
                    // the neighbor can be reached with smaller cost.
                    // Since its f value has been updated, we have to
                    // update its position in the open list
                    openList.updateItem(neighbor);
                }
            }
        } // end for each neighbor
    } // end while not open list empty

    // fail to find the path
    return [];
};

module.exports = AStarFinder;

},{"../core/Heap":4,"../core/Heuristic":5,"../core/Util":7}],9:[function(require,module,exports){
var Heap       = require('../core/Heap');
var Util       = require('../core/Util');
var Heuristic  = require('../core/Heuristic');

/**
 * A* path-finder that considers the turns made during the path.
 * based upon https://github.com/bgrins/javascript-astar
 * @constructor
 * @param {object} opt
 * @param {function} opt.heuristic Heuristic function to estimate the distance (defaults to manhattan).
 * @param {integer} opt.weight Weight to apply to the heuristic to allow for suboptimal paths, in order to speed up the search.
 * @param {integer} opt.turnAngleWeight Weight to apply to the turn value, to make the algorithm take paths with less turns.
 */
function AStarFinderMinTurns(opt) {
    opt = opt || {};
    this.heuristic = opt.heuristic || Heuristic.manhattan;
    this.weight = opt.weight || 1;
    this.turnAngleWeight = opt.turnAngleWeight || 1;
}

/**
 * Find and return the the path.
 * @return {Array.<[number, number]>} The path, including both start and
 *     end positions.
 */
AStarFinderMinTurns.prototype.findPath = function(startNode, endNode, nodes) {
    var openList = new Heap(function(nodeA, nodeB) {
            return nodeA.f - nodeB.f;
        }),
        heuristic = this.heuristic,
        weight = this.weight,
        turnAngleWeight = this.turnAngleWeight,
        abs = Math.abs, SQRT2 = Math.SQRT2,
        node, neighbors, neighbor, i, l, x, y, z, ng;

    // set the `g` and `f` value of the start node to be 0
    startNode.g = 0;
    startNode.f = 0;

    // push the start node into the open list
    openList.push(startNode);
    startNode.opened = true;

    // while the open list is not empty
    while (!openList.empty()) {
        // pop the position of node which has the minimum `f` value.
        node = openList.pop();
        node.closed = true;

        // if reached the end position, construct the path and return it
        if (node === endNode) {
            return Util.backtrace(endNode);
        }

        // get neigbours of the current node
        neighbors = node.neighbors;
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            if (neighbor.closed) {
                continue;
            }

            x = neighbor.x;
            y = neighbor.y;
            z = neighbor.z;

            // Get the angle between the current node line and the neighbor line
            // cos(theta) = a.dot(b) / (len(a)*len(b))
            var angle = 0;
            if(node.parent){
                var ax = x - node.x,
                    ay = y - node.y,
                    az = z - node.z,
                    bx = node.x - node.parent.x,
                    by = node.y - node.parent.y,
                    bz = node.z - node.parent.z;

                angle = Math.abs( Math.acos( (ax*bx + ay*by + az*bz) / ( Math.sqrt(ax*ax + ay*ay + az*az) ) + Math.sqrt(bx*bx + by*by + bz*bz) ) );
            }

            // get the distance between current node and the neighbor
            // and calculate the next g score
            ng = node.g + Math.sqrt(Math.pow(x - node.x,2) + Math.pow(y - node.y,2) + Math.pow(z-node.z,2)) + angle*turnAngleWeight;

            // check if the neighbor has not been inspected yet, or
            // can be reached with smaller cost from the current node
            if (!neighbor.opened || ng < neighbor.g) {
                neighbor.g = ng;
                neighbor.h = neighbor.h || weight * heuristic(abs(x - endNode.x), abs(y - endNode.y), abs(z - endNode.z));
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = node;

                if (!neighbor.opened) {
                    openList.push(neighbor);
                    neighbor.opened = true;
                } else {
                    // the neighbor can be reached with smaller cost.
                    // Since its f value has been updated, we have to
                    // update its position in the open list
                    openList.updateItem(neighbor);
                }
            }
        } // end for each neighbor
    } // end while not open list empty

    // fail to find the path
    return [];
};

module.exports = AStarFinderMinTurns;

},{"../core/Heap":4,"../core/Heuristic":5,"../core/Util":7}],10:[function(require,module,exports){
var AStarFinder = require('./AStarFinder');

/**
 * Best-First-Search path-finder.
 * @constructor
 * @extends AStarFinder
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 */
function BestFirstFinder(opt) {
    AStarFinder.call(this, opt);

    var orig = this.heuristic;
    this.heuristic = function(dx, dy, dz) {
        return orig(dx, dy) * 1000000;
    };
};

BestFirstFinder.prototype = new AStarFinder();
BestFirstFinder.prototype.constructor = BestFirstFinder;

module.exports = BestFirstFinder;

},{"./AStarFinder":8}],11:[function(require,module,exports){
var Heap       = require('../core/Heap');
var Util       = require('../core/Util');
var Heuristic  = require('../core/Heuristic');

/**
 * A* path-finder.
 * based upon https://github.com/bgrins/javascript-astar
 * @constructor
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 * @param {integer} opt.weight Weight to apply to the heuristic to allow for suboptimal paths,
 *     in order to speed up the search.
 */
function BiAStarFinder(opt) {
    opt = opt || {};
    this.heuristic = opt.heuristic || Heuristic.manhattan;
    this.weight = opt.weight || 1;
}

/**
 * Find and return the the path.
 * @return {Array.<[number, number]>} The path, including both start and
 *     end positions.
 */
BiAStarFinder.prototype.findPath = function(startNode, endNode, nodes) {
    var cmp = function(nodeA, nodeB) {
            return nodeA.f - nodeB.f;
        },
        startOpenList = new Heap(cmp),
        endOpenList = new Heap(cmp),
        heuristic = this.heuristic,
        weight = this.weight,
        abs = Math.abs, SQRT2 = Math.SQRT2,
        node, neighbors, neighbor, i, l, x, y, z, ng,
        BY_START = 1, BY_END = 2;

    // set the `g` and `f` value of the start node to be 0
    // and push it into the start open list
    startNode.g = 0;
    startNode.f = 0;
    startOpenList.push(startNode);
    startNode.opened = BY_START;

    // set the `g` and `f` value of the end node to be 0
    // and push it into the open open list
    endNode.g = 0;
    endNode.f = 0;
    endOpenList.push(endNode);
    endNode.opened = BY_END;

    // while both the open lists are not empty
    while (!startOpenList.empty() && !endOpenList.empty()) {

        // pop the position of start node which has the minimum `f` value.
        node = startOpenList.pop();
        node.closed = true;

        // get neigbours of the current node
        neighbors = node.neighbors;
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            if (neighbor.closed) {
                continue;
            }
            if (neighbor.opened === BY_END) {
                return Util.biBacktrace(node, neighbor);
            }

            x = neighbor.x;
            y = neighbor.y;
            z = neighbor.z;

            // get the distance between current node and the neighbor
            // and calculate the next g score
            ng = node.g + ((x - node.x === 0 || y - node.y === 0) ? 1 : SQRT2);

            // check if the neighbor has not been inspected yet, or
            // can be reached with smaller cost from the current node
            if (!neighbor.opened || ng < neighbor.g) {
                neighbor.g = ng;
                neighbor.h = neighbor.h || weight * heuristic(abs(x - endNode.x), abs(y - endNode.y), abs(z - endNode.z));
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = node;

                if (!neighbor.opened) {
                    startOpenList.push(neighbor);
                    neighbor.opened = BY_START;
                } else {
                    // the neighbor can be reached with smaller cost.
                    // Since its f value has been updated, we have to
                    // update its position in the open list
                    startOpenList.updateItem(neighbor);
                }
            }
        } // end for each neighbor


        // pop the position of end node which has the minimum `f` value.
        node = endOpenList.pop();
        node.closed = true;

        // get neigbours of the current node
        neighbors = node.neighbors;
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            if (neighbor.closed) {
                continue;
            }
            if (neighbor.opened === BY_START) {
                return Util.biBacktrace(neighbor, node);
            }

            x = neighbor.x;
            y = neighbor.y;

            // get the distance between current node and the neighbor
            // and calculate the next g score
            ng = node.g + ((x - node.x === 0 || y - node.y === 0) ? 1 : SQRT2);

            // check if the neighbor has not been inspected yet, or
            // can be reached with smaller cost from the current node
            if (!neighbor.opened || ng < neighbor.g) {
                neighbor.g = ng;
                neighbor.h = neighbor.h || weight * heuristic(abs(x - startNode.x), abs(y - startNode.y), abs(z - startNode.z));
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = node;

                if (!neighbor.opened) {
                    endOpenList.push(neighbor);
                    neighbor.opened = BY_END;
                } else {
                    // the neighbor can be reached with smaller cost.
                    // Since its f value has been updated, we have to
                    // update its position in the open list
                    endOpenList.updateItem(neighbor);
                }
            }
        } // end for each neighbor
    } // end while not open list empty

    // fail to find the path
    return [];
};

module.exports = BiAStarFinder;

},{"../core/Heap":4,"../core/Heuristic":5,"../core/Util":7}],12:[function(require,module,exports){
var BiAStarFinder = require('./BiAStarFinder');

/**
 * Bi-direcitional Best-First-Search path-finder.
 * @constructor
 * @extends BiAStarFinder
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 */
function BiBestFirstFinder(opt) {
    BiAStarFinder.call(this, opt);

    var orig = this.heuristic;
    this.heuristic = function(dx, dy) {
        return orig(dx, dy) * 1000000;
    };
}

BiBestFirstFinder.prototype = new BiAStarFinder();
BiBestFirstFinder.prototype.constructor = BiBestFirstFinder;

module.exports = BiBestFirstFinder;

},{"./BiAStarFinder":11}],13:[function(require,module,exports){
var Util = require('../core/Util');

/**
 * Bi-directional Breadth-First-Search path finder.
 * @constructor
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 */
function BiBreadthFirstFinder(opt) {
    opt = opt || {};
}


/**
 * Find and return the the path.
 * @return {Array.<[number, number]>} The path, including both start and
 *     end positions.
 */
BiBreadthFirstFinder.prototype.findPath = function(startNode, endNode, nodes) {
    var startOpenList = [], endOpenList = [],
        neighbors, neighbor, node,
        BY_START = 0, BY_END = 1,
        i, l;

    // push the start and end nodes into the queues
    startOpenList.push(startNode);
    startNode.opened = true;
    startNode.by = BY_START;

    endOpenList.push(endNode);
    endNode.opened = true;
    endNode.by = BY_END;

    // while both the queues are not empty
    while (startOpenList.length && endOpenList.length) {

        // expand start open list

        node = startOpenList.shift();
        node.closed = true;

        neighbors = node.neighbors;
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            if (neighbor.closed) {
                continue;
            }
            if (neighbor.opened) {
                // if this node has been inspected by the reversed search,
                // then a path is found.
                if (neighbor.by === BY_END) {
                    return Util.biBacktrace(node, neighbor);
                }
                continue;
            }
            startOpenList.push(neighbor);
            neighbor.parent = node;
            neighbor.opened = true;
            neighbor.by = BY_START;
        }

        // expand end open list

        node = endOpenList.shift();
        node.closed = true;

        neighbors = node.neighbors;
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            if (neighbor.closed) {
                continue;
            }
            if (neighbor.opened) {
                if (neighbor.by === BY_START) {
                    return Util.biBacktrace(neighbor, node);
                }
                continue;
            }
            endOpenList.push(neighbor);
            neighbor.parent = node;
            neighbor.opened = true;
            neighbor.by = BY_END;
        }
    }

    // fail to find the path
    return [];
};

module.exports = BiBreadthFirstFinder;

},{"../core/Util":7}],14:[function(require,module,exports){
var BiAStarFinder = require('./BiAStarFinder');

/**
 * Bi-directional Dijkstra path-finder.
 * @constructor
 * @extends BiAStarFinder
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 */
function BiDijkstraFinder(opt) {
    BiAStarFinder.call(this, opt);
    this.heuristic = function(dx, dy, dz) {
        return 0;
    };
}

BiDijkstraFinder.prototype = new BiAStarFinder();
BiDijkstraFinder.prototype.constructor = BiDijkstraFinder;

module.exports = BiDijkstraFinder;

},{"./BiAStarFinder":11}],15:[function(require,module,exports){
var Util = require('../core/Util');

/**
 * Breadth-First-Search path finder.
 * @constructor
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 */
function BreadthFirstFinder(opt) {
    opt = opt || {};
}

/**
 * Find and return the the path.
 * @return {Array.<[number, number]>} The path, including both start and
 *     end positions.
 */
BreadthFirstFinder.prototype.findPath = function(startNode, endNode, nodes) {
    var openList = [],
        neighbors, neighbor, node, i, l;

    // push the start pos into the queue
    openList.push(startNode);
    startNode.opened = true;

    // while the queue is not empty
    while (openList.length) {
        // take the front node from the queue
        node = openList.shift();
        node.closed = true;

        // reached the end position
        if (node === endNode) {
            return Util.backtrace(endNode);
        }

        neighbors = node.neighbors;
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            // skip this neighbor if it has been inspected before
            if (neighbor.closed || neighbor.opened) {
                continue;
            }

            openList.push(neighbor);
            neighbor.opened = true;
            neighbor.parent = node;
        }
    }

    // fail to find the path
    return [];
};

module.exports = BreadthFirstFinder;

},{"../core/Util":7}],16:[function(require,module,exports){
var AStarFinder = require('./AStarFinder');

/**
 * Dijkstra path-finder.
 * @constructor
 * @extends AStarFinder
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 */
function DijkstraFinder(opt) {
    AStarFinder.call(this, opt);
    this.heuristic = function(dx, dy) {
        return 0;
    };
}

DijkstraFinder.prototype = new AStarFinder();
DijkstraFinder.prototype.constructor = DijkstraFinder;

module.exports = DijkstraFinder;

},{"./AStarFinder":8}],17:[function(require,module,exports){
//     Underscore.js 1.5.1
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.5.1';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? void 0 : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed > result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value == null ? _.identity : value);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, "length").concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error("bindAll must be passed function names");
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var result;
    var timeout = null;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

},{}],18:[function(require,module,exports){
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

},{"./Connector":19,"./EventEmitter":21,"./Vec2":25}],19:[function(require,module,exports){
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

},{"./EventEmitter":21,"./Line":22,"./Vec2":25}],20:[function(require,module,exports){
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

},{"./Box":18,"./EventEmitter":21,"./Line":22,"./Vec2":25,"underscore":17}],21:[function(require,module,exports){
exports.EventEmitter = EventEmitter;

/**
 * Base class for other classes that wants to emit events.
 * @constructor
 * @class EventEmitter
 */
function EventEmitter(){
}
EventEmitter.prototype.constructor = EventEmitter;

/**
 * Add an event listener
 * @method on
 * @param  {String} type
 * @param  {Function} listener
 * @return {EventEmitter} Self.
 */
EventEmitter.prototype.on = function ( type, listener ) {
    if ( this._listeners === undefined ) this._listeners = {};
    var listeners = this._listeners;
    if ( listeners[ type ] === undefined ) {
        listeners[ type ] = [];
    }
    if ( listeners[ type ].indexOf( listener ) === - 1 ) {
        listeners[ type ].push( listener );
    }
    return this;
};

/**
 * Remove an event lister
 * @method off
 * @param  {String} type
 * @param  {Function} listener
 * @return {EventEmitter}          Self.
 */
EventEmitter.prototype.off = function ( type, listener ) {
    if ( this._listeners === undefined ) return;
    var listeners = this._listeners;
    var index = listeners[ type ].indexOf( listener );
    if ( index !== - 1 ) {
        listeners[ type ].splice( index, 1 );
    }
    return this;
};

/**
 * Emit/dispatch an event
 * @param  {Object} event
 * @return {EventEmitter}       Self.
 */
EventEmitter.prototype.emit = function ( event ) {
    if ( this._listeners === undefined ) return;
    var listeners = this._listeners;
    var listenerArray = listeners[ event.type ];
    if ( listenerArray !== undefined ) {
        event.target = this;
        for ( var i = 0, l = listenerArray.length; i < l; i ++ ) {
            listenerArray[ i ].call( this, event );
        }
    }
    return this;
};

/**
 * Trigger an event
 */
EventEmitter.prototype.trigger = function ( type ) {
    return this.emit({type:type});
};

},{}],22:[function(require,module,exports){
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

},{"./Connector":19,"./EventEmitter":21,"./LineNode":23,"./LineSegment":24,"./Vec2":25,"pathfinding":1}],23:[function(require,module,exports){
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

},{"./EventEmitter":21,"./Vec2":25}],24:[function(require,module,exports){
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

},{"./EventEmitter":21}],25:[function(require,module,exports){
exports.Vec2 = Vec2;

/**
 * @constructor
 * @class Vec2
 */
function Vec2(x,y){
    this.x = x || 0;
    this.y = y || 0;
};

/**
 * Clone object
 * @method clone
 * @return {Vec2}
 */
Vec2.prototype.clone = function() {
    return new Vec2(this.x,this.y);
};

/**
 * Check if equal to other Vec2
 * @method equal
 * @param  {Vec2} v
 * @param  {Number} precision
 * @return {Boolean}
 */
Vec2.prototype.equal = function(v,precision) {
    precision = 0;
    return Math.pow(v.x-this.x,2) + Math.pow(v.y-this.y,2) < precision*precision;
};

/**
 * Subtract
 * @method subtract
 * @param  {Vec2} v
 * @param  {Vec2} target
 * @return {Vec2}
 */
Vec2.prototype.subtract = function(v,target) {
    target = target || new Vec2();
    target.x = this.x - v.x;
    target.y = this.y - v.y;
    return target;
};

/**
 * Get the squared length of the vector
 * @method norm2
 * @return {Number}
 */
Vec2.prototype.norm2 = function() {
    return Math.pow(this.x,2) + Math.pow(this.y,2);
}

/**
 * Length of the vector
 * @method norm
 * @param  {Vec2} v
 * @param  {Vec2} target
 * @return {Vec2}
 */
Vec2.prototype.norm = function() {
    return Math.sqrt( this.norm2() );
};

},{}],26:[function(require,module,exports){
// Exports to the browser standalone bundle
exports.Diagram =   require('./Diagram').Diagram;
exports.Box =       require('./Box').Box;
exports.Line =      require('./Line').Line;
exports.Vec2 =      require('./Vec2').Vec2;

},{"./Box":18,"./Diagram":20,"./Line":22,"./Vec2":25}]},{},[26])(26)
});
;