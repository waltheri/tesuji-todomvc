/** Events */

var events = {
	
}

var on = function(evName, callback) {
	if(!events[evName]) events[evName] = [];
	events[evName].push(callback);
}

var off = function(evName, callback) {
	if(!events[evName]) return;
	
	if(callback) {
		var index = events[evName].indexOf(callback);
		if (index >= 0) {
			events[evName].splice(index, 1);
		}
	}
	else {
		events.evName = undefined;
	}
}

var trigger = function(evName) {
	if(!events[evName]) return;
	
	for(var i = 0; i < events[evName].length; i++) {
		events[evName][i].apply(null, Array.prototype.slice.call(arguments, 1));
	}
}

module.exports = {
	on: on,
	off: off,
	trigger: trigger
}
