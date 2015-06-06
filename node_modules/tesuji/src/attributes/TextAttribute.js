/** data-text handler */

var ElementAttributeBinding = require("./ElementAttributeBinding");

module.exports = ElementAttributeBinding.extend({
	read: function(value) {
		this.context.domElement.textContent = value;
		this.context.stopTraversing();
	},
}, 'text');
