window.onload = function() {
    // initialize a new phaser game.
    // the size of the game is 480 pixels wide by 320 pixels tall.
    var screenWidth = 480;
    var screenHeight = 320;
    var game = new Phaser.Game(screenWidth, screenHeight, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });

    // these are variables that will be used later on
    var input = {};
    var player;
    var platforms;
    var finishBox;
    var successMessage = '';
    var clouds1;
    var clouds2;
    var init = {};
    var moveBufferX = [];
    var moveBufferY = [];
    var bufferLength = 30;
    var bufferPosition = 0;

    // use the preload function to load sprites and images
    function preload () {
        // load all of the sprites and give them a name.
        game.load.image('clouds1', './sprites/clouds1.png');
        game.load.image('clouds2', './sprites/clouds2.png');
        game.load.spritesheet('rocketman', './sprites/rocketman.png', 64, 64, 12); // each frame is 64 by 64 pixels, and there are 12 of them.
        game.load.spritesheet('platform', './sprites/floating_platform.png', 80, 36);
        game.load.image('box', './sprites/box.png');
        game.load.image('collider', './sprites/empty.png');
    }

    // use the create function to initialize everything in the game
    function create () {
        // initialization -------------------------------------------
        game.world.setBounds(-960, -960, 1920, 1920); // the top left corner of the map is 0,0 and the width is 640 and the height is 640.
        game.physics.startSystem(Phaser.Physics.ARCADE); // initialize the arcade physics system.
        //game.physics.arcade.gravity.y = 100; // to set gravity for everything

        // background -----------------------------------------------
        game.stage.backgroundColor = "#CAB8DB"; // pretty purple color
        clouds2 = game.add.group();
        clouds2.x = 0;
        clouds2.y = 0;
        
        var cc = game.add.sprite(0, 0, 'clouds2'); // add clouds with the upper left corner at 0,0
        var ccc = game.add.sprite(640, 640, 'clouds2');
        cc.anchor.setTo(0.5, 0.5);
        ccc.anchor.setTo(0.5, 0.5);
        clouds2.add(cc);
        clouds2.add(ccc);
        
        clouds1 = game.add.sprite(0, 0, 'clouds1'); // add more clouds
        clouds1.anchor.setTo(0.5, 0.5);

        // make platforms -------------------------------------------
        platforms = game.add.physicsGroup(); // all of the floating platforms are going to be in this group, and initialize physics for them

        var platform1 = platforms.create(-50, 100, 'platform'); // make the first platform, located at x=200, y=400
        platform1.anchor.setTo(0.5, 0.5); // position the sprite based on its middle.
        platform1.animations.add('float'); // make an animation
        platform1.animations.play('float', 10, true); // start the 'float' animation, 10 frames per second, looping

        var platform2 = platforms.create(200, -100, 'platform'); // make another platform
        platform2.anchor.setTo(0.5, 0.5); // same thing as before
        platform2.animations.add('float');//, [1,2], 10, true, true); // there are lots of options when adding animations
        platform2.animations.play('float', 10, true);

        platforms.setAll('body.immovable', true);

        // make the finish area -------------------------------------
        finishBox = platform2.addChild(game.make.sprite(0, 0, 'collider')); // it is a child of platform2, meaning it is at the same location
        game.physics.arcade.enable(finishBox); // physics are used to tell if the player is in the finish area
        finishBox.body.setSize(80, 80, -40, -100); // make the finish area 80 by 80 pixels, located at -40,-100 relative to the platform

        // make the player ------------------------------------------
        player = game.add.sprite(0, 0, 'rocketman'); // add the rocketman sprite

        player.addChild(game.make.sprite(11, -25, 'box')); // make the cardboard box and put it in the player's hands
        game.physics.arcade.enable(player); // enable physics on the player
        //game.physics.enable([player], Phaser.Physics.ARCADE); // another way to enable physics
        player.body.gravity.y = 100; // enable gravity for the player
        player.body.drag = new Phaser.Point(50,0); // set horizontal drag on the player so that it slows down
        player.body.maxVelocity = new Phaser.Point(300, 300);
        player.body.collideWorldBounds = true; // don't let the player go flying off the screen!
        // player.body.bounce.y = 0.8; // if you want the player to bounce off of things
        player.anchor.setTo(0.5, 0.5);

        // arrow keys ----------------------------------------------
        input.up = game.input.keyboard.addKey(Phaser.Keyboard.UP); // enable the up key
        input.left = game.input.keyboard.addKey(Phaser.Keyboard.LEFT); // enable the left key
        input.right = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT); // enable the right key

        game.camera.x = 0 - screenWidth / 2;//avg[0];
        game.camera.y = 0 - screenHeight / 2;//avg[1];

        // grab initial positions
        init.clouds1X = clouds1.x;
        init.clouds1Y = clouds1.y;
        init.clouds2X = clouds2.x;
        init.clouds2Y = clouds2.y;
        init.camX = game.camera.x;
        init.camY = game.camera.y;
        init.playerX = player.x;
        init.playerY = player.y;
        initMoveBuffers();
        window.setTimeout(afterCreate, 0);
    }

    function afterCreate(){
        player.x = 0;
        player.y = 0;
        init.playerX = player.x;
        init.playerY = player.y;
    }

    // the update function happens every frame. use it for things that need to be done often.
    function update(){

        game.physics.arcade.collide(player, platforms); // check for the player colliding with the platforms
        game.physics.arcade.overlap(player, finishBox, youGotThere, null, this); // check for the player reaching the finish

        smoothCameraMove();
        clouds1.x = (game.camera.x - init.camX) / 3 + init.clouds1X;
        clouds1.y = (game.camera.y - init.camY) / 3 + init.clouds1Y;
        clouds2.x = (game.camera.x - init.camX) / 2 + init.clouds2X;
        clouds2.y = (game.camera.y - init.camY) / 2 + init.clouds2Y;

        if(input.up.isDown){ // check for the up key being pressed
            player.body.velocity.y -= 8; // make the player go up (up is smaller y values)
        }
        if(input.left.isDown){ // check for the left key being pressed
            player.body.velocity.x -= 4; // make the player go left (left is smaller x values)
        }
        if(input.right.isDown){ // check for the right key being pressed
            player.body.velocity.x += 4; // make the player go right (right is bigger x values)
        }
    }

    // the render function happens after the update function. use it for putting text on the screen.
    function render(){
        game.debug.text('Rocket Delivery', 25, 25); // show text in the upper left corner
        //game.debug.text('player y ' + player.y, 25, 50);
        //game.debug.text('init player y ' + init.playerY, 25, 75);
        //game.debug.text('init camera y ' + init.camY, 25, 100);
        //game.debug.text('cam x ' + game.camera.x, 25, 125);
        //game.debug.text('cam y ' + game.camera.y, 25, 150);
        //game.debug.body(finishBox); // show the invisible finish area

        if(successMessage){ // successMessage is a variable that is set in the youGotThere function
            //game.debug.text(successMessage, 100, 100); // show the text 'You made it!!'
        }
    }

    // this is our own function that happens when the player reaches the finish
    function youGotThere(thing1, thing2){
        successMessage = 'You made it!!';
    }

    function smoothCameraMove(){
        moveBufferX[bufferPosition] = player.x - init.playerX - screenWidth / 2;
        moveBufferY[bufferPosition] = player.y - init.playerY - screenHeight / 2;

        bufferPosition++;
        if(bufferPosition === bufferLength){
            bufferPosition = 0;
        }
        var avg = calcAvg();
        game.camera.x = avg[0];
        game.camera.y = avg[1];
    }

    function initMoveBuffers(){
        for(var i = 0; i < bufferLength; i++){
            moveBufferX[i] = init.camX;
            moveBufferY[i] = init.camY;
        }
    }

    function calcAvg(){
        var totalX = 0;
        var totalY = 0;
        for(var i = 0; i < bufferLength; i++){
            totalX += moveBufferX[i];
            totalY += moveBufferY[i];
        }
        return [totalX/bufferLength, totalY/bufferLength];
    }
};