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
