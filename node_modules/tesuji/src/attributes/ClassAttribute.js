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
