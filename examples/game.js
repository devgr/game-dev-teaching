window.onload = function() {
    // initialize a new phaser game.
    var game = new Phaser.Game(480, 320, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });

    // use the preload function to load sprites and images
    function preload () {
        game.load.image('clouds1','sprites/clouds1.png');
        game.load.image('clouds2','sprites/clouds2.png');
    }

    // use the create function to initialize everything in the game
    function create () {
        var clouds1 = game.add.sprite(0, 0, 'clouds1');
        var clouds2 = game.add.sprite(0, 0, 'clouds2');
        game.stage.backgroundColor = "#CAB8DB";
    }

    // the update function happens every frame. use it for things that need to be done often.
    function update(){

    }

    // the render function happens after the update function. use it for putting text on the screen.
    function render(){

    }
};