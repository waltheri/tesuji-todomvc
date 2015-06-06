/** Abstract binding class - represents binding between model and element for certain data attribute */

var Observer = require("../utils/Observer");

var ElementAttributeBinding = function ElementAttributeBinding(attributeName, attributeValue, elementBindingContext) {
	this.name = attributeName;
	this.value = attributeValue;
	this.context = elementBindingContext;
}

ElementAttributeBinding.prototype = {
	constructor: ElementAttributeBinding,
	
	/**
	 * Signature: read(newValue)
	 * This function is called with a computed value, any time it is changed.
	 */
	 
	read: null,
	
	/**
	 * Signature: event(callback)
	 * Call callback, when something happen
	 */
	 
	event: null,
	
	/**
	 * apply the binding
	 */
	 
	apply: function() {
		if(this.read) {
			// 1. parse value
			this.computed_observable = new Observer(this.createFunction("return ("+this.value+");", ["m", "p"], [this.context.model, this.context.parent], this.context.domElement), {
				/* for debugging only */
				domElement: this.context.domElement, 
				attribute: this.name, 
				value: this.value
			});

			// 2. add subscribers
			this.read_binded = this.read.bind(this);
			this.computed_observable.subscribe(this.read_binded);
			
			// 3. initial element update
			this.read(this.computed_observable.currentValue);
		}
		if(this.event) {
			this.event(this.createEventFunction());
		}
		/*if(registeredAttributes[i].event) {
			// It is a data handler's job
			this.event(name, eventFunctionFactory(value, context), context);
		}*/
	},
	
	/**
	 * Static helper fuction factory
	 */
	 
	createFunction: function(functionBody, argNames, argValues, context) {
		// store context
		var functionArgs = argNames.concat(functionBody);
		var fn = Function.apply(null, functionArgs);
		
		// return function
		return function() {
			// mix predefined arguments with passed 
			var args = argValues.concat(Array.prototype.slice.call(arguments));
			return fn.apply(context, args);
		}
	},

	createEventFunction: function(functionBody) {
		return this.createFunction(this.value, ["m", "p", "event"], [this.context.model, this.context.parent], this.context.domElement);
	},
	
	/**
	 * Cleaning work - after unbind.
	 */
	 
	clean: function() {
		if(this.read && this.computed_observable) {
			this.computed_observable.unsubscribe(this.read_binded);
			delete this.computed_observable;
			delete this.read_binded;
		}
	},
}

/**
 * Attribute pattern,
 */

ElementAttributeBinding.pattern = null;

/**
 * Helper for creating attribute bindings.
 */
ElementAttributeBinding.extend = function(proto, pattern) {
	var NewBindingClass = function(attributeName, attributeValue, elementBindingContext){
		ElementAttributeBinding.call(this, attributeName, attributeValue, elementBindingContext);
	};
	
	NewBindingClass.prototype = Object.create(ElementAttributeBinding.prototype);
	NewBindingClass.prototype.constructor = NewBindingClass;
	
	for(var method in proto) {
		if(proto.hasOwnProperty(method)) NewBindingClass.prototype[method] = proto[method];
	}
	
	NewBindingClass.pattern = pattern;
	
	return NewBindingClass;
}

module.exports = ElementAttributeBinding;
