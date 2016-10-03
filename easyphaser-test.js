function level1(){
	background('#CAB8DB');
	background('clouds2');
	background('clouds1');
	player('rocketman', 64, 64);//.enableJumping();
	arrowkeys();
	gravity();
	platform('floating_platform', 80, 36, 0, 125).animation(10);
}