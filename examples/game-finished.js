window.onload = function() {
    // initialize a new phaser game.
    // the size of the game is 480 pixels wide by 320 pixels tall.
    var game = new Phaser.Game(480, 320, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });

    // these are variables that will be used later on
    var input = {};
    var player;
    var platforms;
    var finishBox;
    var successMessage = '';

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
        game.world.setBounds(0, 0, 640, 640); // the top left corner of the map is 0,0 and the width is 640 and the height is 640.
        game.physics.startSystem(Phaser.Physics.ARCADE); // initialize the arcade physics system.
        //game.physics.arcade.gravity.y = 100; // to set gravity for everything

        // background -----------------------------------------------
        game.stage.backgroundColor = "#CAB8DB"; // pretty purple color
        var clouds2 = game.add.sprite(0, 0, 'clouds2'); // add clouds with the upper left corner at 0,0
        var clouds1 = game.add.sprite(0, 0, 'clouds1'); // add more clouds

        // make platforms -------------------------------------------
        platforms = game.add.physicsGroup(); // all of the floating platforms are going to be in this group, and initialize physics for them

        var platform1 = platforms.create(200, 400, 'platform'); // make the first platform, located at x=200, y=400
        platform1.anchor.setTo(0.5, 0.5); // position the sprite based on its middle.
        platform1.animations.add('float'); // make an animation
        platform1.animations.play('float', 10, true); // start the 'float' animation, 10 frames per second, looping

        var platform2 = platforms.create(450, 250, 'platform'); // make another platform
        platform2.anchor.setTo(0.5, 0.5); // same thing as before
        platform2.animations.add('float');//, [1,2], 10, true, true); // there are lots of options when adding animations
        platform2.animations.play('float', 10, true);

        platforms.setAll('body.immovable', true);

        // make the finish area -------------------------------------
        finishBox = platform2.addChild(game.make.sprite(0, 0, 'collider')); // it is a child of platform2, meaning it is at the same location
        game.physics.arcade.enable(finishBox); // physics are used to tell if the player is in the finish area
        finishBox.body.setSize(80, 80, -40, -100); // make the finish area 80 by 80 pixels, located at -40,-100 relative to the platform

        // make the player ------------------------------------------
        player = game.add.sprite(200, game.world.centerY, 'rocketman'); // add the rocketman sprite
        player.anchor.setTo(0.5, 0.5);
        player.addChild(game.make.sprite(11, -25, 'box')); // make the cardboard box and put it in the player's hands

        game.physics.arcade.enable(player); // enable physics on the player
        //game.physics.enable([player], Phaser.Physics.ARCADE); // another way to enable physics
        player.body.gravity.y = 100; // enable gravity for the player
        player.body.drag = new Phaser.Point(50,0); // set horizontal drag on the player so that it slows down
        player.body.collideWorldBounds = true; // don't let the player go flying off the screen!
        // player.body.bounce.y = 0.8; // if you want the player to bounce off of things

        // arrow keys ----------------------------------------------
        input.up = game.input.keyboard.addKey(Phaser.Keyboard.UP); // enable the up key
        input.left = game.input.keyboard.addKey(Phaser.Keyboard.LEFT); // enable the left key
        input.right = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT); // enable the right key

        // camera stuff --------------------------------------------
        game.camera.follow(player); // keep the player in the center and have the camera follow the player as they move.
    }

    // the update function happens every frame. use it for things that need to be done often.
    function update(){
        game.physics.arcade.collide(player, platforms); // check for the player colliding with the platforms
        game.physics.arcade.overlap(player, finishBox, youGotThere, null, this); // check for the player reaching the finish

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
        game.debug.body(finishBox); // show the invisible finish area

        if(successMessage){ // successMessage is a variable that is set in the youGotThere function
            game.debug.text(successMessage, 100, 100); // show the text 'You made it!!'
        }
    }

    // this is our own function that happens when the player reaches the finish
    function youGotThere(thing1, thing2){
        successMessage = 'You made it!!';
    }
};