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
