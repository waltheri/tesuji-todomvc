/** data-text handler */

var ElementAttributeBinding = require("./ElementAttributeBinding");

module.exports = ElementAttributeBinding.extend({
	read: function(value) {
		this.context.domElement.innerHTML = value;
		this.context.stopTraversing();
	},
}, 'html');