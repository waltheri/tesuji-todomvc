/** data-value handler */

var ElementAttributeBinding = require("./ElementAttributeBinding");

module.exports = ElementAttributeBinding.extend({
	read: function(value) {
		if(value != this.context.domElement.value) {
			this.context.domElement.value = value;
		}
	},
	event: function(callback) {
		this.event_callback = function() {
			callback(this.value);
		};
		this.context.domElement.addEventListener("change", this.event_callback);
	},
	createEventFunction: function(functionBody) {
		return this.createFunction(this.value+" = val;", ["m", "p", "val"], [this.context.model, this.context.parent], this.context.domElement);
	},
	clean: function() {
		this.context.domElement.removeEventListener("change", this.event_callback);
		delete this.event_callback;
		
		ElementAttributeBinding.prototype.clean.call(this);
	}
}, 'value');
