function level1(){
	background('#CAB8DB');
	background('clouds2').depth(2);
	background('clouds1').depth(3);
	player('rocketman', 64, 64).add('box', 24, -18);//.enableJumping();
	arrowkeys();
	gravity();
	platform('floating_platform', 80, 36, -100, 125).animation(10);
	platform('floating_platform', 80, 36, 100, 50).animation(10);
	smoothcamera();
	start(-100, -200);
	finish(100, 0, 50).debug().message('yay!').next(2);
	text('Rocket Delivery', 300, 25);
}

function level2(){
	background('#884455');
	background('clouds2').depth(2);
	player('rocketman', 64, 64).add('box', 24, -18);
	platform('floating_platform', 80, 36, 0, 125).animation(10);
}