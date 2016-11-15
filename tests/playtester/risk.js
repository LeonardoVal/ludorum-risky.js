var Risk = {

	/**
	 * Settings Object, holding application wide settings
	 */
	Settings :{
		globalScale: 0.55,
		colors: {Yellow: '#ff0', Green: '#0f0', Blue: '#00f', Red: '#f00', White: '#fff', Black: '#000'},
	},

	/**
	 * Our main Territories object
	 * It looks like:
	 * Territories: {
	 *     Alaska: {path: Object, color: String, name: 'Alaska', ...},
	 *	   ... 
	 *	}
	 */
	Territories: {},
	
	game: null,
	stage: null,
	mapLayer: null,
	topLayer:  null,
	backgroundLayer: null,

	init: function(game) {
		Risk.game = game;
		
		//Initiate our main Territories Object, it contains essential data about the territories current state
		Risk.setUpTerritoriesObj(game);
		
		//Initiate a Kinetic stage
		Risk.stage = new Kinetic.Stage({
			container: 'map',
			width: 1920 * Risk.Settings.globalScale,
			height: 1080 * Risk.Settings.globalScale
		});

		Risk.mapLayer = new Kinetic.Layer({
			scale: Risk.Settings.globalScale
		});

		Risk.topLayer = new Kinetic.Layer({
			scale: Risk.Settings.globalScale
		});
		
		Risk.drawBackgroundImg();
		Risk.drawTerritories();

		Risk.stage.add(Risk.backgroundLayer);
		Risk.stage.add(Risk.mapLayer);
		Risk.stage.add(Risk.topLayer);

		Risk.mapLayer.draw();

		Risk.divideTerritories(game);
	},

	/**
	 * Initiate the  Risk.Territories Object, this will contain essential informations about the territories 
	 */
	setUpTerritoriesObj: function(game) {
		var armies = game.uncompressGameState(game.armies);
	
		for(id in TerritoryNames) {
			var pathObject = new Kinetic.Path({
				data: TerritoryPathData[id].path,
				id: id //set a unique id --> path.attrs.id
			});

			//Using a sprite image for territory names
			//see: drawImage() -- https://developer.mozilla.org/en-US/docs/Canvas_tutorial/Using_images , and see Kinetic.Image() docs for more
			var sprite = new Image();
			sprite.src = 'img/names.png';
			var territoryNameImg = new Kinetic.Image({
				image: sprite,
				x: FontDestinationCoords[id].x,
				y: FontDestinationCoords[id].y,
				width: FontSpriteCoords[id].sWidth, //'destiantion Width' 
				height: FontSpriteCoords[id].sHeight, //'destination Height'
				crop: [FontSpriteCoords[id].sx, FontSpriteCoords[id].sy, FontSpriteCoords[id].sWidth, FontSpriteCoords[id].sHeight]

			});
			
			var simpleText = new Kinetic.Text({
				x: ArmyPoints[id].x,
				y: ArmyPoints[id].y,
				text: "?",
				fontSize: 25,
				fontFamily: 'Arial',
				textFill: 'white',
				stroke: 'black',
				fill: 'black'	 
				});
		
			Risk.Territories[id] = {
				name: TerritoryNames[id],
				path: pathObject,
				nameImg: territoryNameImg,
				color: null,
				textArmy: simpleText,
				neighbours: Neighbours[id],
				armyNum: null
			};
		}
		
	},

	drawBackgroundImg: function() {
		Risk.backgroundLayer = new Kinetic.Layer({
			scale: Risk.Settings.globalScale
		});
		var imgObj = new Image();
		imgObj.src = 'img/map_grey.jpg';
		
		var img = new Kinetic.Image({
			image: imgObj,
			//alpha: 0.8
		});
		img.on('click', function (evt) {
			if (typeof Risk.onBackgroundClick === 'function') {
				Risk.onBackgroundClick(evt);
				return false;
			}
		});
		Risk.backgroundLayer.add(img);
	},

	drawTerritories: function() {
		for (t in Risk.Territories) {
			
			var path = Risk.Territories[t].path;
			var nameImg = Risk.Territories[t].nameImg;
			var textArmy = Risk.Territories[t].textArmy;
			var group = new Kinetic.Group();

			//We have to set up a group for proper mouseover on territories and sprite name images 
			group.add(path);
			group.add(nameImg);
			group.add(textArmy);
			Risk.mapLayer.add(group);
		
			//Basic animations 
			//Wrap the 'path', 't' and 'group' variables inside a closure, and set up the mouseover / mouseout events for the demo
			//when you make a bigger application you should move this functionality out from here, and maybe put these 'actions' in a seperate function/'class'
			(function(path, t, group) {
				/*group.on('mouseover', function() {
					path.setFill('#eee');
					path.setOpacity(0.3);
					group.moveTo(Risk.topLayer);
					Risk.topLayer.drawScene();
				});

				group.on('mouseout', function() {
					path.setFill(Risk.Settings.colors[Risk.Territories[t].color]);
					path.setOpacity(0.4);
					group.moveTo(Risk.mapLayer);
					Risk.topLayer.draw();
				});*/

				group.on('click', function(evt) {
					if (typeof Risk.onTerritoryClick === 'function') {
						Risk.onTerritoryClick(path, evt);
					}
				});
			})(path, t, group);
		}				
	},

 	divideTerritories: function(game) {
		var armies = game.uncompressGameState(game.armies);
		
		for(var id in Risk.Territories) {
			var color = armies[Risk.Territories[id].name][0];
			
			if (Risk.Territories[id].color != color) { 
				Risk.Territories[id].color = color;
				Risk.Territories[id].path.setFill(Risk.Settings.colors[color]);
				Risk.Territories[id].path.setOpacity(0.4);
			}
			Risk.Territories[id].textArmy.setText(armies[TerritoryNames[id]][1] +"");
		}
		Risk.mapLayer.draw();
		
		switch (game.stage[0]) {
			case game.STAGES.REINFORCE:		
				window.APP.gameStage.innerHTML = base.Text.escapeXML("REINFORCE (" + game.stage[1] + " armies to place)"); 
				window.APP.gameRound.innerHTML = base.Text.escapeXML(game.round + 1); 
				window.APP.gamePlayer.innerHTML = base.Text.escapeXML(game.activePlayer());
				window.APP.round = game.round + 1;
				break;
			case game.STAGES.ATTACK:	window.APP.gameStage.innerHTML = base.Text.escapeXML("ATTACK"); break;
			case game.STAGES.OCCUPY:	window.APP.gameStage.innerHTML = base.Text.escapeXML("OCCUPY"); break;
			case game.STAGES.FORTIFY:   window.APP.gameStage.innerHTML = base.Text.escapeXML("FORTIFY"); break;
		}
	},
	
	onTerritoryClick: function (path, evt) {
		console.log(path.attrs.id);		
	}
};