// TODO: enemy walk back and forth
// TODO: enemy fly and follow player
// TODO: add more comments
// TODO: write documentation
(function(){
	'use strict';
	var game;
	var spritePath = './sprites/';
	var spriteExt = '.png';
	var screenWidth = 480;
	var screenHeight = 320;

	function Level(){
		this.preloads = [];
		this.earlyCreates = [];
		this.creates = [];
		this.endCreates = [];
		this.firstUpdates = [];
		this.updates = [];
		this.userUpdates = [];
		this.renders = [];
		this.usesGravity = [];
		this.preloadedSpriteNames = {};
		this.preloadedTilemapNames = {};
	}
	var currentLevel;
	var levels = [];


	var controlSystem = {
		inputs: {up: {isDown: null}, down: {isDown: null}, left: {isDown: null}, right: {isDown: null}}, // dummy initial values
		player: null,
		platformGroup: null, // for checking collisions
		mapLayer: null,
		flyingEnabled: false, 
		jumpingEnabled: false,
		xAccel: 0,
		yAccel: 0,

		reset: function(){
			this.inputs = {up: {isDown: null}, down: {isDown: null}, left: {isDown: null}, right: {isDown: null}};
			this.player = null;
			this.platformGroup = null;
			this.mapLayer = null;
			this.flyingEnabled = false;
			this.jumpingEnabled = false;
			this.xAccel = 0;
			this.yAccel = 0;
		},

		listenToArrowKeys: function(){
			this.inputs.up = game.input.keyboard.addKey(Phaser.Keyboard.UP);
			this.inputs.down = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
			this.inputs.left = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
			this.inputs.right = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
		},

		setSpeeds: function(){
			// based on whether moving, flying, or sidescrolling, set the correct accelerations
			var body = this.player.body;
			if(this.jumpingEnabled){ // side scroller feel, very quick
				body.gravity.y = 300;
				body.drag = new Phaser.Point(300, 0);
				currentLevel.firstUpdates.push(function(){body.maxVelocity = new Phaser.Point(200, 300);});
				this.xAccel = 30;
				this.yAccel = 250;
			} else if(this.flyingEnabled){ // slower, gravity based
				body.gravity.y = 100;
				body.drag = new Phaser.Point(50, 0);
				currentLevel.firstUpdates.push(function(){body.maxVelocity = new Phaser.Point(250, 250);});
				this.xAccel = 4;
				this.yAccel = 7;
			} else{ // can move in all directions
				body.drag = new Phaser.Point(500, 500);
				currentLevel.firstUpdates.push(function(){body.maxVelocity = new Phaser.Point(100, 100);});
				this.xAccel = 50;
				this.yAccel = 50;
			}
		},

		update: function(){

			if(this.platformGroup){
				game.physics.arcade.collide(this.player, this.platformGroup);
			}

			if(this.mapLayer){
				game.physics.arcade.collide(this.player, this.mapLayer);
			}

			var inputs = this.inputs;
			var playerVel = this.player.body.velocity;

			if(inputs.left.isDown){
				playerVel.x -= this.xAccel;
			}
			if(inputs.right.isDown){
				playerVel.x += this.xAccel;
			}

			if(this.jumpingEnabled){
				if(inputs.up.isDown && (this.player.body.onFloor() || this.player.body.touching.down)){
					playerVel.y -= this.yAccel;
				}
			} else if(this.flyingEnabled){
				if(inputs.up.isDown){
					playerVel.y -= this.yAccel;
				}
			} else{ // no jumping and no flying means up and down work like normal
				if(inputs.up.isDown){
					playerVel.y -= this.yAccel;
				}
				if(inputs.down.isDown){
					playerVel.y += this.yAccel;
				}
			}
		}
	};

	var cameraSystem = {
		player: null, // sprite to follow with the camera
		modifyX: 0,
		modifyY: 0,
		playerInitX: 0,
		playerInitY: 0,
		cam: null,
		initX: 0,
		initY: 0,
		bufferX: [],
		bufferY: [],
		bufferSize: 30,
		bufferPosition: 0,

		reset: function(){
			this.player = null;
			this.modifyX = 0;
			this.modifyY = 0;
			this.playerInitX = 0;
			this.playerInitY = 0;
			this.cam = null;
			this.initX = 0;
			this.initY = 0;
			this.bufferX = [];
			this.bufferY = [];
			this.bufferSize = 30;
			this.bufferPosition = 0;
		},

		normalFollow: function(){
			game.camera.follow(this.player);
		},
		setupSmoothFollow: function(){
			currentLevel.endCreates.push(function(){
				cameraSystem.cam = game.camera;
			});
			currentLevel.firstUpdates.push(function(){
				cameraSystem.initializeBuffers();
			});
			currentLevel.updates.push(function(){
				cameraSystem.update();
			});
		},
		initializeBuffers: function(){
			this.cam.x = this.player.x + 32 - screenWidth / 2; // TODO: remove the hardcoded 32
			this.cam.y = this.player.y + 32 - screenHeight / 2;
			this.initX = this.cam.x;
			this.initY = this.cam.y;
			for(var i = 0; i < this.bufferSize; i++){
				this.bufferX.push(this.initX);
				this.bufferY.push(this.initY);
			}
			this.modifyX = screenWidth / 2;
			this.modifyY = screenHeight / 2;
			this.playerInitX = this.player.x;
			this.playerInitY = this.player.y;
		},
		update: function(){
			var buffX = this.bufferX;
			var buffY = this.bufferY;
			var len = this.bufferSize;
			buffX[this.bufferPosition] = this.player.x - this.modifyX;
			buffY[this.bufferPosition] = this.player.y - this.modifyY;

			this.bufferPosition++;
			if(this.bufferPosition === len){
				this.bufferPosition = 0;
			}

			// calculate averages 
			var totalX = 0;
			var totalY = 0;
			for(var i = 0; i < len; i++){
				totalX += buffX[i];
				totalY += buffY[i];
			}
			this.cam.x = totalX / len;
			this.cam.y = totalY / len;
		},
	};

	var spawnSystem = {
		// basically just specifies where the player is going start.
		startX: 0,
		startY: 0,
		forSure: false, // location set from start function has priority over player function
		player: null,
		reset: function(){
			this.startX = 0;
			this.startY = 0;
			this.forSure = false;
			this.player = null;
		},
		movePlayer: function(){
			if(this.player){
				this.player.x = this.startX;
				this.player.y = this.startY;
			}
		}
	};

	var overlapSystem = {
		// allows for callbacks that check for the player touching something else
		player: null,
		overlaps: [],
		initialized: false,

		reset: function(){
			this.player = null;
			this.overlaps = [];
			this.initialized = false;
		},
		initialize: function(){
			if(!this.initialized){
				currentLevel.updates.push(function(){
					overlapSystem.update();
				});
				this.initialized = true;
			}
		},
		update: function(){
			for(var i = 0, len = this.overlaps.length; i < len; i++){
				this.overlaps[i](this.player);
			}
		}
	};

	var helpers = {
		figureOutPath: function(spriteName, optExtension){
			return this.addDefaultPath(this.addExtension(spriteName, optExtension));
		},

		addExtension: function(spriteName, optExtension){
			optExtension = optExtension || spriteExt;

			var hasExtension = spriteName.lastIndexOf('.') > 0;
			if(!hasExtension){
				spriteName = spriteName + optExtension;
			}

			return spriteName;
		},

		addDefaultPath: function(spriteName){
			var hasSlash = spriteName.indexOf('/') !== -1;
			if(!hasSlash){
				spriteName = spritePath + spriteName;
			}
			return spriteName;
		},

		isString: function(str){
			if(typeof str === 'string' && str.length > 0){
				return true;
			}
			return false; // TODO: Display some sort of useful error
		},

		resetEverything: function(){
			controlSystem.reset();
			cameraSystem.reset();
			spawnSystem.reset();
			overlapSystem.reset();
			isFirstFrame = true;
		},

		ezHash: function(str){ // http://stackoverflow.com/a/7616484/3768518
			var hash = 0, i, chr, len;
			if (str.length === 0) return '0';
			for (i = 0, len = str.length; i < len; i++) {
				chr   = str.charCodeAt(i);
				hash  = ((hash << 5) - hash) + chr;
				hash |= 0; // Convert to 32bit integer
			}
			return hash.toString();
		}
	};
	
	function makePlayerSprite(spriteName, spriteWidth, spriteHeight, optX, optY){
		if(!helpers.isString(spriteName)){return {};}
		var more = {
			player: null,
			enableJumping: function(){
				currentLevel.earlyCreates.push(function(){
					controlSystem.jumpingEnabled = true;
				});
				return more;
			},
			enableFlying: function(){ 
				currentLevel.earlyCreates.push(function(){
					controlSystem.flyingEnabled = true;
				});
				return more;
			},
			add: function(spriteName, optX, optY){
				currentLevel.preloads.push(function(){
					if(!currentLevel.preloadedSpriteNames[spriteName]){
						game.load.image(spriteName, helpers.figureOutPath(spriteName));
						currentLevel.preloadedSpriteNames[spriteName] = true;
					}
				});
				currentLevel.endCreates.push(function(){
					var sprite = game.make.sprite(optX || 0, optY || 0, spriteName);
					sprite.anchor.setTo(0.5, 0.5);
					more.player.addChild(sprite);
				});
				return more;
			}
		};

		currentLevel.preloads.push(function(){
			if(!currentLevel.preloadedSpriteNames[spriteName]){
				game.load.spritesheet(spriteName, helpers.figureOutPath(spriteName), spriteWidth, spriteHeight);
				currentLevel.preloadedSpriteNames[spriteName] = true;
			}
		});
		currentLevel.creates.push(function(){
			var player = game.add.sprite(optX || 0, optY || 0, spriteName);
			player.anchor.setTo(0.5, 0.5);
			game.physics.arcade.enable(player); // enable physics and drag
			player.body.collideWorldBounds = true;
			
			if(!spawnSystem.forSure){
				spawnSystem.startX = optX || 0;
				spawnSystem.startY = optY || 0;
			}

			spawnSystem.player = player;
			controlSystem.player = player;
			cameraSystem.player = player;
			overlapSystem.player = player;
			more.player = player;
		});

		return more;
	}

	function addBackground(spriteName, optX, optY){
		if(!helpers.isString(spriteName)){return {};}
		if(spriteName[0] === '#' && (spriteName.length === 4 || spriteName.length === 7)){
			return setBackgroundColor(spriteName);
		} else{
			return addBackgroundSprite(spriteName, optX, optY);
		}
	}
	function setBackgroundColor(colorValue){
		currentLevel.creates.push(function(){
			game.stage.backgroundColor = colorValue;
		});
		return {};
	}
	function addBackgroundSprite(spriteName, optX, optY){
		var more = {
			sprite: null,
			initX: 0,
			initY: 0,
			initCamX: 0,
			initCamY: 0,
			depth: function(ammount){
				// Parallax effect
				currentLevel.endCreates.push(function(){
					// got to get the initial camera position. Probably 0,0 but just to be sure
					more.initCamX = game.camera.x;
					more.initCamY = game.camera.y;
				});
				currentLevel.updates.push(function(){
			        more.sprite.x = (game.camera.x - more.initCamX) / ammount + more.initX;
			        more.sprite.y = (game.camera.y - more.initCamY) / ammount + more.initY;
				});
				return more;
			}
		};

		currentLevel.preloads.push(function(){
			if(!currentLevel.preloadedSpriteNames[spriteName]){
				game.load.image(spriteName, helpers.figureOutPath(spriteName));
				currentLevel.preloadedSpriteNames[spriteName] = true;
			}
		});
		currentLevel.earlyCreates.push(function(){
			var sprite = game.add.sprite(optX || 0, optY || 0, spriteName);
			sprite.anchor.setTo(0.5, 0.5);
			more.sprite = sprite;
			more.initX = sprite.x;
			more.initY = sprite.y;
		});

		return more;
	}

	function addPlatformSprite(spriteName, spriteWidth, spriteHeight, optX, optY){
		if(!helpers.isString(spriteName)){return {};}
		var more = {
			sprite: null,
			animation: function(optFramesPerSecond, optIsLoop, optAnimationName){
				optFramesPerSecond = optFramesPerSecond ? optFramesPerSecond : 15;
				optIsLoop = optIsLoop === undefined ? true : !!optIsLoop; // isn't javascript great?...
				optAnimationName = optAnimationName ? optAnimationName : 'anim1';
				currentLevel.endCreates.push(function(){
					more.sprite.animations.add(optAnimationName);
					more.sprite.animations.play(optAnimationName, optFramesPerSecond, optIsLoop);
				});
				return more;
			}
			// TODO: Add the ability to have multiple animations and to switch between them
		};

		currentLevel.preloads.push(function(){
			if(!currentLevel.preloadedSpriteNames[spriteName]){
				game.load.spritesheet(spriteName, helpers.figureOutPath(spriteName), spriteWidth, spriteHeight);
				currentLevel.preloadedSpriteNames[spriteName] = true;
			}
		});
		currentLevel.creates.push(function(){
			if(!controlSystem.platformGroup){
				controlSystem.platformGroup = game.add.physicsGroup();
				currentLevel.endCreates.push(function(){
					controlSystem.platformGroup.setAll('body.immovable', true);
				});
			}
			var sprite = controlSystem.platformGroup.create(optX || 0, optY || 0, spriteName);
			sprite.anchor.setTo(0.5, 0.5);
			more.sprite = sprite;
		});

		return more;
	}

	function useArrowKeys(){
		currentLevel.creates.push(function(){
			controlSystem.listenToArrowKeys();
		});
		currentLevel.updates.push(function(){
			controlSystem.update(); // wrapped in a function so that update has the right context
		});
		currentLevel.endCreates.push(function(){
			controlSystem.setSpeeds();
		});
	}

	function enableGravity(){
		currentLevel.earlyCreates.push(function(){
			controlSystem.flyingEnabled = true;
		});
		currentLevel.endCreates.push(function(){
			for(var i = 0, len = currentLevel.usesGravity.length; i < len; i++){
				currentLevel.usesGravity[i].body.gravity.y = 100;
			}
		});
	}

	function simpleCameraFollow(){
		currentLevel.endCreates.push(function(){
			cameraSystem.normalFollow();
		});
	}

	function smoothCameraFollow(){
		currentLevel.earlyCreates.push(function(){
			cameraSystem.setupSmoothFollow();
		});
	}

	function setStartLocation(x, y){
		currentLevel.earlyCreates.push(function(){
			spawnSystem.forSure = true;
			spawnSystem.startX = x;
			spawnSystem.startY = y;
		});
	}

	function setFinishBox(x, y, optSize){
		var more = {
			sprite: null,
			messageText: '!',
			messageX: 25,
			messageY: 25,
			nextLevelNumber: null,
			debug: function(){
				currentLevel.renders.push(function(){
					game.debug.body(more.sprite);
				});
				return more;
			},
			message: function(text, x, y){
				more.messageText = text;
				if(x !== undefined){more.messageX = x;}
				if(y !== undefined){more.messageY = y;}
				return more;
			},
			next: function(levelNumber){
				more.nextLevelNumber = levelNumber;
				return more;
			}
		};

		optSize = optSize ? optSize : 10;
		var helperSpriteName = 'empty';
		currentLevel.preloads.push(function(){
			if(!currentLevel.preloadedSpriteNames.empty){
				game.load.image(helperSpriteName, helpers.figureOutPath(helperSpriteName));
				currentLevel.preloadedSpriteNames.empty = true;
			}
		});
		currentLevel.creates.push(function(){
			var helperSprite = game.add.sprite(x, y, helperSpriteName);
			game.physics.arcade.enable(helperSprite);
			helperSprite.body.setSize(optSize, optSize, -optSize / 2, -optSize / 2);
			more.sprite = helperSprite;
		});

		var youGotThere = false;
		overlapSystem.initialize();
		overlapSystem.overlaps.push(function(player){
			game.physics.arcade.overlap(player, more.sprite, function(){
				if(!youGotThere){
					youGotThere = true;
					currentLevel.renders.push(function(){
						game.debug.text(more.messageText, more.messageX, more.messageY);
					});

					// load the next level
					if(more.nextLevelNumber && game.state.states['level'+more.nextLevelNumber]){
						game.state.start('level'+more.nextLevelNumber, true, false);
					}
				}
			}, null, game);
		});

		return more;
	}

	function displayDebugText(message, optX, optY){
		if(optX === undefined){optX = 25;}
		if(optY === undefined){optY = 25;}
		currentLevel.renders.push(function(){
			game.debug.text(message, optX, optY);
		});
	}

	function customUpdate(userCallback){
		currentLevel.userUpdates.push(userCallback);
	}

	function addBlockSprite(spriteName, x, y){ // TODO: allow blocks of sizes other than 32
		// x and y are in big 32 pixel coordinates
		if(!helpers.isString(spriteName)){return {};}
		x = x * 32;
		y = y * 32;
		currentLevel.preloads.push(function(){
			if(!currentLevel.preloadedSpriteNames[spriteName]){
				game.load.image(spriteName, helpers.figureOutPath(spriteName));
				currentLevel.preloadedSpriteNames[spriteName] = true;
			}
		});
		currentLevel.creates.push(function(){
			if(!controlSystem.platformGroup){
				controlSystem.platformGroup = game.add.physicsGroup();
				currentLevel.endCreates.push(function(){
					controlSystem.platformGroup.setAll('body.immovable', true);
				});
			}
			var sprite = controlSystem.platformGroup.create(x, y, spriteName);
			sprite.anchor.setTo(0.5, 0.5);
		});
	}

	function createTilemap(jsonFileNameOrObject, optImageNames, optLayerNames){

		// preload the json file and image files
		var jsonName;
		if(typeof jsonFileNameOrObject === 'string'){
			currentLevel.preloads.push(function(){
				jsonName = jsonFileNameOrObject;
				if(!currentLevel.preloadedTilemapNames[jsonName]){
					game.load.tilemap(jsonName, helpers.figureOutPath(jsonName, '.json'), null, Phaser.Tilemap.TILED_JSON);
				}
			});
		} else if(typeof jsonFileNameOrObject === 'object'){
			currentLevel.preloads.push(function(){
				jsonName = helpers.ezHash(JSON.stringify(jsonFileNameOrObject));
				if(!currentLevel.preloadedTilemapNames[jsonName]){
					game.load.tilemap(jsonName, null, jsonFileNameOrObject, Phaser.Tilemap.TILED_JSON);
				}
			});
		} else {return;}


		if(optImageNames === undefined){
			optImageNames = [jsonFileNameOrObject];
		} else if(typeof optImageNames === 'string'){
			optImageNames = [optImageNames];
		} 

		if(typeof optImageNames === 'object' && optImageNames.length !== undefined){ // is array
			currentLevel.preloads.push(function(){
				for(var i = 0, len = optImageNames.length; i < len; i++){
					if(!currentLevel.preloadedTilemapNames[optImageNames[i]]){
						optImageNames[i] = helpers.addExtension(optImageNames[i]); // needs extension because tilemapping tool
						game.load.image(optImageNames[i], helpers.figureOutPath(optImageNames[i]));
					}
				}
			});
		} else {return;}

		if(optLayerNames === undefined){
			optLayerNames = ['world']; // default from riskylab.com/tilemap
		} else if(typeof optLayerNames === 'string'){
			optLayerNames = [optLayerNames];
		} 

		// create the map, add images, and create layers
		currentLevel.creates.push(function(){
			var map = game.add.tilemap(jsonName);


			for(var i = 0, len = optImageNames.length; i < len; i++){
				map.addTilesetImage(optImageNames[i], optImageNames[i]);
			}

			for(i = 0, len = optLayerNames.length; i < len; i++){
				var layer = map.createLayer(optLayerNames[i]);
				layer.resizeWorld();
				controlSystem.mapLayer = layer;
			}
			map.setCollisionByExclusion([1]);
		});
	}

	window.player = makePlayerSprite;
	window.background = addBackground;
	window.arrowkeys = useArrowKeys;
	window.gravity = enableGravity;
	window.platform = addPlatformSprite;
	window.followcamera = simpleCameraFollow;
	window.smoothcamera = smoothCameraFollow;
	window.start = setStartLocation;
	window.finish = setFinishBox;
	window.text = displayDebugText;
	window.update = customUpdate;
	window.block = addBlockSprite;
	window.tilemap = createTilemap;

	function preload(){
		for(var i = 0, len = currentLevel.preloads.length; i < len; i++){
			currentLevel.preloads[i]();
		}
	}
	function create(){
		game.world.setBounds(-960, -960, 1920, 1920); // set world size, make these params configurable. 0,0 is in the middle
		game.camera.x = 0 - screenWidth / 2;
		game.camera.y = 0 - screenHeight / 2;

		game.physics.startSystem(Phaser.Physics.ARCADE); // always need physics

		for(var i = 0, len = currentLevel.earlyCreates.length; i < len; i++){
			currentLevel.earlyCreates[i]();
		}
		for(i = 0, len = currentLevel.creates.length; i < len; i++){
			currentLevel.creates[i]();
		}
		for(i = 0, len = currentLevel.endCreates.length; i < len; i++){
			currentLevel.endCreates[i]();
		}

		currentLevel.firstUpdates.unshift(function(){spawnSystem.movePlayer();}); // always have to start the player at the right spot
	}

	var isFirstFrame = true; // I don't like this, but it works.
	function update(){
		var i, len;
		if(isFirstFrame){
			for(i = 0, len = currentLevel.firstUpdates.length; i < len; i++){
				currentLevel.firstUpdates[i]();
			}
			isFirstFrame = false;
		}

		for(i = 0, len = currentLevel.updates.length; i < len; i++){
			currentLevel.updates[i]();
		}
		for(i = 0, len = currentLevel.userUpdates.length; i < len; i++){
			currentLevel.userUpdates[i](game, controlSystem.player); // user currentLevel.updates get some parameters to work with
		}
	}
	function render(){
		for(var i = 0, len = currentLevel.renders.length; i < len; i++){
			currentLevel.renders[i]();
		}
	}


	// ----- MAIN -------
	(function main(){
		game = new Phaser.Game(screenWidth, screenHeight, Phaser.AUTO, '');
		window.game = game;

		var count = 1;
		while(window['level'+count] && typeof window['level'+count] === "function"){
			try{
				currentLevel = new Level();
				levels.push(currentLevel);
				game.state.add('level'+count, {
					preload: (function(index){
						return function(){
							currentLevel = levels[index];
							if(index > 0){ // TODO: fix this so that it can work when going back to level 1
								helpers.resetEverything();
							}
							preload(); // call the actual preload function
						};
					})(count - 1), // I hate javascript
					create: create, 
					update: update, 
					render: render
				});

				window['level'+count](); // actually call the level1, level2, etc functions

			} catch(e){
				console.log(e);
			} finally{
				count++;
			}
		}

		if(count > 1){ // meaning, it successfully made at least one level
			game.state.start('level1');
		}

	})();

})();