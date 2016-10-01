(function(){
	var game;
	var spritePath = './sprites/';
	var spriteExt = '.png';
	var screenWidth = 480;
	var screenHeight = 320;

	var preloads = [];
	var creates = [];
	var endCreates = [];
	var afterCreates = [];
	var updates = [];
	var renders = [];

	var usesGravity = [];

	function figureOutPath(spriteName){
		if(typeof spriteName !== 'string' && spriteName.length > 0){
			return 'invalid name';
		}

		var hasExtension = spriteName.lastIndexOf('.') > 0;
		var hasSlash = spriteName.indexOf('/') !== -1;
		if(!hasExtension){
			spriteName = spriteName + spriteExt;
		}
		if(!hasSlash){
			spriteName = spritePath + spriteName;
		}
		return spriteName;
	}
	function makePlayerSprite(spriteName, spriteWidth, spriteHeight, optX, optY){
		preloads.push(function(){
			game.load.spritesheet(spriteName, figureOutPath(spriteName), spriteWidth, spriteHeight);
		});
		creates.push(function(){
			var player = game.add.sprite(optX || 0, optY || 0, spriteName);
			player.anchor.setTo(0.5, 0.5);
			game.physics.arcade.enable(player); // enable physics and drag
			player.body.drag = new Phaser.Point(50, 50); 
			player.body.maxVelocity = new Phaser.Point(300, 300);
			player.body.collideWorldBounds = true;
			usesGravity.push(player); // might have gravity set on it later

			afterCreates.push(function(){
				player.x = optX || 0; // not sure why this is needed (why anchor doesn't seem to work right away)
				player.y = optY || 0;
				// also save its initial position
			});
		});
	}
	function addBackgroundSprite(spriteName, optX, optY){
		preloads.push(function(){
			game.load.image(spriteName, figureOutPath(spriteName));
		});
		creates.push(function(){
			var sprite = game.add.sprite(optX || 0, optY || 0, spriteName);
			sprite.anchor.setTo(0.5, 0.5);
		});
	}

	function useArrowKeys(){
		
	}

	function enableGravity(){
		endCreates.push(function(){
			for(var i = 0, len = usesGravity.length; i < len; i++){
				usesGravity[i].body.gravity.y = 100;
				usesGravity[i].body.drag = new Phaser.Point(50, 0); // get rid of vertical drag
			}
		});
	}

	window.player = makePlayerSprite;
	window.background = addBackgroundSprite;
	window.arrowkeys = useArrowKeys;
	window.gravity = enableGravity;

	if(window.level1 && typeof window.level1 === "function"){
		try{
			window.level1();
		} catch(e){
			console.log(e);
		}
	}

	game = new Phaser.Game(screenWidth, screenHeight, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });

	function preload(){
		for(var i = 0, len = preloads.length; i < len; i++){
			preloads[i]();
		}
	}
	function create(){
		game.world.setBounds(-960, -960, 1920, 1920); // set world size, make these params configurable. 0,0 is in the middle
		game.camera.x = 0 - screenWidth / 2;
		game.camera.y = 0 - screenHeight / 2;

		game.physics.startSystem(Phaser.Physics.ARCADE); // always need physics
		
		for(var i = 0, len = creates.length; i < len; i++){
			creates[i]();
		}
		for(i = 0, len = endCreates.length; i < len; i++){
			endCreates[i]();
		}
		window.setTimeout(afterCreate, 0);
	}
	function afterCreate(){
		for(var i = 0, len = afterCreates.length; i < len; i++){
			afterCreates[i]();
		}
	}
	function update(){
		for(var i = 0, len = updates.length; i < len; i++){
			updates[i]();
		}
	}
	function render(){
		for(var i = 0, len = renders.length; i < len; i++){
			renders[i]();
		}
	}
})();