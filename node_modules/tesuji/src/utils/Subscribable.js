/**
 * Subscribable mixin 
 */

var Subscribable = function Subscribable() {
	Object.defineProperty(this, "_subscribers", {
		value: {}, 
		writable: false
	});
}

// notify subscribers (private helper)
var notify = function(subscribers, value) {
	if(!subscribers) return;
	
	var subs = subscribers.slice();
	for(var i = 0; i < subs.length; i++) {
		if(typeof subs[i] == "function") subs[i](value);
		else if(typeof subs[i].call == "function") subs[i].call(value);
		else throw new TypeError("Observer is not callable.");
	}
}

Subscribable.prototype = {
	constructor: Subscribable,
	
	/** 
	 * Subscribe for changes of a property or the whole object 
	 */
	 
	subscribe: function(property, callback) {
		if(typeof property !=  "string") {
			callback = property;
			property = "__all__";
		}
		
		this._subscribers[property] = this._subscribers[property] || [];
		
		if(this._subscribers[property].indexOf(callback) == -1) { 
			this._subscribers[property].push(callback);
		}
	},
	
	/** 
	 * Unsubscribe for changes of a property or the whole object  
	 */
	 
	unsubscribe: function(property, callback) {
		if(typeof property !=  "string") {
			callback = property;
			property = "__all__";
		}
		
		// empty, don't remove anything
		if(!this._subscribers[property]) return;
		
		// remove everything
		if(callback == null) this._subscribers[property] = [];
		
		// find callback and remove it
		var ind = this._subscribers[property].indexOf(callback);
		if(ind >= 0) this._subscribers[property].splice(ind, 1);
	},
	
	/**
	 *  Notifiy subscribers for changes
	 */
	 
	notify: function(property, val) {
		if(val == null) {
			// if second argument is missing, use property as value
			val = (property == null) ? this : property;
			property = "__all__";
		}
		
		if(property == "__all__") {
			// notify global subscribers
			notify(this._subscribers["__all__"], val);
		}
		else {
			// notify all subscribers of property
			notify(this._subscribers[property], val);
			
			// notify global subscribers as well
			this.notify(/*TODO: some usefull value*/);
		}
	}
}

module.exports = Subscribable;
