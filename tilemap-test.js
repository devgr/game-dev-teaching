function level1(){
	background('#88aaff');
	tilemap('mariosample', 'mariotiles');
	var playerObj = player('mario', 32, 43);
	arrowkeys();
	followcamera();

}