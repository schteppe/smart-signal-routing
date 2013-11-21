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
