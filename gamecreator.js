(function(){

	var config = {
		templateNames: ['Mario', 'Minecraft', 'Maze'],
		templates:{
			Mario:{
				tileset: 'mariotiles',
				player: {
					sprite: 'mario',
					width: 32,
					height: 43
				},
				useGravity: true,
				background: '#88aaff'
			}, 
			Minecraft:{
				tileset: 'minecrafttiles',
				player: {
					sprite: 'steve',
					width: 32,
					height: 64
				},
				useGravity: true,
				background: '#88aaff'
			}, 
			Maze:{
				tileset: 'mazetiles',
				player: {
					sprite: 'ball',
					width: 32,
					height: 32
				},
				useGravity: false,
				background: '#444455'
			}
		}
	};

	var app = new Vue({
		el: '#app',
		data: {
			message: 'app test',
			gameTemplates: config.templateNames,
			selectedTemplate: 'Minecraft',
			tilemaps: [],
			firstName: '',
			lastName: '',
		},
		methods: {
			filePicked: function(event){
				var reader = new FileReader();
				var file = event.target.files[0];

				this.tilemaps.push({
					name: file.name,
					json: null
				});
				var index = this.tilemaps.length - 1;

				reader.readAsText(file);

				var vue = this;
				reader.onload = function(event){
					vue.tilemaps[index].json = event.target.result;
					vue.buildLevel();
				};
			},
			saveForm: function(event){
				// post to server
			},
			buildLevel: function(){
				var template = config.templates[this.selectedTemplate];
				var tilemapObj = JSON.parse(this.tilemaps[0].json);

				window.level1 = function(){
					background(template.background);
					tilemap(tilemapObj, template.tileset);
					var playerObj = player(template.player.sprite, template.player.width, template.player.height);
					arrowkeys();
					followcamera();
					if(template.useGravity){
						playerObj.enableJumping();
					}
				};

				destroygame();
				loadgame();
			},
		}
	});

 
})();