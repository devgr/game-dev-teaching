(function(){

	var config = {
		templateNames: ['Mario', 'Minecraft', 'Maze'],
		templates:[{
			name: 'Mario',
			tileset: 'mariotiles',
			player: {
				sprite: 'mario',
				width: 16,
				height: 16
			},
			useGravity: true,
			background: '#88aaff'
		}, {
			name: 'Minecraft',
			tileset: 'minecrafttiles',
			player: {
				sprite: 'steve',
				width: 64,
				height: 64
			},
			useGravity: true,
			background: '#88aaff'
		}, {
			name: 'Maze',
			tileset: 'mazetiles',
			player: {
				sprite: 'ball',
				width: 64,
				height: 64
			},
			useGravity: false,
			background: '#444455'
		}]
	};

	var app = new Vue({
		el: '#app',
		data: {
			message: 'app test',
			gameTemplates: config.templateNames,
			selectedTemplate: 'Mario',
			firstName: '',
			lastName: '',
		},
		methods: {
			filePicked: function(event){
				var reader = new FileReader();
				reader.readAsText(event.target.files[0]);

				var vue = this;
				reader.onload = function(event){
					var tileJson = JSON.parse(event.target.result);
					vue.buildLevel(tileJson, vue.selectedTemplate);
				};
			},
			saveForm: function(event){
				// post to server
			},
			buildLevel: function(tileJson, templateName){
				var template = config.templates[templateName];

				window.level1 = function(){
					background(template.background);
					tilemap(tileJson, template.tileset);
					var playerObj = player(template.player.sprite, template.player.width, template.player.height);
					arrowkeys();
					followcamera();
					if(template.useGravity){
						playerObj.enableJumping();
					}
				};
				loadgame();
			},
		}
	});

 
})();