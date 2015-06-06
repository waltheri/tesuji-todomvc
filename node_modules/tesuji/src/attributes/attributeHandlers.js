/** Data handlers */

var attributeHandlers = [
	require("./TextAttribute"),
	require("./HtmlAttribute"),
	require("./StyleAttribute"),
	require("./ClassAttribute"),
	require("./WithAttribute"),
	require("./ComponentAttribute"),
	require("./ValueAttribute"),
	require("./CheckedAttribute"),
	require("./EventsAttribute"),
	require("./IfAttribute"),
];

module.exports = attributeHandlers;
