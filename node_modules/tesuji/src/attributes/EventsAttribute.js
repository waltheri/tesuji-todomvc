/** data-on* handler */
/* callback = event callback */

var ElementAttributeBinding = require("./ElementAttributeBinding");

module.exports = ElementAttributeBinding.extend({
	event: function(callback) {
		var evName = this.name.substring(2);

		this.event_callback = callback;
		this.context.domElement.addEventListener(evName, callback);
	},
	clean: function() {
		var evName = this.name.substring(2);
		
		this.context.domElement.removeEventListener(evName, this.event_callback);
		delete this.event_callback;
	}
}, /on.*/i);