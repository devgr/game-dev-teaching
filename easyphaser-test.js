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
	background('clouds1').depth(3);
	player('rocketman', 64, 64).add('box', 24, -18).enableJumping();
	arrowkeys();
	gravity();
	smoothcamera();
	start(0, 0);
	text('Rocket Delivery', 300, 25);
	block('grass', 0, 4);
	block('grass', 1, 4);
	block('grass', 2, 4);
	block('grass', 3, 4);
	block('grass', -1, 4);
	block('grass', -2, 4);
	block('dirt', 0, 5);
	block('dirt', 1, 5);
	block('dirt', 2, 5);
	block('dirt', 3, 5);
	block('dirt', -1, 5);
	block('dirt', -2, 5);
	block('dirt', 0, 6);
	block('dirt', 1, 6);
	block('dirt', 2, 6);
	block('dirt', 3, 6);
	block('dirt', -1, 6);
	block('dirt', -2, 6);
	block('brick', 4, 6);
	block('brick', 4, 5);
	block('brick', 4, 4);
	block('brick', 4, 3);
	block('brick', 4, 2);
	block('brick', 4, 1);
	block('grass', 7, 2);
	block('grass', 8, 2);
	block('grass', 9, 2);
	block('grass', 10, 2);
	block('dirt', 7, 3);
	block('dirt', 8, 3);
	block('dirt', 9, 3);
	block('dirt', 10, 3);

}