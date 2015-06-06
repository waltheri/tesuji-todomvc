/** Variables with reuired type */

var ConditionVariable = function(initialValue) {
	this.initialValue = initialValue;
}

/**
 * Condition function must return true for valid value, or throw exception for invalid value.
 *
 * @param key - optional variable name
 */
 
ConditionVariable.prototype.test = function(value, key) {
	// abstract
	throw new ReferenceError("Method 'test' hasn't been implemented.");
}

module.exports = ConditionVariable;
