/** # Probabilities

Risk-like games are use dice to resolve conflicts, and hence are non-deterministic games. Using the
dice probabilities is important for making good automatic players.
*/

// ## Attacks ######################################################################################

/** The `attackProbabilities` function calculates the chances of success and failure of all
possible attacks, given an attack army count and a defense army count.

Warning! At counts higher than 3 it can get really slow.
*/
exports.attackProbabilities = function attackProbabilities(attackCount, defenseCount) {
	var result = {},
		compFun = function (x,y) { return y-x;};
	Iterable.product.apply(Iterable, Iterable.repeat([1,2,3,4,5,6], attackCount + defenseCount).toArray())
		.forEach(function (dice) {
			var attackDice = dice.slice(0, attackCount).sort(compFun),
				defenseDice = dice.slice(attackCount).sort(compFun),
				attackWins = 0,
				defenseWins = 0,
				key;
			base.iterable(attackDice).zip(defenseDice).forEachApply(function (attackDie, defenseDie) {
				if (attackDie > defenseDie) {
					attackWins++;
				} else {
					defenseWins++;
				}
			});
			key = 'A'+ attackWins +'D'+ defenseWins;
			result[key] = (result[key] |0) + 1;
		});
	var totalCount = Math.pow(6, attackCount + defenseCount);
	for (var k in result) {
		result[k] = result[k] / totalCount;
	}
	return result;
};

/** The `ATTACK_PROBABILITIES` for the common scenarios have been pre-calculated. The keys are
defined like `/A\d+D\d+/` where each number is the amount of losses, for attacker and
defender.
*/
var ATTACK_PROBABILITIES = exports.ATTACK_PROBABILITIES = {
	A1D1: { A1D0: 0.5833333333333334, A0D1: 0.4166666666666667},
	A1D2: { A1D0: 0.7453703703703703, A0D1: 0.25462962962962965},
	A2D1: { A1D0: 0.4212962962962963, A0D1: 0.5787037037037037},
	A2D2: { A1D1: 0.32407407407407407, A2D0: 0.44830246913580246, A0D2: 0.22762345679012347},
	A3D1: { A1D0: 0.3402777777777778, A0D1: 0.6597222222222222},
	A3D2: { A1D1: 0.3357767489711934, A2D0: 0.2925668724279835, A0D2: 0.37165637860082307}
};

/** The aleatory variable used with Risk-like games does not consider all posible dice rolls. Most
dice rolls can be grouped in at 2 or 3 different results. Hence, only the results and their
probabilities are considered.
*/
var AttackAleatory = declare(ludorum.aleatories.Aleatory, {
	constructor: function UniformAleatory(distribution) {
		raiseIf(distribution.length < 1, "Aleatory cannot have an empty distribution!");
		this.__distribution__ = iterable(distribution);
	},

	distribution: function distribution() {
		return this.__distribution__;
	},

	value: function value(random) {
		return (random || Randomness.DEFAULT).weightedChoice(this.__distribution__);
	},

	'static __SERMAT__': {
		identifier: 'AttackAleatory',
		serializer: function serialize_UniformAleatory(obj) {
			return [obj.__distribution__.toArray()];
		}
	}
});

/** `ATTACK_ALEATORIES` is just the `Aleatory` representation of the `ATTACK_PROBABILITIES`.
*/
var ATTACK_ALEATORIES = exports.ATTACK_ALEATORIES = iterable(ATTACK_PROBABILITIES)
	.mapApply(function (amounts, results) {
		var distribution = iterable(results).mapApply(function (result, prob) {
			var value = {
				attack: -(result.charAt(1) |0),
				defence: -(result.charAt(3) |0)
			};
			return [value, prob];
		});
		return [amounts, new AttackAleatory(distribution)];
	}).toObject();

// ## Conquests ####################################################################################

/** The conquest probability is the chance of a certain number of attackers to defeat a certain
number of defenders. It is different from the attack probability, since a conquest may usually
involve many attacks.

The calculations assume that both players use as many armies as they can, and that the attacks
continue until all armies of either player get destroyed.
*/
var conquestProbability = exports.conquestProbability = function conquestProbability(attackCount,
		defenseCount, cache, attackProbs) {
	cache = cache || CONQUEST_PROBABILITIES;
	attackProbs = attackProbs || ATTACK_PROBABILITIES;
	if (attackCount < 1) {
		return 0;
	} else if (defenseCount < 1) {
		return 1;
	}
	var key = 'A'+ attackCount +'D'+ defenseCount,
		result = cache[key];
	if (!isNaN(result)) { // Hit cache.
		return result;
	} else {
		result = 1;
		if (defenseCount === 1) {
			if (attackCount === 1) {
				result = attackProbs.A1D1.A1D0;
			} else if (attackCount === 2) {
				result = attackProbs.A2D1.A1D0 +
					attackProbs.A2D1.A0D1 * conquestProbability(attackCount - 1, defenseCount, cache, attackProbs);
			} else if (attackCount >= 3) {
				result = attackProbs.A3D1.A1D0 +
					attackProbs.A3D1.A0D1 * conquestProbability(attackCount - 1, defenseCount, cache, attackProbs);
			}
		}
		if (defenseCount === 2){
			if (attackCount === 1) {
				result = attackProbs.A1D2.A1D0 * conquestProbability(attackCount, defenseCount - 1, cache, attackProbs);
			} else if (attackCount === 2) {
				result = attackProbs.A2D2.A2D0 +
					attackProbs.A2D2.A1D1 * conquestProbability(attackCount - 1, defenseCount - 1, cache, attackProbs);
			}
		}
		if (defenseCount >= 3){
			if (attackCount === 1) {
				result = attackProbs.A1D2.A1D0 * conquestProbability(attackCount, defenseCount - 1, cache, attackProbs);
			} else if (attackCount === 2) {
				result = attackProbs.A2D2.A2D0 * conquestProbability(attackCount, defenseCount - 2, cache, attackProbs) +
					attackProbs.A2D2.A1D1 * conquestProbability(attackCount - 1, defenseCount - 1, cache, attackProbs);
			}
		}
		if (attackCount >= 3 && defenseCount >= 2) {
			result = attackProbs.A3D2.A2D0 * conquestProbability(attackCount, defenseCount - 2, cache, attackProbs) +
				attackProbs.A3D2.A0D2 * conquestProbability(attackCount - 2, defenseCount, cache, attackProbs) +
				attackProbs.A3D2.A1D1 * conquestProbability(attackCount - 1, defenseCount - 1, cache, attackProbs);
		}
		cache[key] = result;
		return result;
	}
};

/** The `CONQUEST_PROBABILITIES` for the common scenarios have also been pre-calculated.
*/
var CONQUEST_PROBABILITIES = exports.CONQUEST_PROBABILITIES = (function () {
	var result = {};
	conquestProbability(30, 30, result, ATTACK_PROBABILITIES);
	return result;
})();
