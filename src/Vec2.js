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
