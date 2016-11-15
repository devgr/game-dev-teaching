(function(){

	var baseUrl = 'http://' + window.location.hostname;
	if(baseUrl.indexOf('localhost') != -1){
		baseUrl += ':3000';
	}

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
			gameTemplates: config.templates,
			selectedTemplate: 1,
			levelData: [],
			firstName: '',
			lastName: '',
			startX: 50,
			startY: 50,
			finishX: 100,
			finishY: 200,
			showSave: false,
			saveMessage: '',
		},
		methods: {
			filePicked: function(event){
				var reader = new FileReader();
				var file = event.target.files[0];

				var index = this.levelData.length;
				this.levelData.push({
					id: index,
					name: file.name,
					json: null,
					startX: this.startX,
					startY: this.startY,
					finishX: this.finishX,
					finishY: this.finishY,
				});

				reader.readAsText(file);

				var vue = this;
				reader.onload = function(event){
					vue.levelData[index].json = event.target.result;
				};
			},
			saveForm: function(event){
				// post to server
				body = {
					selectedTemplate: this.selectedTemplate,
					levelData: this.levelData,
					firstName: this.firstName,
					lastName: this.lastName,
					startX: this.startX,
					startY: this.startY,
					finishX: this.finishX,
					finishY: this.finishY,
				};
				this.$http.post(baseUrl+'/api/games', body).then(function(response){
					// success
					this.saveMessage = 'Saved!';
				}, function(error){
					// something went wrong
					this.saveMessage = 'Uh oh, not saved :(';
				});
			},
			buildGame: function(){
				var template = config.templates[this.selectedTemplate];
				
				for(var i = 0; i < this.levelData.length; i++){
					var level = this.levelData[i];
					
					window['level'+(i+1)] = (function(lvl){
						return function(){
							var tilemapObj = JSON.parse(lvl.json);
							background(template.background);
							tilemap(tilemapObj, template.tileset);
							var playerObj = player(template.player.sprite, template.player.width, template.player.height);
							arrowkeys();
							smoothcamera();
							if(template.useGravity){
								playerObj.enableJumping();
							}
							start(lvl.startX, lvl.startY);
							finish(lvl.finishX, lvl.finishY, 50).message('').debug().next(lvl.id + 2);
						};
					})(level);
				}

				destroygame();
				loadgame();
				this.showSave = true;
			},
			loadSaves: function(){
				console.log('yep');
			}
		}
	});
	app.loadSaves();

 
})();