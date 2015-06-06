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
