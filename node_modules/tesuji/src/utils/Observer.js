/**
 * Computed variable, dependant on some observable
 */
 
var events = require("./events");
var Subscribable = require("./Subscribable");

/**
 * Observer is a subscribable which watches a function and each time some variable in it changes, it is called again and its return value is passed to subscribers.
 */

var Observer = function Observer(fn, observerInfo) {
	// call Subscribable constructor
	Subscribable.call(this);
	
	this.fn = fn;
	this.dependency = [];
	this.currentValue = null;
	this.observerInfo = observerInfo;
	
	// hard binded callbacks
	this._dependencyGetter = this.dependencyGetter.bind(this);
	
	this.call();
}

Observer.prototype = Object.create(Subscribable.prototype);
Observer.constructor = Observer;

Observer.prototype.unsubscribe = function(property, callback) {
	// call parent's unsubscribe()
	Subscribable.prototype.unsubscribe.call(this, property, callback);
	
	// if there are no subscribers, unsubscribe dependent observables
	if(typeof property !=  "string") property = "__all__";
	if(!this._subscribers[property].length) this.clearDependencies();
}

Observer.prototype.dependencyGetter = function(value, parent, key) {
	// check dependencies
	
	for(var i = 0; i < this.dependency.length; i++) {
		if(this.dependency[i].object == parent && this.dependency[i].property == key) return;
	}
	
	// add dependent value
	this.dependency.push({
		object: parent,
		property: key
	});
}

Observer.prototype.call = function() {
	// remove old dependencies
	this.clearDependencies();
	
	// listen for new dependencies
	events.on("observable.get", this._dependencyGetter);
	
	// call function and get actual value
	this.currentValue = this.fn();
	
	// stop listening for dependencies
	events.off("observable.get", this._dependencyGetter);
	
	// subscribe dependent values
	for(var i = 0; i < this.dependency.length; i++) {
		this.dependency[i].object.subscribe(this.dependency[i].property, this);
	}

	// notify own subscribers
	this.notify(this.currentValue);
}

Observer.prototype.clearDependencies = function() {
	for(var i = 0; i < this.dependency.length; i++) {
		this.dependency[i].object.unsubscribe(this.dependency[i].property, this);
	}
	this.dependency = [];
}

module.exports = Observer;
