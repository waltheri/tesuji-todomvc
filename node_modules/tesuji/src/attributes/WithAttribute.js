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
