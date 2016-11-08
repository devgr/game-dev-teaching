(function(){

	var config = {
		templates:[{
				name: 'Mario',
				tileset: 'mariotiles',
				player: {
					sprite: 'mario',
					width: 32,
					height: 43
				},
				useGravity: true,
				background: '#88aaff'
			}, {
				name: 'Minecraft',
				tileset: 'minecrafttiles',
				player: {
					sprite: 'steve',
					width: 32,
					height: 64
				},
				useGravity: true,
				background: '#88aaff'
			}, {
				name: 'Maze',
				tileset: 'mazetiles',
				player: {
					sprite: 'ball',
					width: 32,
					height: 32
				},
				useGravity: false,
				background: '#444455'
			}
		]
	};

	// set indexes
	for(var i = 0; i < config.templates.length; i++){
		config.templates[i].id = i;
	}

	var app = new Vue({
		el: '#app',
		data: {
			message: 'app test',
			gameTemplates: config.templates,
			selectedTemplate: 1,
			tilemaps: [],
			firstName: '',
			lastName: '',
		},
		methods: {
			filePicked: function(event){
				var reader = new FileReader();
				var file = event.target.files[0];

				var index = this.tilemaps.length;
				this.tilemaps.push({
					id: index,
					name: file.name,
					json: null
				});

				reader.readAsText(file);

				var vue = this;
				reader.onload = function(event){
					vue.tilemaps[index].json = event.target.result;
				};
			},
			saveForm: function(event){
				// post to server
			},
			buildGame: function(){
				var template = config.templates[this.selectedTemplate];
				
				for(var i = 0; i < this.tilemaps.length; i++){
					var tilemapObj = JSON.parse(this.tilemaps[i].json);
					
					window['level'+(i+1)] = (function(tilemapObj_){
						return function(){
							background(template.background);
							tilemap(tilemapObj_, template.tileset);
							var playerObj = player(template.player.sprite, template.player.width, template.player.height);
							arrowkeys();
							smoothcamera();
							if(template.useGravity){
								playerObj.enableJumping();
							}
						};
					})(tilemapObj);
				}

				destroygame();
				loadgame();
			}
		}
	});

 
})();