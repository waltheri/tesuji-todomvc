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
