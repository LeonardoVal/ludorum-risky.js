(function (global, init) { "use strict";
	if (typeof define === 'function' && define.amd) {
		define(['creatartis-base', 'ludorum'], init); // AMD module.
	} else if (typeof exports === 'object' && module.exports) {
		module.exports = init(require('creatartis-base'), require('ludorum')); // CommonJS module.
	} else {
		global.ludorum_risky = init(global, global.base, global.ludorum); // Browser.
	}
})(this,/** Module wrapper and layout.
*/
function __init__(base, ludorum) { "use strict";
	var exports = {};
	
/** See `__epilogue__.js`.
*/

/** See __prologue__.js
*/
	return exports;
});
//# sourceMappingURL=ludorum-risky-umd.js.map