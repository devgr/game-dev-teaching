// Load after phaser-arcade-physics.js
// Patches the loading of tilemap json files to convert
// riskylab tilemaps to tiled tilemaps.
(function(){
	var jsonFixer = function(obj){
		if(obj.orientation){
			return obj;
		}
		if(obj.tilesets.length > 0){
			obj.tileheight = obj.tilesets[obj.tilesets.length - 1].tileheight;
			obj.tilewidth = obj.tilesets[obj.tilesets.length - 1].tilewidth;
		} else{
			obj.tileheight = 32;
			obj.tilewidth = 32;
		}
		obj.height = obj.canvas.height / obj.tileheight | 0;
		obj.width = obj.canvas.width / obj.tilewidth | 0;
		obj.version = 1;
		obj.nextobjectid = 1;
		obj.orientation = 'orthogonal';
		obj.renderorder = 'right-down';

		var tilesetName2RowWidth = {};
		for(var i = 0, len = obj.tilesets.length; i < len; i++){
			var tileset = obj.tilesets[i];
			tileset.columns = tileset.imagewidth / tileset.tilewidth | 0;
			tilesetName2RowWidth[tileset.name] = tileset.columns;
			tileset.firstgid = 1;
			tileset.margin = 0;
			tileset.spacing = 0;
			tileset.tilecount = tileset.columns * (tileset.imageheight / tileset.tileheight) | 0;
		}

		for(i = 0, len = obj.layers.length; i < len; i++){
			var layer = obj.layers[i];
			var numColumns = tilesetName2RowWidth[(layer.tileset||'')];
			layer.height = obj.height;
			layer.width = obj.width;
			layer.x = 0;
			layer.y = 0;
			layer.opacity = 1;
			layer.visible = true;
			layer.type = 'tilelayer';

			for(var d = 0, lend = layer.data.length; d < lend; d++){
				var num = layer.data[d];
				num += 1;
				var numstr = num.toString();
				if(numstr.indexOf('.') !== -1){
					var split = numstr.split('.');
					var col = parseInt(split[0], 10);
					var row = parseInt(split[1], 10);
					num = col + row * numColumns;
				}
				layer.data[d] = num;
			}
		}

		return obj;
	};

	var original = Phaser.TilemapParser.parseTiledJSON;
	Phaser.TilemapParser.parseTiledJSON = function(json){
		original(jsonFixer(json));
	};
})();