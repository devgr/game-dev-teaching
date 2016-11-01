(function(){
	var app = new Vue({
		el: '#app',
		data: {
			message: 'app test',
			gameTemplates: ['Mario', 'Minecraft', 'Maze'],
			selectedTemplate: 'Mario',
			firstName: '',
			lastName: '',
		},
		methods: {
			filePicked: function(event){
				var reader = new FileReader();
				reader.onload = jsonFileLoaded;
				reader.readAsText(event.target.files[0]);
			},
			saveForm: function(event){
				// post to server
			}
		}
	});


	//var onFileUploadChange = function(event) {
	//	var reader = new FileReader();
	//	reader.onload = jsonFileLoaded;
	//	reader.readAsText(event.target.files[0]);
	//};

	var jsonFileLoaded = function(event){
		var tileJson = JSON.parse(event.target.result);
		buildLevel(tileJson);
	};

	var buildLevel = function(tileJson){
		window.level1 = function(){
			background('#88aaff');
			tilemap(tileJson, 'ss');
			player('rocketman', 64, 64);
			arrowkeys();
			followcamera();
		};
		loadgame();
	};
 
	//document.getElementById('jsonfile').addEventListener('change', onFileUploadChange);
})();