var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var merge = require('merge')
var app = express()
var port = process.env.PORT || 5000

app.use(express.static(__dirname + "/"))

var server = http.createServer(app)
server.listen(port)

console.log("http server listening on %d", port)

var wss = new WebSocketServer({server: server})
console.log("websocket server created")

// Game object
var game = {};
game.state = { time: "day"};
game.players = {};
var roles = ['villager', 'wolf', 'hunter'];

// Update the game state
setInterval(function(){ game.state.time = game.state.time === "day" ? "night" : "day" }, 10000);

// The connection callback
wss.on("connection", function(ws) {

	// Generate the random player id
	var playerId = Math.random().toString();
	var playerRole = roles[Math.floor(Math.random() * roles.length)];

	// Initlizate the players object
	game.players[playerId] = {};
	game.players[playerId].died = false;
	game.players[playerId].role = playerRole;
	game.players[playerId].killed = 0;

	ws.on('message', function(message) {

		// Push the player object to the players array
		// game.players[playerId] = merge(JSON.parse(message), game.players[playerId]);
		var remotePlayer = JSON.parse(message);
		game.players[playerId].x = remotePlayer.x;
		game.players[playerId].y = remotePlayer.y;

		// console.log(game);

		// Are they touching?
		for (var key1 in game.players){
			for (var key2 in game.players){
				var playerA = game.players[key1];
				var playerB = game.players[key2];
				if ( key1 < key2
					 && playerA.x <= (playerB.x + 32)
					 && playerB.x <= (playerA.x + 32)
					 && playerA.y <= (playerB.y + 32)
					 && playerB.y <= (playerA.y + 32)
					 && !playerA.died
					 && !playerB.died){

					// Two players get touched and died
					playerA.died = true;
					playerA.killed ++; 
					playerB.died = true;
					playerB.killed ++; 

					// Revival the hunters and wolf
					if (game.state.time === "day"){
						if (playerA.role === "hunter") {playerA.died = false; playerB.killed --; }
						if (playerB.role === "hunter") {playerB.died = false; playerA.killed --; }
					} else {
						if (playerA.role === "wolf") {playerA.died = false; playerB.killed --; }
						if (playerB.role === "wolf") {playerB.died = false; playerA.killed --; }
					}
				}
			}
		}

		// Send game and playerId
        ws.send(JSON.stringify(merge(game, {playerId: playerId}) ));
    });

    ws.on("close", function() {
	    delete game.players[playerId];
	})
})
