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