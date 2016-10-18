// TODO: multiple levels
// TODO: easy placing block sprites
// TODO: enemy walk back and forth
// TODO: enemy fly and follow player
(function(){
	'use strict';
	var game;
	var spritePath = './sprites/';
	var spriteExt = '.png';
	var screenWidth = 480;
	var screenHeight = 320;

	var preloads = [];
	var earlyCreates = [];
	var creates = [];
	var endCreates = [];
	var firstUpdates = [];
	var updates = [];
	var userUpdates = [];
	var renders = [];

	var usesGravity = [];
	var preloadedNames = {};

	var controlSystem = {
		inputs: {up: {isDown: null}, down: {isDown: null}, left: {isDown: null}, right: {isDown: null}}, // dummy initial values
		player: null,
		platformGroup: null, // for checking colisions
		flyingEnabled: false, 
		jumpingEnabled: false,
		xAccel: 0,
		yAccel: 0,

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
				firstUpdates.push(function(){body.maxVelocity = new Phaser.Point(200, 300);});
				this.xAccel = 30;
				this.yAccel = 250;
			} else if(this.flyingEnabled){ // slower, gravity based
				body.gravity.y = 100;
				body.drag = new Phaser.Point(50, 0);
				firstUpdates.push(function(){body.maxVelocity = new Phaser.Point(250, 250);});
				this.xAccel = 4;
				this.yAccel = 7;
			} else{ // can move in all directions
				body.drag = new Phaser.Point(500, 500);
				firstUpdates.push(function(){body.maxVelocity = new Phaser.Point(100, 100);});
				this.xAccel = 50;
				this.yAccel = 50;
			}
		},

		update: function(){

			if(this.platformGroup){
				game.physics.arcade.collide(this.player, this.platformGroup);
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
		normalFollow: function(){
			game.camera.follow(this.player);
		},
		setupSmoothFollow: function(){
			endCreates.push(function(){
				cameraSystem.cam = game.camera;
			});
			firstUpdates.push(function(){
				cameraSystem.initializeBuffers();
			});
			updates.push(function(){
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
		initialize: function(){
			if(!this.initialized){
				updates.push(function(){
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
		figureOutPath: function(spriteName){

			var hasExtension = spriteName.lastIndexOf('.') > 0;
			var hasSlash = spriteName.indexOf('/') !== -1;
			if(!hasExtension){
				spriteName = spriteName + spriteExt;
			}
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
		}
	};
	
	function makePlayerSprite(spriteName, spriteWidth, spriteHeight, optX, optY){
		if(!helpers.isString(spriteName)){return {};}
		var more = {
			player: null,
			enableJumping: function(){
				controlSystem.jumpingEnabled = true;
				return more;
			},
			enableFlying: function(){ 
				controlSystem.flyingEnabled = true;
				return more;
			},
			add: function(spriteName, optX, optY){
				preloads.push(function(){
					if(!preloadedNames[spriteName]){
						game.load.image(spriteName, helpers.figureOutPath(spriteName));
						preloadedNames[spriteName] = true;
					}
				});
				endCreates.push(function(){
					var sprite = game.make.sprite(optX || 0, optY || 0, spriteName);
					sprite.anchor.setTo(0.5, 0.5);
					more.player.addChild(sprite);
				});
				return more;
			}
		};

		preloads.push(function(){
			if(!preloadedNames[spriteName]){
				game.load.spritesheet(spriteName, helpers.figureOutPath(spriteName), spriteWidth, spriteHeight);
				preloadedNames[spriteName] = true;
			}
		});
		creates.push(function(){
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
		creates.push(function(){
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
				endCreates.push(function(){
					// got to get the initial camera position. Probably 0,0 but just to be sure
					more.initCamX = game.camera.x;
					more.initCamY = game.camera.y;
				});
				updates.push(function(){
			        more.sprite.x = (game.camera.x - more.initCamX) / ammount + more.initX;
			        more.sprite.y = (game.camera.y - more.initCamY) / ammount + more.initY;
				});
			}
		};

		preloads.push(function(){
			if(!preloadedNames[spriteName]){
				game.load.image(spriteName, helpers.figureOutPath(spriteName));
				preloadedNames[spriteName] = true;
			}
		});
		earlyCreates.push(function(){
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
				endCreates.push(function(){
					more.sprite.animations.add(optAnimationName);
					more.sprite.animations.play(optAnimationName, optFramesPerSecond, optIsLoop);
				});
				return more;
			}
			// TODO: Add the ability to have multiple animations and to switch between them
		};

		preloads.push(function(){
			if(!preloadedNames[spriteName]){
				game.load.spritesheet(spriteName, helpers.figureOutPath(spriteName), spriteWidth, spriteHeight);
				preloadedNames[spriteName] = true;
			}
		});
		creates.push(function(){
			if(!controlSystem.platformGroup){
				controlSystem.platformGroup = game.add.physicsGroup();
				endCreates.push(function(){
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
		creates.push(function(){
			controlSystem.listenToArrowKeys();
		});
		updates.push(function(){
			controlSystem.update(); // wrapped in a function so that update has the right context
		});
		endCreates.push(function(){
			controlSystem.setSpeeds();
		});
	}

	function enableGravity(){
		controlSystem.flyingEnabled = true;
		endCreates.push(function(){
			for(var i = 0, len = usesGravity.length; i < len; i++){
				usesGravity[i].body.gravity.y = 100;
			}
		});
	}

	function simpleCameraFollow(){
		endCreates.push(function(){
			cameraSystem.normalFollow();
		});
	}

	function smoothCameraFollow(){
		cameraSystem.setupSmoothFollow();
	}

	function setStartLocation(x, y){
		spawnSystem.forSure = true;
		spawnSystem.startX = x;
		spawnSystem.startY = y;
	}

	function setFinishBox(x, y, optSize){
		var more = {
			sprite: null,
			messageText: '!',
			messageX: 25,
			messageY: 25,
			debug: function(){
				renders.push(function(){
					game.debug.body(more.sprite);
				});
				return more;
			},
			message: function(text, x, y){
				more.messageText = text;
				if(x !== undefined){more.messageX = x;}
				if(y !== undefined){more.messageY = y;}
				return more;
			}
		};

		optSize = optSize ? optSize : 10;
		var helperSpriteName = 'empty';
		preloads.push(function(){
			if(!preloadedNames.empty){
				game.load.image(helperSpriteName, helpers.figureOutPath(helperSpriteName));
				preloadedNames.empty = true;
			}
		});
		creates.push(function(){
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
					renders.push(function(){
						game.debug.text(more.messageText, more.messageX, more.messageY);
					});
				}
			});
		});

		return more;
	}

	function displayDebugText(message, optX, optY){
		if(optX === undefined){optX = 25;}
		if(optY === undefined){optY = 25;}
		renders.push(function(){
			game.debug.text(message, optX, optY);
		});
	}

	function customUpdate(userCallback){
		userUpdates.push(userCallback);
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

		for(var i = 0, len = earlyCreates.length; i < len; i++){
			earlyCreates[i]();
		}
		for(i = 0, len = creates.length; i < len; i++){
			creates[i]();
		}
		for(i = 0, len = endCreates.length; i < len; i++){
			endCreates[i]();
		}

		firstUpdates.unshift(function(){spawnSystem.movePlayer();}); // always have to start the player at the right spot
	}

	var isFirstFrame = true; // I don't like this, but it works.
	function update(){
		var i, len;
		if(isFirstFrame){
			for(i = 0, len = firstUpdates.length; i < len; i++){
				firstUpdates[i]();
			}
			isFirstFrame = false;
		}

		for(i = 0, len = updates.length; i < len; i++){
			updates[i]();
		}
		for(i = 0, len = userUpdates.length; i < len; i++){
			userUpdates[i](game, controlSystem.player); // user updates get some parameters to work with
		}
	}
	function render(){
		for(var i = 0, len = renders.length; i < len; i++){
			renders[i]();
		}
	}
})();