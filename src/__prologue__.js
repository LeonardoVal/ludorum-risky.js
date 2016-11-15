/** Module wrapper and layout.
*/
function __init__(base, Sermat, ludorum) { "use strict";
	/** Imports synonyms */
	var declare = base.declare,
		iterable = base.iterable,
		Iterable = base.Iterable,
		raise = base.raise,
		raiseIf = base.raiseIf,
		initialize = base.initialize,
		Randomness = base.Randomness,
		Game = ludorum.Game,
		Player = ludorum.Player;

	var exports = {
		__package__: 'ludorum-risky',
		__name__: 'ludorum_risky',
		__init__: __init__,
		__dependencies__: [base, Sermat, ludorum],
		__SERMAT__: { include: [base] }
	};
/** See `__epilogue__.js`.
*/