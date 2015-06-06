/** Debugging tool for the tesuji.js */

/* MODEL dump */

var Model = require("./Model");
var Observer = require("./utils/Observer");
var ModelArray = Model.Array;

var property = function(key) {
	return '<span class="tesuji-property">'+key+'</span>';
}

var objectClass = function(name) {
	return '<span class="tesuji-class">'+name+"</span>";
}

var htmlElement = function(elem) {
	var elem_id = "tesuji"+Math.floor(Math.random()*1000000000);
	window._tesuji_elem_cache = window._tesuji_elem_cache || [];
	window._tesuji_elem_cache[elem_id] = elem;

	return '<a href="javascript: void(0)" onmouseover="_tesuji_elem_cache[\''+elem_id+'\'].style.outline = \'2px solid red\'" onmouseout="_tesuji_elem_cache[\''+elem_id+'\'].style.outline = \'none\'">&lt;'+elem.nodeName.toLowerCase()+'&gt;</a>';
}

var array = function(val, stack, details) {
	var output = "";
	stack = stack || [];
	
	stack.push(val);
	
	output += objectClass("Array");
	
	// array property list
	output += '<ul class="tesuji-dump-list">';
	
	for(var key in val) {
		if(!val.hasOwnProperty(key)) continue;
		
		output += "<li"+(hasChildren(val[key], stack) ? ' class="tesuji-has-children tesuji-open"' : '')+">";
		output += propertyItem(key, val[key], stack, details);
		output += "</li>";
	}
	output += '<li class="tesuji-notown">';
	output += property("length")+": "+formatters["number"](val.length);
	output += "</li>";
	
	output += "</ul>"
	
	stack.pop();
	
	return output;
}

