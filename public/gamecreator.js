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
			savedGames: [],
			selectedSavedGame: '',
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
				this.$http.get(baseUrl+'/api/games').then(function(response){
					// success
					console.log(response.body);
					this.savedGames = response.body;
				}, function(error){
					// something went wrong
					console.log(error);
				});
			},
			updateFormFromSelection: function(){
				// use the selected saved game to fill in the rest of the form
				// find the right save
				var id = this.selectedSavedGame;
				var arr = this.savedGames;
				var savedGame;
				for(var i = 0, len = arr.length; i < len; i++){
					if(arr[i]._id === id){
						savedGame = arr[i];
						break;
					}
				}
				if(!savedGame){return;}

				this.selectedTemplate = savedGame.selectedTemplate;
				this.levelData = savedGame.levelData;
				this.firstName = savedGame.firstName;
				this.lastName = savedGame.lastName;
				this.startX = savedGame.startX;
				this.startY = savedGame.startY;
				this.finishX = savedGame.finishX;
				this.finishY = savedGame.finishY;
			}
		}
	});
	app.loadSaves();

 
})();