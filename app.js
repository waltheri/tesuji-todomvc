(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Component class.
 *
 * @exports component
 */

var registeredComponents = {}; //require(""); - something here
var registeredAttributes = require("./attributes/attributeHandlers"); 

/* BindingContext class */

var ElementBindingContext = function(domElement, model, parent) {
	this.domElement = domElement;
	this.model = model;
	this.parent = parent;
	this.traverseChildren = true;
	this.bindings = [];
}

ElementBindingContext.prototype = {
	constructor: ElementBindingContext,
	
	stopTraversing: function() {
		this.traverseChildren = false;
	},
	
	keepTraversing: function() {
		return this.traverseChildren;
	},
	
	addBinding: function(binding) {
		this.bindings.push(binding);
	},
	
	clearBindings: function() {
		var binding;
		while(binding = this.bindings.pop()) binding.clean();
	},
	
	rebind: function(model, parent) {
		this.clearBindings();
		this.model = model;
		this.parent = parent;
		this.traverseChildren = true;
	}
}

/* traverse DOM tree */
var applyModelOnDOMElement = function(domElement, model, parent) {
	if(domElement.nodeType !== Node.ELEMENT_NODE) return;
	
	var attributeName;
	
	if(domElement.tesujiBindingContext == null) domElement.tesujiBindingContext = new ElementBindingContext(domElement, model, parent);
	else domElement.tesujiBindingContext.rebind(model, parent);
	
	if(registeredComponents[domElement.nodeName]) {
		// handle specially
	}
	else {
		for(var i = 0; i < domElement.attributes.length; i++) {
			if(domElement.attributes[i].name.search('data-') === 0) {
				// this a data attribute
				attributeName = domElement.attributes[i].name.substring(5);
				
				processDataAttribute(attributeName, domElement.attributes[i].value, domElement.tesujiBindingContext);
			}
		}
	}
	
	if(domElement.tesujiBindingContext.keepTraversing()) {
		for(var i = 0; i < domElement.children.length; i++) {
			applyModelOnDOMElement(domElement.children[i], model, parent);
		}
	}

}

/* process data attribute */
var processDataAttribute = function(name, value, elementBindingContext) {
	var binding;
	
	for(var i = 0; i < registeredAttributes.length; i++) {
		if((registeredAttributes[i].pattern.constructor == String && registeredAttributes[i].pattern == name) || (registeredAttributes[i].pattern.constructor == RegExp && name.search(registeredAttributes[i].pattern) >= 0)) {
			binding = new registeredAttributes[i](name, value, elementBindingContext);
			elementBindingContext.addBinding(binding);
			binding.apply();
		}
	}
}

/*
var readFunctionFactory = function(value, context) {
	var argsNames = [];
	var argsValues = [];
	
	// attributes function arguments - currently just model
	var args = {
		m: context.model,
		p: context.parent
	}
	
	// prepare arguments names and values
	for(var key in args) {
		argsNames.push(key);
		argsValues.push(args[key]);
	}
	
	// function body
	argsNames.push("return ("+value+");");
	
	var fn = Function.apply(null, argsNames);
	
	// return function
	return function() {
		return fn.apply(context.domElement, argsValues);
	}
}

var writeFunctionFactory = function(value, context) {
	var argsNames = [];
	var argsValues = [];
	
	// attributes function arguments - currently just model
	var args = {
		m: context.model,
		p: context.parent
	}
	
	// prepare arguments names and values
	for(var key in args) {
		argsNames.push(key);
		argsValues.push(args[key]);
	}
	
	// function body
	argsNames.push("val");
	argsNames.push(value+" = val;");
	
	var fn = Function.apply(null, argsNames);
	var argsCount = argsValues.length;
	
	// return function
	return function(val) {
		argsValues[argsCount] = val;
		fn.apply(context.domElement, argsValues);
	}
}

var eventFunctionFactory = function(value, context) {
	var argsNames = [];
	var argsValues = [];
	
	// attributes function arguments - currently just model
	var args = {
		m: context.model,
		p: context.parent
	}
	
	// prepare arguments names and values
	for(var key in args) {
		argsNames.push(key);
		argsValues.push(args[key]);
	}
	
	// function body
	argsNames.push("event");
	argsNames.push(value);
	
	var fn = Function.apply(null, argsNames);
	var argsCount = argsValues.length;
	
	// return function
	return function(event) {
		argsValues[argsCount] = event;
		fn.apply(context.domElement, argsValues);
	}
}*/

/** Destroy all bindings of the DOM element on the model (opposite of applyModelOnDOMElement) */

var removeModelFromDOMElement = function(domElement) {
	if(domElement.nodeType !== Node.ELEMENT_NODE) return;
	if(domElement.tesujiBindingContext == null) return;
	
	if(domElement.tesujiBindingContext.keepTraversing()) {
		for(var i = 0; i < domElement.children.length; i++) {
			removeModelFromDOMElement(domElement.children[i]);
		}
	}
	
	domElement.tesujiBindingContext.clearBindings();
}

/**
 * Abstract component class
 * Represents some component of the web page. It is composed from HTML template and data model.
 */
 
var Component = function() {
	this.parentElement = null;
	//this.parentModel = null;
	this.modelMap = [];
	this.model = [];
	this.templateNodes = [];
	var parentModel = null;
	Object.defineProperty(this, "parentModel", {
		get: function() {
			return parentModel;
		},
		set: function(v) {
			parentModel = v;
		}
	}); // temp fix
}

Component.prototype = {
	constructor: Component,
	template: "",
	name: null,
	_keepHot: true,
	
	createModel: function(model) {
		return (model instanceof Array) ? model.slice() : [model];
	},
	
	/**
	 * Apply *initial* model on the template
	 */
	 
	applyModel: function() {
		if(this.model.length == 0) {
			// no model item - don't render any HTML
			this.parentElement.innerHTML = "";
			this.templateNodes = [];
		}
		else {
			// first template copy already in the DOM
			this.bindModel(0);
			
			// multiple injections
			for(var i = 1; i < this.model.length; i++) {
				// for other instances we need to clone
				this.cloneTemplateNodes();
				this.bindModel(i);
			}
		}
	},
	
	updateModel: function(newModel) {
		var oldPos;
		newModel = this.createModel(newModel);
		
		for(var i = 0; i < newModel.length; i++) {
			oldPos = this.model.indexOf(newModel[i]);
			
			if(oldPos >= 0) {
				// model already in the DOM
				if(i != oldPos) {
					// adjust template
					this.moveTemplateNodes(oldPos, i);
					// and model
					this.model.splice(i, 0, this.model.splice(oldPos, 1)[0]);
				}				
			}
			else {
				// check whether current old model is in a new model array
				if(this.templateNodes[i] && newModel.indexOf(this.model[i]) == -1) {
					// just replace model at i
					this.model[i] = newModel[i];
					// bind model and template nodes
					this.bindModel(i);
				}
				else {
					// insert templateNodes at i
					this.cloneTemplateNodes(i);
					// insert model at i
					this.model.splice(i, 0, newModel[i]);
					// bind model and template nodes
					this.bindModel(i);
				}
			}
		}
		
		if(this.model.length > newModel.length) {
			// remove redundant template nodes
			for(var i = this.templateNodes.length-1; newModel.length <= i; i--) {
				this.unbindModel(i);
				this.removeTemplateNodes(i);
			}
			
			// and models
			this.model.splice(newModel.length, this.model.length-newModel.length);
		}
	},
	
	bindModel: function(n) {
		for(var i = 0; i < this.templateNodes[n].length; i++) applyModelOnDOMElement(this.templateNodes[n][i], this.model[n], this.parentModel);
	},
	
	unbindModel: function(n) {
		for(var i = 0; i < this.templateNodes[n].length; i++) removeModelFromDOMElement(this.templateNodes[n][i]);
	},
	
	/**
	 * Clone template nodes at the specified position. If ommited, template is cloned at the end.
	 */
	 
	cloneTemplateNodes: function(position) {
		if(!this.templateNodes[0]) {
			// fill element.innerHTML with the template
			this.parentElement.innerHTML = this.template;
			
			// save template nodes
			this.templateNodes.push(Array.prototype.slice.call(this.parentElement.childNodes));
			
			return;
		}
		
		var clonedNode, clonedNodes = [];
		var templateNodes = this.templateNodes[0]; // need to be changed, because this.templateNodes[0] doesn't have to exist.
		
		if(position == null || position == this.templateNodes.length) {
			// insert at the end
			for(var i = 0; i < templateNodes.length; i++) {
				clonedNode = templateNodes[i].cloneNode(true);
				this.parentElement.appendChild(clonedNode);
				clonedNodes.push(clonedNode);
			}
			
			this.templateNodes.push(clonedNodes);
		}
		else {
			// insert at the position (before nodes of this.templateNodes[position])
			for(var i = 0; i < templateNodes.length; i++) {
				clonedNode = templateNodes[i].cloneNode(true);
				this.parentElement.insertBefore(clonedNode, this.templateNodes[position][0]);
				clonedNodes.push(clonedNode);
			}
			
			this.templateNodes.splice(position, 0, clonedNodes);
		}
	},
	
	removeTemplateNodes: function(position) {
		var templateNodes;
		if(position == null) {
			// remove last template nodes
			templateNodes = this.templateNodes.pop();
		}
		else {
			//	remove template nodes on given position
			templateNodes = this.templateNodes.splice(position, 1)[0];
		}
		
		for(var i = 0; i < templateNodes.length; i++) {
			this.parentElement.removeChild(templateNodes[i]);
		}
	},
	
	// currently only works if from > to
	moveTemplateNodes: function(from, to) {
		var templateNodes = this.templateNodes[from];
		
		// insert at the position (before nodes of this.templateNodes[position])
		for(var i = 0; i < templateNodes.length; i++) {
			this.parentElement.insertBefore(templateNodes[i], this.templateNodes[to][0]);
		}
		
		this.templateNodes.splice(from, 1);
		this.templateNodes.splice(to, 0, templateNodes);
	}
	
}

/**
 * Immutable component class
 *
 * HTML template and model are immutable - they cannot be changed after the component is initialized.
 *
 * ImmutableComponent class itself is an abstract class - it doesn't contain any template. However, you can extended it with a template and create your own component class.
 * Be aware that HTML template != HTML output, HTML output is HTML template enriched with the model data, and even it can be composed from multiple copies of the template. 
 * So HTML output is mutable and depends on the model.
 *
 * Component objects contain method inject(?), which can be used to insert component into the DOM. And the component can be injected into any element any time.
 */
 
var ImmutableComponent = function(model) {
	Component.call(this);
	this.model = this.createModel(model);
}

ImmutableComponent.prototype = Object.create(Component.prototype);
ImmutableComponent.prototype.constructor = ImmutableComponent;

/**
 * Inject component into the DOM element and produce output.
 */
	 
ImmutableComponent.prototype.inject = function(element) {
	// set parent element
	this.parentElement = element;
	this.parentElement.tesujiComponent = this;
	
	// fill element.innerHTML with the template
	this.parentElement.innerHTML = this.template;
	
	// save template nodes
	this.templateNodes.push(Array.prototype.slice.call(this.parentElement.childNodes));
	
	// apply model
	this.applyModel();
}

/**
 * Binded component class
 *
 * It differs from the basic component in the fact, it doesn't contain its template. It uses HTML content of its parent DOM element as the template.
 * Also it has mutable model - it can be changed. On the other side instance is strictly binded to its parent DOM element.
 */
 
var FixedComponent = function(parentElement) {
	if(parentElement == null) throw new TypeError("Property 'parentElement' must not be null.");
	
	Component.call(this);
	
	// set parent element - it cannot be changed
	this.parentElement = parentElement;
	this.parentElement.tesujiComponent = this;
	
	// save template html
	this.template = parentElement.innerHTML;
	
	// save template nodes
	this.templateNodes.push(Array.prototype.slice.call(this.parentElement.childNodes));
}

FixedComponent.prototype = Object.create(Component.prototype);
FixedComponent.prototype.constructor = FixedComponent;

FixedComponent.prototype.setModel = function(model) {
	this.model = this.createModel(model);
	
	// and apply it
	this.applyModel();
}


/**
 * Possible calls:
 * 
 * 1) component(String template[, String name, Function mappingFunction])
 *    Predefine component - its instances can be injected into the DOM
 *
 * 2) component(DOMElement element, <Model> model)
 *    create component 'on the fly' and fill it with the model
 * 
 * 3) component()
 *    return Component class
 */

Component.fromHTML = function(template) {
	if(typeof template != "string") {
		throw new TypeError("Function 'Component.fromHTML' argument must be type of 'string'.");
	}
	
	// create a subclass of the Component
	var NewComponent = function(model) {
		ImmutableComponent.call(this, model);
	}
	NewComponent.prototype = Object.create(ImmutableComponent.prototype);
	NewComponent.constructor = NewComponent;
	
	// save its template
	NewComponent.prototype.template = template;
	
	/*// register component if it has name
	if(typeof name == "string") {
		NewComponent.prototype.name = name;
		registeredComponents[name] = NewComponent;
	}
	
	// save mapping function if any
	if(typeof mappingFunction == "function") NewComponent.prototype.getModelFromAttributes = mappingFunction;*/
	
	return NewComponent;
}

Component.FixedComponent = FixedComponent;

/*
var component = function(template, name, parent) {
	//if(template == null) return Component;
	else if(typeof template == "string") {
		// create a subclass of the Component
		var NewComponent = function(model) {
			ImmutableComponent.call(this, model);
		}
		NewComponent.prototype = Object.create(ImmutableComponent.prototype);
		NewComponent.constructor = NewComponent;
		
		// save its template
		NewComponent.prototype.template = template;
		
		// register component if it has name
		if(typeof name == "string") {
			NewComponent.prototype.name = name;
			registeredComponents[name] = NewComponent;
		}
		
		// save mapping function if any
		if(typeof mappingFunction == "function") NewComponent.prototype.getModelFromAttributes = mappingFunction;
		
		return NewComponent;
	}
	else if(template instanceof HTMLElement && name != null) {
		var compInstance;
		if(template.tesujiComponent) {
			compInstance = template.tesujiComponent;
			compInstance.updateModel(name);
		}
		else { 
			compInstance = new BindedComponent(template);
			compInstance.parentModel = parent;
			compInstance.setModel(name);
		}
		
		return compInstance;
	}
	else {
		throw new TypeError("Function 'component' called with invalid arguments.");
	}
}*/

module.exports = Component;
},{"./attributes/attributeHandlers":14}],2:[function(require,module,exports){
/**
 * Cool observables
 *
 * @exports observableObject
 */

"use strict";

var events = require("./utils/events");
var ConditionVariable = require("./utils/ConditionVariable");
var Subscribable = require("./utils/Subscribable");

/* TEMPORARY Computed object */

var Computed = function Computed(readFn, writeFn, context) {
	this.readFn = readFn;
	this.writeFn = writeFn;
	this.context = context;
}

/** deeply freeze an object to make it fully immutable */
var deepFreeze = function(obj) {
	if(obj == null || typeof obj != 'object' || Object.isFrozen(obj) || obj._keepHot) return;

	Object.freeze(obj); // First freeze the object.
	
	for (var key in obj) {
		if(obj.hasOwnProperty(key)) deepFreeze(obj[key]); // Recursively call deepFreeze.
	}
}

var setValue = function(context, value, key) {
	// not null check
	if(value == null && context.notNull) throw new TypeError("Trying to assign null to the property '"+key+"', but value of an observable property cannot be null (or undefined).");
	if(context.condition != null) context.condition.test(value, key);
	
	context.value = value
}
	
var createPropertyDescriptor = function(obj, key, parent) {
	var context = {
		value: undefined,
		condition: null,
		notNull: false,
		subscription: null
	}
	
	if(obj[key] instanceof ConditionVariable) {
		context.condition = obj[key];
		context.value = obj[key].initialValue;
	}
	else if(obj[key] instanceof Computed) {
		// computed variable
		var descriptor = {
			enumerable: false
		}
		
		// save object
		context.value = obj[key];
		
		// read function
		if(context.value.readFn) {
			descriptor.get = context.value.readFn.bind(context.value.context == null ? parent : context.value.context);
		}
		
		// write function
		if(context.value.writeFn) {
			descriptor.set = context.value.writeFn.bind(context.value.context == null ? parent : context.value.context);
		}
		
		return descriptor;
	}
	else if(obj[key] instanceof ModelArray) {
		context.subscription = function() {
			parent.notify(key, obj[key]);
		}
		obj[key].subscribe(context.subscription);
		
		context.value = obj[key];
	}
	else {
		context.value = obj[key];
	}
	
	deepFreeze(context.value);
	
	return {
		enumerable: true,
		get: function() {
			// trigger getter event
			events.trigger("observable.get", context.value, parent, key);
			
			return context.value;
		},
		set: function(new_val) {
			//setValue(context, new_val, key);
			// not null check
			if(new_val == null && context.notNull) throw new TypeError("Trying to assign null to the property '"+key+"', but value of an observable property cannot be null (or undefined).");
			if(context.condition != null) context.condition.test(new_val, key);
			
			if(context.subscription) context.value.unsubscribe(context.subscription);
			
			if(new_val instanceof ModelArray) {
				context.subscription = function() {
					parent.notify(key, new_val);
				}
				new_val.subscribe(context.subscription);
				
				context.value = new_val;
			}
			else {
				context.value = new_val
			}

			deepFreeze(context.value);

			parent.notify(key, new_val);
		}
	}
}

var initObservableInstance = function(source) {
	var properties = {};
	
	for(var key in source) {
		if(source.hasOwnProperty(key)) {
			properties[key] = createPropertyDescriptor(source, key, this);
		}
	}
	
	// define properties
	Object.defineProperties(this, properties);
	
	// seal object
	Object.seal(this);
}

/**
 * Create model class with a subscribable interface.
 */
 
var makeModelClass = function(parentClass, constructor) {
	// inherits methods from parent class
	constructor.prototype = Object.create(parentClass.prototype);
	
	// inherits methods from Subscribable class 
	for(var key in Subscribable.prototype) {
		constructor.prototype[key] = Subscribable.prototype[key];
	}
	
	constructor.prototype.constructor = constructor;
	constructor.prototype._keepHot = true;
	
	return constructor;
}

/* generic Model */
var Model = makeModelClass(Object, function Model(source) {
	// call Subscribable constructor
	Subscribable.call(this);
	
	// init model
	initObservableInstance.call(this, source);
	
});

/* Model Array */
var ModelArray = makeModelClass(Array, function ModelArray(source) {
	// call Subscribable constructor
	Subscribable.call(this);
	
	this.length = 0;
	
	for(var i = 0; i < source.length; i++) {
		// use old method for initialization
		Array.prototype.push.call(this, source[i]);
	}
});

var arrayAlteringMethods = ["pop", "push", "reverse", "shift", "unshift", "splice", "sort"];

var alteredArrayMethod = function(name) {
	return function() {
		var response = Array.prototype[name].apply(this, arguments);
		this.notify();
		return response;
	}
}

for(var i = 0; i < arrayAlteringMethods.length; i++) {
	ModelArray.prototype[arrayAlteringMethods[i]] = alteredArrayMethod(arrayAlteringMethods[i]);
}

ModelArray.prototype.constructor = ModelArray;

Model.Array = ModelArray;
Model.extend = function(constructor) {
	var submodel = function() {
		// call parent constructor
		constructor.apply(this, arguments);
		
		// init the magic
		Model.call(this, this);
	}
	
	submodel.prototype = Object.create(Model.prototype);
	submodel.prototype.constructor = submodel;
	return submodel;
}

Model.computed = function(readFn, writeFn, context) {
	return new Computed(readFn, writeFn, context);
}

// export it
module.exports = Model;

},{"./utils/ConditionVariable":16,"./utils/Subscribable":18,"./utils/events":20}],3:[function(require,module,exports){
/** data-text handler */

var ElementAttributeBinding = require("./ElementAttributeBinding");

module.exports = ElementAttributeBinding.extend({
	read: function(value) {
		if(value) {
			this.context.domElement.checked = true;
		}
		else {
			this.context.domElement.checked = false;
		}
	}
}, 'checked');

},{"./ElementAttributeBinding":6}],4:[function(require,module,exports){
/** data-class handler */

/* value = Object with JS style definitions */

var ElementAttributeBinding = require("./ElementAttributeBinding");

module.exports = ElementAttributeBinding.extend({
	read: function(value) {
		if(typeof value != "object") throw TypeError("Attribute data-class accepts objects, '"+(typeof value)+"' was given.");
		
		for(var key in value) {
			if(value.hasOwnProperty(key)) {
				if(value[key]) {
					this.context.domElement.classList.add(key);
				}
				else {
					this.context.domElement.classList.remove(key);
				}
			}
		}
	}
}, 'class');

},{"./ElementAttributeBinding":6}],5:[function(require,module,exports){
/** data-component handler */
/* value = <component> */

var ElementAttributeBinding = require("./ElementAttributeBinding");

module.exports = ElementAttributeBinding.extend({
	read: function(value) {
		var Component = require("../Component");
		
		if(!(value instanceof Component)) throw TypeError("Attribute data-component accepts instances of 'Component', instance of '"+(value.constructor && value.constructor.name ? value.constructor.name  : "[unknown]")+"' was given.");
		
		value.parentModel = this.context.model;
		value.inject(this.context.domElement);
		
		this.context.stopTraversing();
	},
}, 'component');

},{"../Component":1,"./ElementAttributeBinding":6}],6:[function(require,module,exports){
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

},{"../utils/Observer":17}],7:[function(require,module,exports){
/** data-on* handler */
/* callback = event callback */

var ElementAttributeBinding = require("./ElementAttributeBinding");

module.exports = ElementAttributeBinding.extend({
	event: function(callback) {
		var evName = this.name.substring(2);

		this.event_callback = callback;
		this.context.domElement.addEventListener(evName, callback);
	},
	clean: function() {
		var evName = this.name.substring(2);
		
		this.context.domElement.removeEventListener(evName, this.event_callback);
		delete this.event_callback;
	}
}, /on.*/i);
},{"./ElementAttributeBinding":6}],8:[function(require,module,exports){
/** data-text handler */

var ElementAttributeBinding = require("./ElementAttributeBinding");

module.exports = ElementAttributeBinding.extend({
	read: function(value) {
		this.context.domElement.innerHTML = value;
		this.context.stopTraversing();
	},
}, 'html');
},{"./ElementAttributeBinding":6}],9:[function(require,module,exports){
/** data-if handler */

var ElementAttributeBinding = require("./ElementAttributeBinding");

module.exports = ElementAttributeBinding.extend({
	read: function(value) {
		if(value) {
			this.context.domElement.style.display = "";
		}
		else {
			this.context.domElement.style.display = "none";
		}
	},
}, 'if');

},{"./ElementAttributeBinding":6}],10:[function(require,module,exports){
/** data-style handler */

/* value = Object with JS style definitions */
var ElementAttributeBinding = require("./ElementAttributeBinding");

module.exports = ElementAttributeBinding.extend({
	read: function(value) {
		if(typeof value != "object") throw TypeError("Attribute data-style accepts objects, '"+(typeof value)+"' was given.");
		
		for(var key in value) {
			if(value.hasOwnProperty(key)) {
				if(value[key] != null && value[key].valueOf() !== false) {
					this.context.domElement.style[key] = value[key];
				}
			}
		}
	}
}, 'style');

},{"./ElementAttributeBinding":6}],11:[function(require,module,exports){
/** data-text handler */

var ElementAttributeBinding = require("./ElementAttributeBinding");

module.exports = ElementAttributeBinding.extend({
	read: function(value) {
		this.context.domElement.textContent = value;
		this.context.stopTraversing();
	},
}, 'text');

},{"./ElementAttributeBinding":6}],12:[function(require,module,exports){
/** data-value handler */

var ElementAttributeBinding = require("./ElementAttributeBinding");

module.exports = ElementAttributeBinding.extend({
	read: function(value) {
		if(value != this.context.domElement.value) {
			this.context.domElement.value = value;
		}
	},
	event: function(callback) {
		this.event_callback = function() {
			callback(this.value);
		};
		this.context.domElement.addEventListener("change", this.event_callback);
	},
	createEventFunction: function(functionBody) {
		return this.createFunction(this.value+" = val;", ["m", "p", "val"], [this.context.model, this.context.parent], this.context.domElement);
	},
	clean: function() {
		this.context.domElement.removeEventListener("change", this.event_callback);
		delete this.event_callback;
		
		ElementAttributeBinding.prototype.clean.call(this);
	}
}, 'value');

},{"./ElementAttributeBinding":6}],13:[function(require,module,exports){
/** data-with handler */
/* value = <model> */

var ElementAttributeBinding = require("./ElementAttributeBinding");

module.exports = ElementAttributeBinding.extend({
	read: function(value) {
		var Component = require("../Component");
		
		if(typeof value != "object") throw TypeError("Attribute data-with accepts objects or arrays, '"+(typeof value)+"' was given.");
		
		var component = this.context.domElement.tesujiComponent;
		if(component) {
			component.parentModel = this.context.model;
			component.updateModel(value);
		}
		else {
			component = new Component.FixedComponent(this.context.domElement);
			component.parentModel = this.context.model;
			component.setModel(value);
		}

		this.context.stopTraversing();
	},
}, 'with');

},{"../Component":1,"./ElementAttributeBinding":6}],14:[function(require,module,exports){
/** Data handlers */

var attributeHandlers = [
	require("./TextAttribute"),
	require("./HtmlAttribute"),
	require("./StyleAttribute"),
	require("./ClassAttribute"),
	require("./WithAttribute"),
	require("./ComponentAttribute"),
	require("./ValueAttribute"),
	require("./CheckedAttribute"),
	require("./EventsAttribute"),
	require("./IfAttribute"),
];

module.exports = attributeHandlers;

},{"./CheckedAttribute":3,"./ClassAttribute":4,"./ComponentAttribute":5,"./EventsAttribute":7,"./HtmlAttribute":8,"./IfAttribute":9,"./StyleAttribute":10,"./TextAttribute":11,"./ValueAttribute":12,"./WithAttribute":13}],15:[function(require,module,exports){
/* index.js */

var Component = require("./Component");

var tesuji = {
	Component: Component,
	Model: require("./Model"),
	/*applyModel: function(rootElement, model) {
		// handle parameters
		if(model == null) {
			model = rootElement;
			rootElement = document.body;
		}
		
		var component = new Component.FixedComponent(rootElement);
		component.setModel(model);
	},*/
	Type: require("./utils/Type")
}

if(module && module.exports) {
	module.exports = tesuji;
}

window.tesuji = tesuji;

},{"./Component":1,"./Model":2,"./utils/Type":19}],16:[function(require,module,exports){
/** Variables with reuired type */

var ConditionVariable = function(initialValue) {
	this.initialValue = initialValue;
}

/**
 * Condition function must return true for valid value, or throw exception for invalid value.
 *
 * @param key - optional variable name
 */
 
ConditionVariable.prototype.test = function(value, key) {
	// abstract
	throw new ReferenceError("Method 'test' hasn't been implemented.");
}

module.exports = ConditionVariable;

},{}],17:[function(require,module,exports){
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

},{"./Subscribable":18,"./events":20}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
/** Variables with reuired type */

var ConditionVariable = require("./ConditionVariable");

var funcNameRegex = /function ([^\(]*)\(/;

var getConstructorName = function(constructor) {
	if(!constructor) return "[Unknown function]";
	else if(constructor.name) return constructor.name;
	else {
		var match = type.toString().match(funcNameRegex);
		return (match && match[1]) ? match[1] : "[Anonymous function]";
	}
}

var Type = function(type, initialValue) {
	ConditionVariable.call(this, initialValue == null ? new type() : initialValue);
	this.type = type;
	this.typeName = getConstructorName(type);
}

Type.prototype = Object.create(ConditionVariable.prototype);
Type.prototype.constructor = Type;
Type.prototype.test = function(value, key) {
	if(value.constructor != this.type) {
		throw new TypeError("Value of the property '"+key+"' is expected to be '"+this.typeName+"', trying to assign instance of '"+getConstructorName(value.constructor)+"'.");
	}
	else return true;
}

/* factory method of Type */
var typeOf = function(type, initialValue) {
	/* todo add possibility of mixed types */
	return new Type(type, initialValue);
}

var PrimitiveType = function(type, initialValue) {
	ConditionVariable.call(this, initialValue);
	this.type = type;
}

PrimitiveType.prototype = Object.create(ConditionVariable.prototype);
PrimitiveType.prototype.constructor = PrimitiveType;
PrimitiveType.prototype.test = function(value, key) {
	if(typeof value != this.type) {
		throw new TypeError("Value of the property '"+key+"' is expected to be type of '"+this.type+"', trying to assign variable type of '"+(typeof value)+"'.");
	}
	else return true;
}

/* factory method of PrimititveType*/
var primitiveType = function(type) {
	return function(initialValue) {
		return new PrimitiveType(type, initialValue);
	}
}

// export

Type.PrimitiveType = PrimitiveType;
Type.typeOf = typeOf;
Type.string = primitiveType("string");
Type["boolean"] = primitiveType("boolean");
Type.number = primitiveType("number");

module.exports = Type;

},{"./ConditionVariable":16}],20:[function(require,module,exports){
/** Events */

var events = {
	
}

var on = function(evName, callback) {
	if(!events[evName]) events[evName] = [];
	events[evName].push(callback);
}

var off = function(evName, callback) {
	if(!events[evName]) return;
	
	if(callback) {
		var index = events[evName].indexOf(callback);
		if (index >= 0) {
			events[evName].splice(index, 1);
		}
	}
	else {
		events.evName = undefined;
	}
}

var trigger = function(evName) {
	if(!events[evName]) return;
	
	for(var i = 0; i < events[evName].length; i++) {
		events[evName][i].apply(null, Array.prototype.slice.call(arguments, 1));
	}
}

module.exports = {
	on: on,
	off: off,
	trigger: trigger
}

},{}],21:[function(require,module,exports){
/**
 * TodoMVC App in tesuji.js
 */
 
var tesuji = require("tesuji");

var ElementAttributeBinding = require("tesuji/src/attributes/ElementAttributeBinding"); // somehow remove src
var attributeHandlers = require("tesuji/src/attributes/attributeHandlers"); // somehow remove src

var Model = tesuji.Model;
var Type = tesuji.Type;

var FocusBinding = ElementAttributeBinding.extend({
	read: function(value) {
		if(value) this.context.domElement.focus();
	}
}, 'focus');

attributeHandlers.push(FocusBinding);

var TodoAppModel = Model.extend(function(){
	this.todos = new Model.Array([]);
	this.newTodo = "";
	this.page = Type.string("all");
	this.filteredTodos = Model.computed(function(){
		return this.todos.filter(this.filters[this.page]);
	}, null, this);
});

TodoAppModel.prototype.addTodo = function() {
	this.todos.push(new TodoModel(this.newTodo, this));
	this.newTodo = "";
}

TodoAppModel.prototype.removeTodo = function(todo) {
	this.todos.splice(this.todos.indexOf(todo), 1);
}

TodoAppModel.prototype.getIncompleteCount = function() {
	var c = 0;
	for(var i = 0; i < this.todos.length; i++) {
		if(!this.todos[i].isCompleted) c++;
	}
	return c;
}

TodoAppModel.prototype.toggleAll = function() {
	if(this.getIncompleteCount() == 0) {
		for(var i = 0; i < this.todos.length; i++) {
			this.todos[i].isCompleted = false;
		}
	}
	else {
		for(var i = 0; i < this.todos.length; i++) {
			this.todos[i].isCompleted = true;
		}
	}
}

TodoAppModel.prototype.removeCompleted = function() {
	for(var i = this.todos.length-1; 0 <= i; i--) {
		if(this.todos[i].isCompleted) this.removeTodo(this.todos[i]);
	}
}

TodoAppModel.prototype.setPage = function(page) {
	this.page = page;
}

TodoAppModel.prototype.filters = {
	'all': function() {return true},
	'completed': function(todo) {return todo.isCompleted},
	'active': function(todo) {return !todo.isCompleted}
}

var TodoModel = Model.extend(function(label, parent){
	this.isCompleted = false;
	this.isEditing = false;
	this.text = label;
	this.parent = Model.computed(function() {
		return parent;
	});
});

TodoModel.prototype.edit = function(b) {
	this.isEditing = b;
	if(this.isEditing) {
		this.input.focus();
	}
} 

window.todo = new TodoAppModel

var mainComponent = new tesuji.Component.FixedComponent(document.body);
mainComponent.setModel(window.todo);

},{"tesuji":15,"tesuji/src/attributes/ElementAttributeBinding":6,"tesuji/src/attributes/attributeHandlers":14}]},{},[21]);