var escapeHtml = function(unsafe) {
	return unsafe
		 .replace(/&/g, "&amp;")
		 .replace(/</g, "&lt;")
		 .replace(/>/g, "&gt;")
		 .replace(/"/g, "&quot;")
		 .replace(/'/g, "&#039;");
}

var formatters = {};

formatters["string"] = function(val) {
	var text = escapeHtml(val);
	if(text.length > 200) return '<em>[...]</em>';
	return '<span class="tesuji-string">"'+text+'"</span>';
}

formatters["number"] = function(val) {
	return '<span class="tesuji-number">'+val+"</span>";
}

formatters["boolean"] = function(val) {
	return '<span class="tesuji-boolean">'+val+'</span>';
}

formatters["object"] = function(val, stack, details) {
	var output = "";
	stack = stack || [];
	
	stack.push(val);
	
	output += objectClass("Object");
	output += propertyList(val, stack, false, details);
	
	stack.pop();
	
	return output;
}

var propertyItem = function(key, val, stack, details) {
	if(stack.indexOf(val) >= 0) {
		// circular
		return property(key)+": [recursion]";
	}
	else if(val == null) {
		return property(key)+": "+formatters["boolean"](val);
	}
	else if(val.dump != null) {
		return ''+property(key)+": "+val.dump(stack, details)+'';
	}
	else if(val instanceof HTMLElement) {
		return property(key)+": "+htmlElement(val);
	}
	else if(val instanceof Array) {
		return property(key)+": "+array(val, stack, details);
	}
	else if(formatters[typeof val]) {
		return property(key)+": "+formatters[typeof val](val, stack, details);
	}
	else {
		return property(key)+": "+val+"";
	}
}

var hasChildren = function(val, stack) {
	return val != null && stack.indexOf(val) < 0 && !(val instanceof HTMLElement) && typeof val != "string" && Object.keys(val).length;
}

var propertyList = function(obj, stack, cantHaveChildren, details) {
	var output = "";
	
	output += '<ul class="tesuji-dump-list">';
	
	for(var key in obj) {
		if(!obj.hasOwnProperty(key)) continue;
		
		output += "<li"+(!cantHaveChildren && hasChildren(obj[key], stack) ? ' class="tesuji-has-children tesuji-open"' : '')+">";
		output += propertyItem(key, obj[key], stack, details);
		output += "</li>";
	}

	output += "</ul>"
	
	return output;
};

Model.prototype.dump = function(stack, details) {
	var output = "";
	if(typeof stack == "boolean") {
		details = stack;
		stack = [];
	}
	else {
		stack = stack || [];
	}
	
	if(stack.length == 0) {
		output += '<div class="tesuji-dump">';
	}
	
	stack.push(this);
	
	output += objectClass("Model");
	output += '<ul class="tesuji-dump-list">'
	
	for(var key in this) {
		if(!this.hasOwnProperty(key)) continue;
		
		if(this._subscribers[key] && this._subscribers[key].length && details) {
			output += '<li class="tesuji-has-children tesuji-open">';
			output += propertyItem(key, this[key], stack, details);
			output += '<div class="tesuji-dump-dependency">';
			output += propertyList(this._subscribers[key], stack, true, details);
			output += "</div>";
			output += "</li>";
		}
		else {
			output += "<li"+(hasChildren(this[key], stack) ? ' class="tesuji-has-children tesuji-open"' : '')+">";
			output += propertyItem(key, this[key], stack, details);
			output += "</li>";
		}
	}

	output += "</ul>"
	stack.pop();
	
	if(stack.length == 0) output += '</div>';
	
	return output;
};

ModelArray.prototype.dump = function(stack, details) {
	var output = "";
	if(typeof stack == "boolean") {
		details = stack;
		stack = [];
	}
	else {
		stack = stack || [];
	}
	
	stack.push(this);
	
	output += objectClass("ModelArray");
	output += propertyList(this, stack, false, details);
	
	stack.pop();
	
	return output;
};

Observer.prototype.dump = function() {
	var output = objectClass("Observer")+" ";
	if(this.observerInfo) {
		if(this.observerInfo.domElement) {
			output += htmlElement(this.observerInfo.domElement)+' ';
		}
		if(this.observerInfo.attribute && this.observerInfo.value) {
			output += '[data-'+this.observerInfo.attribute+'="'+this.observerInfo.value+'"] ';
		}
	}
	
	return output;
}


window.addEventListener("DOMContentLoaded", function(){
	var link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = "../src/debug.css";
	document.head.appendChild(link);
	
	document.addEventListener("click", function(e){
		var elem = e.target;
		
		while(elem && elem.nodeName != "UL" && elem.classList && !elem.classList.contains("tesuji-dump-dependency")) {
			if(elem.nodeName == "LI" && elem.classList.contains("tesuji-has-children") >= 0) {
				// toggle
				elem.classList.toggle("tesuji-open");
				break;
			}
			elem = elem.parentNode;
		}
	})
});

/* COMPONENT dump */

var Component = require("./Component");
var ElementAttributeBinding = require("./attributes/ElementAttributeBinding");
var WithAttribute = require("./attributes/WithAttribute");

var htmlElementBindings = function(elem, stack) {
	var bindings = false, temp, output = "";
	stack = stack || [];
	
	output += htmlElement(elem);
	
	output += '<ul class="tesuji-dump-list">';
	if(elem.tesujiBindingContext && elem.tesujiBindingContext.bindings.length) {
		bindings = true;
		
		for(var i = 0; i < elem.tesujiBindingContext.bindings.length; i++) {
			output += "<li"+(elem.tesujiBindingContext.bindings[i].read ? ' class="tesuji-has-children tesuji-open"' : '')+">";
			output += property("data-"+elem.tesujiBindingContext.bindings[i].name)+": "+elem.tesujiBindingContext.bindings[i].dump(stack);
			output += "</li>";
		}
	}
	
	if(!elem.tesujiBindingContext || elem.tesujiBindingContext.keepTraversing()) {
		output += '<li class="tesuji-has-children tesuji-open">'+property("children")+': '+objectClass("Array")+'<ul class="tesuji-dump-list">';
		for(var i = 0; i < elem.children.length; i++) {
			temp = htmlElementBindings(elem.children[i], stack);
			
			if(temp) {
				bindings = true;
				
				output += '<li class="tesuji-has-children tesuji-open">';
				output += property(i)+": "+temp;
				output += "</li>";
			}
			else {
				output += '<li>';
				output += property(i)+": "+htmlElement(elem.children[i]);
				output += "</li>";
			}
		}
		output += '<li class="tesuji-notown">';
		output += property("length")+": "+formatters["number"](elem.children.length);
		output += "</li>";
		output += '</ul></li>';
	}
	
	output += '</ul>';
	
	return bindings ? output : null;
}

var templateNodes = function(val, stack) {
	var output = "";
	stack = stack || [];
	
	output += objectClass("Array");
	
	// array property list
	output += '<ul class="tesuji-dump-list">';
	
	for(var key in val) {
		if(!val.hasOwnProperty(key)) continue;
		
		if(val[key] instanceof Text) {
			output += '<li>';
			output += property(key)+": "+objectClass("Text");
			output += "</li>";
		}
		else if(val[key] instanceof HTMLElement) {
			var elem = htmlElementBindings(val[key], stack);
			
			if(elem) {
				output += '<li class="tesuji-has-children tesuji-open">';
				output += property(key)+": "+elem;
				output += "</li>";
			}
			else {
				output += '<li>';
				output += property(key)+": "+htmlElement(val[key]);
				output += "</li>";
			}
		}
	}
	output += '<li class="tesuji-notown">';
	output += property("length")+": "+formatters["number"](val.length);
	output += "</li>";
	
	output += "</ul>"
	
	return output;
}

var templateArray = function(val, stack) {
	var output = "";
	stack = stack || [];
	
	output += objectClass("Array");
	
	// array property list
	output += '<ul class="tesuji-dump-list">';
	
	for(var key in val) {
		if(!val.hasOwnProperty(key)) continue;
		
		output += '<li class="tesuji-has-children tesuji-open">';
		output += property(key)+": "+templateNodes(val[key], stack);
		output += "</li>";
	}
	output += '<li class="tesuji-notown">';
	output += property("length")+": "+formatters["number"](val.length);
	output += "</li>";
	
	output += "</ul>"
	
	return output;
}

Component.prototype.dump = function(stack) {
	var output = "";
	stack = stack || [];
	
	if(stack.length == 0) {
		output += '<div class="tesuji-dump">';
	}
	
	stack.push(this);
	
	output += objectClass("Component");
	
	output += '<ul class="tesuji-dump-list">'
	output += '<li class="tesuji-has-children tesuji-open">';
	output += property("model")+": "+array(this.model, stack);
	output += '</li>';
	if(this.parentModel) {
		output += '<li class="tesuji-has-children tesuji-open">';
		output += property("parentModel")+": "+array(this.parentModel, stack);
		output += '</li>';
	}
	else {
		output += '<li>';
		output += property("parentModel")+": "+formatters["boolean"]("null");
		output += '</li>';
	}
	if(this.parentElement) {
		output += '<li>';
		output += property("parentElement")+": "+htmlElement(this.parentElement);
		output += '</li>';
	}
	else {
		output += '<li>';
		output += property("parentElement")+": "+formatters["boolean"]("null");
		output += '</li>';
	}
	output += '<li class="tesuji-has-children tesuji-open">';
	output += property("templateNodes")+": "+templateArray(this.templateNodes, stack);
	output += '</li>';
	output += "</ul>"
	
	stack.pop();
	
	if(stack.length == 0) output += '</div>';
	
	return output;
}

var observerDependency = function(dependency) {
	var depArray = [];
	
	for(var i = 0; i < dependency.length; i++) {
		depArray.push(dependency[i].property);
	}
	
	return "["+depArray.join(", ")+"]";
}

ElementAttributeBinding.prototype.dump = function(stack) {
	var output = "";
	stack = stack || [];
	
	output += formatters["string"](this.value);
	
	if(this.computed_observable) {
		output += '<ul class="tesuji-dump-list">'
		output += '<li>';
		output += property("dependency")+": "+observerDependency(this.computed_observable.dependency);
		output += '</li>';
		output += "<li"+(hasChildren(this.computed_observable.currentValue, stack) ? ' class="tesuji-has-children tesuji-open"' : '')+">";
		output += propertyItem("currentValue", this.computed_observable.currentValue, stack);
		output += '</li>';
		output += "</ul>"
	}
	
	return output;
}

WithAttribute.prototype.dump = function(stack) {
	var output = "";
	stack = stack || [];
	
	output += formatters["string"](this.value);
	
	if(this.computed_observable) {
		output += '<ul class="tesuji-dump-list">'
		output += '<li>';
		output += property("dependency")+": "+observerDependency(this.computed_observable.dependency);
		output += '</li>';
		output += '<li class="tesuji-has-children tesuji-open"';
		output += property("children")+": "+this.context.domElement.tesujiComponent.dump(stack);
		output += '</li>';
		output += "</ul>"
	}
	
	return output;
}