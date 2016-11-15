define(['ludorum-risky', 'ludorum', 'creatartis-base', 'sermat'], function (ludorum_risky, ludorum, base, Sermat) {
	describe("Aleatories", function () { ///////////////////////////////////////////////////////////
		it(" are declared", function () {
			expect(typeof ludorum_risky.ATTACK_ALEATORIES).toBe('object');
			'A1D1 A1D2 A2D1 A2D2 A3D1 A3D2'.split(' ').forEach(function (k) {
				var alea = ludorum_risky.ATTACK_ALEATORIES[k];
				expect(alea).toBeDefined();
				expect(alea instanceof ludorum.aleatories.Aleatory).toBe(true);
				for (var i = 0; i < 10; i++) {
					var randomValue = alea.value();
					expect(typeof randomValue.attack).toBe('number');
					expect(typeof randomValue.defence).toBe('number');
				}
			});
		});
	}); // Aleatories
}); //// define.
