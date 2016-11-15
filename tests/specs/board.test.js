define(['ludorum-risky', 'ludorum', 'creatartis-base', 'sermat'], function (ludorum_risky, ludorum, base, Sermat) {
	var BoardMap = ludorum_risky.BoardMap;
	
	describe("Maps", function () { /////////////////////////////////////////////////////////////////
		function newBoardMap() {
			var args = Array.prototype.slice.call(arguments);
			return eval("new BoardMap("+ args.map(JSON.stringify).join(",") +")");
		}
		
		it("checks", function () {
			expect(newBoardMap.bind(null)).toThrow(); // No definitions.
			expect(newBoardMap.bind(null, {})).toThrow(); // No territories.
			expect(newBoardMap.bind(null, {T1: []})).toThrow(); // Territory with no frontiers.
			expect(newBoardMap.bind(null, {T1: ["T2"], T2: ["T2"]})).toThrow(); // Territory with a frontier to itself.
			expect(newBoardMap.bind(null, {T1: ["T2"], T2: ["T3"]})).toThrow(); // Territory with an invalid frontier.
			expect(newBoardMap.bind(null, {T1: ["T2"], T2: ["T1"]}, {C1: []})).toThrow(); // Empty continent.
			expect(newBoardMap.bind(null, {T1: ["T2"], T2: ["T1"]}, {C1: ["T1", "T3"]})).toThrow(); // Continent with invalid territory.
			expect(newBoardMap.bind(null, {T1: ["T2"], T2: ["T1"]}, {C1: ["T1", "T2"]}, {C2: 3})).toThrow(); // Bonus for invalid continent.
		});
		
		it("methods", function () {
			var b1 = new BoardMap({
				T1: ["T2"], 
				T2: ["T1","T3"], 
				T3: ["T2"]
			}, {
				C1: ["T1", "T2"]
			}, {
				C1: 3
			});
			expect(b1.territories.join(",")).toBe("T1,T2,T3");
			expect(b1.territoryIndexes.T1).toBe(0);
			expect(b1.territoryIndexes.T2).toBe(1);
			expect(b1.territoryIndexes.T3).toBe(2);
			expect(b1.adjacent("T1","T2")).toBe(true);
			expect(b1.adjacent("T2","T1")).toBe(true);
			expect(b1.adjacent("T1","T3")).toBe(false);
			expect(b1.adjacents.T1.join(",")).toBe("T2");
			expect(b1.adjacents.T2.join(",")).toBe("T1,T3");
			expect(b1.continents.join(",")).toBe("C1");
			expect(b1.continentTerritories.C1.join(",")).toBe("T1,T2");
			expect(b1.bonus("C1")).toBe(3);
		});
	}); // Maps
}); //// define.
