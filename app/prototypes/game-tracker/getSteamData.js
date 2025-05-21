var http = require('http');
var fs = require('fs');
var path = require('path');
var apiKey = "E1236C804C048AFC127EE0003D297864";
var steamId = "76561197994963410";
var getOwnedGamesUrl = "http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=" + apiKey + "&steamid=" + steamId + "&format=json";
var getGameInformationUrl = "http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=" + apiKey + "&appid=";
var getPlayerAchievementsUrl = "http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?key=" + apiKey + "&steamid=" + steamId + "&appid=";
var outputLocation = path.join(__dirname, "assets", "data", "playerData.json");
var gameData = {
	games: []
};
console.log("Get Owned Games");

http.get(getOwnedGamesUrl, function(res){
	var responseString = "";
	res.setEncoding('utf8');

	res.on('data', function(data){
		responseString += data;
	}).on("end", function(){
		var responseGameData = JSON.parse(responseString);
		
		for(var i=0,j=responseGameData.response.games.length; i<j; i++){
			var game;
			if(responseGameData.response.games[i].playtime_forever !== 0){
				game = responseGameData.response.games[i];
				game.name = "";
				game.totalAchievements = 0;
				game.totalPlayerAchievements = 0;
				game.achievements = [];
				gameData.games.push(game);
				
			}
		}
		getPlayerAchievements();
	});
	
}).on('error', function(e){
	console.log("getOwnedGamesUrl got error: " + e.message);
});

var getPlayerAchievements = function(){
	console.log("Get Player Achievements");
	var lookup = {};
	for (var i=0,j=gameData.games.length; i<j; i++){
		lookup[gameData.games[i].appid] = gameData.games[i];
	}
	var httpCount = 0;
	var totalGames = gameData.games.length;

	for(var i=0,j=gameData.games.length; i<j; i++){
		http.get(getPlayerAchievementsUrl + gameData.games[i].appid, function(res){
			var path = res.socket._httpMessage.path;
			var appid = path.substring(path.indexOf("&appid=") + "&appid=".length);
			var responseString = "";
			res.setEncoding('utf8');
			
			res.on('data', function(data){
				responseString += data;
			}).on("end", function(){
				var responseGameAchievements = JSON.parse(responseString);

				if(responseGameAchievements.playerstats.achievements !== undefined){
					lookup[appid].totalAchievements = responseGameAchievements.playerstats.achievements.length;
					for(var k=0,l=responseGameAchievements.playerstats.achievements.length; k<l; k++){
						if(responseGameAchievements.playerstats.achievements[k].achieved === 1){
							var achievement = {
								name: responseGameAchievements.playerstats.achievements[k].apiname,
								icon: "",
								displayName: "",
								description: ""
							};
							lookup[appid].totalPlayerAchievements++;
							lookup[appid].achievements.push(achievement);
						}
					}
				}else{
					//Remove Game
					var gameIndex = gameData.games.indexOf(lookup[appid]);
					
					if(gameIndex > -1) {
					    gameData.games.splice(gameIndex, 1);
					}
				}
				
				httpCount++;
			});
		}).on('error', function(e){
			console.log("getGameInformationUrl got error: " + e.message);
		});
	}

	var httpTimer = setInterval(function(){
		if(httpCount === totalGames){
			clearInterval(httpTimer);
			getGameInformation();
		}
	}, 100);
};

var getGameInformation = function(){
	console.log("Get Game Information");
	var lookup = {};
	for (var i=0,j=gameData.games.length; i<j; i++){
		lookup[gameData.games[i].appid] = gameData.games[i];
	}
	var httpCount = 0;
	var totalGames = gameData.games.length;

	for(var i=0,j=gameData.games.length; i<j; i++){
		http.get(getGameInformationUrl + gameData.games[i].appid, function(res){
			var path = res.socket._httpMessage.path;
			var appid = path.substring(path.indexOf("&appid=") + "&appid=".length);
			var responseString = "";
			res.setEncoding('utf8');
			
			res.on('data', function(data){
				responseString += data;
			}).on("end", function(){
				var responseGameInformation = JSON.parse(responseString);
				
				if(Object.keys(responseGameInformation.game).length !== 0 && 
					responseGameInformation.game.gameName.length !== 0 &&
					responseGameInformation.game.gameName.indexOf("ValveTestApp") === -1){
					lookup[appid].name = responseGameInformation.game.gameName;

					for(var k=0,l=lookup[appid].achievements.length; k<l; k++){
						for(var n=0,m=responseGameInformation.game.availableGameStats.achievements.length; n<m; n++){
							if(lookup[appid].achievements[k].name === responseGameInformation.game.availableGameStats.achievements[n].name){
								lookup[appid].achievements[k].displayName = responseGameInformation.game.availableGameStats.achievements[n].displayName;
								lookup[appid].achievements[k].icon = responseGameInformation.game.availableGameStats.achievements[n].icon;
								lookup[appid].achievements[k].description = responseGameInformation.game.availableGameStats.achievements[n].description;
								break;
							}
						}
					}
				}else{
					//Remove Game
					var gameIndex = gameData.games.indexOf(lookup[appid]);
					
					if(gameIndex > -1) {
					    gameData.games.splice(gameIndex, 1);
					}
				}
				httpCount++;
			});
		}).on('error', function(e){
			console.log("getGameInformationUrl got error: " + e.message);
		});
	}

	var httpTimer = setInterval(function(){
		if(httpCount === totalGames){
			clearInterval(httpTimer);
			saveData();
		}
	}, 100);
};

var saveData = function(){
	console.log("Save Player's Game Information");
	var ws = fs.createWriteStream(outputLocation);
	ws.write(JSON.stringify(gameData, null, 4));
	ws.end();
};