define(['ludorum-risky', 'ludorum', 'creatartis-base', 'sermat'], function (ludorum_risky, ludorum, base, Sermat) {
	var MAPS = ludorum_risky.MAPS;
		Risk = ludorum_risky.Risk;
	
	describe("Game", function () { /////////////////////////////////////////////////////////////////
		var ARMIES1 = { 
				WhiteCountry: ["White", 1],
				YellowCountry: ["Yellow", 2],
				RedCountry: ["Red", 3],
				GreenCountry: ["Green", 4],
				BlueCountry: ["Blue", 5],
				BlackCountry: ["Black", 6]
			},
			ARMIES2 = { 
				WhiteCountry: ["White", 1],
				YellowCountry: ["White", 2],
				RedCountry: ["Red", 3],
				GreenCountry: ["Red", 4],
				BlueCountry: ["Blue", 5],
				BlackCountry: ["Blue", 6]
			};
	
		it("constructor with defaults", function () { //////////////////////////////////////////////
			var game = new Risk({ boardMap: MAPS.test01 });
			expect(game.activePlayer()).toBe(game.players[0]);
			expect(game.boardMap).toBe(MAPS.test01);
			expect(game.round).toBe(0);
			expect(game.rounds).toBe(Infinity);
			expect(Array.isArray(game.stage)).toBe(true);
			expect(game.stage[0]).toBe(game.STAGES.REINFORCE);
			expect(typeof game.armies).toBe('string');
			MAPS.test01.territories.forEach(function (t) {
				expect(game.playerOf(t)).toBe("");
				expect(game.armyCount(t)).toBe(0);
			});
		});
		
		it("constructor with armies", function () { ////////////////////////////////////////////////
			var game = new Risk({ boardMap: MAPS.test01, armies: ARMIES1 });
			expect(game.stage[1]).toBe(3);
			MAPS.test01.territories.forEach(function (t) { // Check if reported players and armyCounts match `armies`.
				expect(game.playerOf(t)).toBe(ARMIES1[t][0]);
				expect(game.armyCount(t)).toBe(ARMIES1[t][1]);
			});
			game.players.forEach(function (p) {
				expect(game.playerContinents(p).length).toBe(0); // No continent is dominated.
			});
		});
		
		it("constructor without armies", function () { ////////////////////////////////////////////////
			var game = new Risk({ boardMap: MAPS.classic });
			
			MAPS.classic.territories.forEach(function (t) { // Check if reported players and armyCounts match `armies`.
				expect(game.playerOf(t)).toBe("");
				expect(game.armyCount(t)).toBe(0);
			});
			
			var armies = Risk.armyAleatoryDistribution(game.players, game.boardMap);
			base.iterable(armies).forEachApply(function (territoryName, t) {
				expect(game.boardMap.territories.indexOf(territoryName)).not.toBeLessThan(0);
				expect(game.players.indexOf(t[0])).not.toBeLessThan(0);
				expect(t[1]).toBeGreaterThan(0);
			});
		});
		
		it("move generation: REINFORCE", function () { /////////////////////////////////////////////
			var game = new Risk({ boardMap: MAPS.test01, armies: ARMIES1 }),
				moves = game.moves(),
				activePlayer = game.activePlayer();
			expect(Object.keys(moves) +'').toBe(activePlayer); // Only the active player shall have moves.
			moves[game.players[0]].forEach(function (m) { // All moves must be reinforcements.
				expect(m[0]).toBe("REINFORCE");
				expect(ARMIES1[m[1]][0]).toBe(activePlayer);
				expect(ARMIES1[m[1]][1]).not.toBeGreaterThan(3);
			});
		});
		
		it("move generation: ATTACK", function () { ////////////////////////////////////////////////
			var stage = [Risk.prototype.STAGES.ATTACK],
				game = new Risk({ boardMap: MAPS.test01, armies: ARMIES1, activePlayer: "Red", stage: stage }),
				moves = game.moves().Red;
			expect(moves.length).toBeGreaterThan(0);
			moves.forEach(function (m) { // All moves must be attacks or pass.
				if (m[0] !== "PASS") {
					expect(m[0]).toBe("ATTACK");
					expect(ARMIES1[m[1]][0]).toBe("Red");
					expect(ARMIES1[m[2]][0]).not.toBe("Red");
					expect(m[3]).not.toBeGreaterThan(2);
				}
			});
		});
		
		it("move generation: FORTIFY", function () { ///////////////////////////////////////////////
			var stage = [Risk.prototype.STAGES.FORTIFY],
				game = new Risk({ boardMap: MAPS.test01, armies: ARMIES2, activePlayer: "Blue", stage: stage }),
				moves = game.moves().Blue;
			expect(moves.length).toBeGreaterThan(0);
			moves.forEach(function (m) { // All moves must be attacks or pass.
				if (m[0] !== "PASS") {
					expect(m[0]).toBe("FORTIFY");
					expect(ARMIES2[m[1]][0]).toBe("Blue");
					expect(ARMIES2[m[2]][0]).toBe("Blue");
					expect(m[3]).toBeLessThan(ARMIES2[m[1]][1]);
				}
			});
		});
		
		it("move generation v2: ATTACK", function () { ////////////////////////////////////////////////
			var stage = [Risk.prototype.STAGES.ATTACK],
				game = new Risk({ boardMap: MAPS.test01, armies: ARMIES1, activePlayer: "Black", stage: stage }),
				moves = game.moves().Black;
			expect(moves.length).toBeGreaterThan(0);
			moves.forEach(function (m) { // All moves must be attacks or pass.
				if (m[0] !== "PASS") {
					expect(m[0]).toBe("ATTACK");
					expect(ARMIES1[m[1]][0]).toBe("Black");
					expect(ARMIES1[m[2]][0]).not.toBe("Black");
					expect(m[3]).not.toBeGreaterThan(3);
				}
			});
		});

		it("move application: REINFORCE", function () { ////////////////////////////////////////////////
			var stage = [Risk.prototype.STAGES.REINFORCE],
				game = new Risk({ boardMap: MAPS.test01, armies: ARMIES1, stage: stage });
			game.players.forEach(function (p){
				expect(game.playerReinforcements(p)).toBeGreaterThan(0); 
				game.activePlayers = [p];
				delete game.__moves__; // Invalidate moves cache.
				moves = game.moves();
				expect(moves.hasOwnProperty(p)).toBe(true);
				moves[p].forEach(function (m) { // All moves must be reinforce.
					if (m[0] !== "PASS") {
						expect(m[0]).toBe("REINFORCE");
						var count1 = game.armyCount(m[1]),
							count2 = game.stage[1],
							game1 = game.next({p: m});
						expect(m[2]).toBeGreaterThan(0);
						expect(m[2]).not.toBeGreaterThan(count2);
						expect(game.armyCount(m[1])).toBe(count1);
						expect(game1.playerOf(m[1])).toBe(p);
						expect(game1.stage[1]).toBe(count2 - m[2]);
						expect(game1.armyCount(m[1])).toBe(count1 + m[2]);
						
						if (count2 - m[2] === 0) {
							expect(game1.stage[0]).toBe(Risk.prototype.STAGES.ATTACK);
						}
					}
				});
			});
		});
		
		it("move application: ATTACK", function () { ////////////////////////////////////////////////
			var stage = [Risk.prototype.STAGES.ATTACK],
				//haps = {rolls : {attack : 1, defence : 1}},
				game = new Risk({ boardMap: MAPS.test01, armies: ARMIES1, activePlayer: "Black", stage: stage });
			moves = game.moves().Black;
			moves.forEach(function (m) { // All moves must be attacks or pass.
				if (m[0] !== "PASS") {
					var contingent = game.next({Black: m});
					expect(contingent instanceof ludorum.Contingent).toBe(true);
					var haps = contingent.randomHaps();
					expect(haps.hasOwnProperty("rolls")).toBe(true);
					expect(haps.rolls.attack).not.toBeNaN();
					expect(haps.rolls.defence).not.toBeNaN();
					expect(haps.rolls.defence + haps.rolls.attack).not.toBeGreaterThan(2);
					var count1 = game.armyCount(m[1]),
						count2 = game.armyCount(m[2]),
						game1 = game.next({Black: m}, haps);
					expect(game.armyCount(m[1])).toBe(count1);
					expect(game.armyCount(m[2])).toBe(count2);
					expect(m[0]).toBe("ATTACK");
					expect(game1.playerOf(m[1])).toBe("Black");
					expect(game1.playerOf(m[2])).not.toBe("Black");
					expect(game1.armyCount(m[1])).toBe(game.armyCount(m[1]) + haps.rolls.attack,
						"Attack at "+ m[1] +" ("+ game.armyCount(m[1]) +") lost "+ (-haps.rolls.attack));
					expect(game1.armyCount(m[2])).toBe(game.armyCount(m[2]) + haps.rolls.defence,
						"Defence at "+ m[2] +" ("+ game.armyCount(m[2]) +") lost "+ (-haps.rolls.defence));
					if (game1.armyCount(m[2]) < 1) {
						expect(game1.stage[0]).toBe(Risk.prototype.STAGES.OCCUPY);
					}
				}
			});
		});
		
	
		it("move application: OCCUPY", function () { ////////////////////////////////////////////////
			var stage = [Risk.prototype.STAGES.ATTACK],
				game = new Risk({ boardMap: MAPS.test01, armies: ARMIES1, activePlayer: "Black", stage: stage });
			moves = game.moves();
			expect(moves.hasOwnProperty('Black')).toBe(true);
			moves.Black.forEach(function (m) { // All moves must be attack or pass.
				if (m[0] !== "PASS") {
					var contingent = game.next({Black: m});
					expect(contingent instanceof ludorum.Contingent).toBe(true);
					var haps = contingent.randomHaps();
					var game1 = game.next({"Black": m}, haps);
					
					if (game1.armyCount(m[2]) < 1) {
						
						expect(game1.stage[0]).toBe(Risk.prototype.STAGES.OCCUPY);
					
						moves1 = game1.moves().Black;
						moves1.forEach(function (m1){ // All moves must be occupy.
							var territory1 = game1.stage[1],
								territory2 = game1.stage[2],
								count1 = game1.armyCount(game1.stage[1]),
								count2 = game1.armyCount(game1.stage[2]);
							expect(m1[0]).toBe("OCCUPY");
							expect(count1).toBeGreaterThan(m1[1]);
							expect(count2).toBe(0);
												
							var game2 = game1.next({"Black": m1}); 
							expect(game2.stage[0]).toBe(Risk.prototype.STAGES.ATTACK);
							expect(game2.armyCount(territory1)).toBeGreaterThan(0);
							expect(game2.armyCount(territory1)).toBe(count1 - m1[1]);
							expect(game2.armyCount(territory2)).toBe(m1[1]);
							expect(game2.playerOf(territory2)).toBe("Black");
							
						});
					}
				}
			});
			
		});
		
		it("move application: FORTIFY", function () { ////////////////////////////////////////////////
			var stage = [Risk.prototype.STAGES.FORTIFY],
			game = new Risk({ boardMap: MAPS.test01, armies: ARMIES1, activePlayer: "Black", stage: stage });
			moves = game.moves().Black;
			moves.forEach(function (m) { // All moves must be fortify.
				if (m[0] !== "PASS") {
					expect(m[0]).toBe("FORTIFY");
					
					var count1 = game.armyCount(m[1]),
						count2 = game.armyCount(m[2]),
						game1 = game.next({"Black": m});
						
					expect(game.playerOf(m[1])).toBe("Black");
					expect(game.playerOf(m[2])).toBe("Black");
					expect(count1 - m[3]).toBeGreaterThan(0);
									
					expect(game1.stage[0]).toBe(Risk.prototype.STAGES.REINFORCE);
					expect(game1.armyCount(m[1])).toBe(count1 - m[3]);
					expect(game1.armyCount(m[2])).toBe(count2 + m[3]);
				}
			});
		});
		
		it("move application: PASS", function () { ////////////////////////////////////////////////
			var stage = [Risk.prototype.STAGES.ATTACK],
			game = new Risk({ boardMap: MAPS.test01, armies: ARMIES1, activePlayer: "Black", stage: stage });
						
			moves = game.moves().Black;
			moves.forEach(function (m) { // All moves must be fortify.
				if (m[0] === "PASS") {
					expect(m[0]).toBe("PASS");
					
					var count = game.round,
						game1 = game.next({"Black": m});
					
					expect(game1.activePlayer()).toBe("Black");
					expect(game1.round).toBe(count);
					expect(game1.stage[0]).toBe(Risk.prototype.STAGES.FORTIFY);
						
				}
			});			
			
			game.stage = [Risk.prototype.STAGES.FORTIFY];
			moves = game.moves().Black;
			moves.forEach(function (m) { // All moves must be fortify.
				if (m[0] === "PASS") {
					expect(m[0]).toBe("PASS");
					
					var count = game.round,
						game1 = game.next({"Black": m});
					expect(game1.activePlayer()).toBe("White");
					expect(game1.round).toBe(count + 1);
					expect(game1.stage[0]).toBe(Risk.prototype.STAGES.REINFORCE);
				}
			});
		});
		
		
	}); // Game
}); //// define.
