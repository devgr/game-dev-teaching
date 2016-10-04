function level1(){
	background('#CAB8DB');
	background('clouds2');
	background('clouds1');
	player('rocketman', 64, 64).add('box', 24, -18);//.enableJumping();
	arrowkeys();
	gravity();
	platform('floating_platform', 80, 36, -100, 125).animation(10);
	platform('floating_platform', 80, 36, 100, 50).animation(10);
	coolcamera();
	start(-100, -200);
	finish(100, 0, 50).debug().message('yay!');
}