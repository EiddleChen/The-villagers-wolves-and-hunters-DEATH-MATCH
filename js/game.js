// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

// Background image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function () {
	bgReady = true;
};
bgImage.src = "images/background.png";

// Nightoverlay image
var noReady = false;
var noImage = new Image();
noImage.onload = function () {
	noReady = true;
};
noImage.src = "images/nightoverlay.png";

// Hunter image
var hunterReady = false;
var hunterImage = new Image();
hunterImage.onload = function () {
	hunterReady = true;
};
hunterImage.src = "images/hunter.png";

// Wolf image
var wolfReady = false;
var wolfImage = new Image();
wolfImage.onload = function () {
	wolfReady = true;
};
wolfImage.src = "images/wolf.png";

// Villager image
var villagerReady = false;
var villagerImage = new Image();
villagerImage.onload = function () {
	villagerReady = true;
};
villagerImage.src = "images/villager.png";


// Selected image
var selectedReady = false;
var selectedImage = new Image();
selectedImage.onload = function () {
	selectedReady = true;
};
selectedImage.src = "images/selected.png";

// Game objects
var player = {
	speed: 256, // movement in pixels per second
};

var game = {};

// Handle keyboard controls
var keysDown = {};

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);

// Reset the game when the player catches a wolf
var reset = function () {
	player.x = 32 + (Math.random() * (canvas.width - 64));
	player.y = 32 + (Math.random() * (canvas.height - 64));
};


// Update game objects
var update = function (modifier) {

	if (game.playerId) {

		// Get the playerId
		var playerId = game.playerId;

		// Update player information
		player.role = game.players[playerId].role;
		player.killed = game.players[playerId].killed;
		player.died = game.players[playerId].died;

		// Check if player died and move
		if (game.players && game.players[playerId] && !game.players[playerId].died){
			if (38 in keysDown) { // Player holding up
				player.y -= player.speed * modifier;
			}
			if (40 in keysDown) { // Player holding down
				player.y += player.speed * modifier;
			}
			if (37 in keysDown) { // Player holding left
				player.x -= player.speed * modifier;
			}
			if (39 in keysDown) { // Player holding right
				player.x += player.speed * modifier;
			}
			player.x = player.x < 0 ? 0 : player.x;
			player.y = player.y < 0 ? 0 : player.y;
			player.x = player.x > canvas.width - 32 ? canvas.width - 32: player.x; 
			player.y = player.y > canvas.height - 32 ? canvas.height - 32: player.y;
		}
	}
};

// Draw everything
var render = function () {

	if (bgReady) {
		ctx.drawImage(bgImage, 0, 0);
	}

	// Score
	ctx.fillStyle = "rgb(250, 250, 250)";
	ctx.font = "12px Helvetica";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText("Your role: " + player.role, 32, 32);
	ctx.fillText("You killed: " + player.killed, 32, 56);
	if (game.players) {
		ctx.fillText("Players: " + Object.keys(game.players).length, 32, 80);
	}

	if (player.died) {
		ctx.fillStyle = "rgb(250, 250, 250)";
		ctx.font = "36px Helvetica";
		ctx.textAlign = "center";
		ctx.textBaseline = "top";
		ctx.fillText("Game over!", 250, 150);
		ctx.fillText("Refresh to replay.", 250, 240);
	}

	if (hunterReady && wolfReady && villagerReady && selectedReady && game.players) {
		for (var key in game.players){
			if (!game.players[key].died){

				// Player role is hunter
				if (player.role == "hunter"){
					switch (game.players[key].role){
						case "hunter":
							ctx.drawImage(hunterImage, game.players[key].x, game.players[key].y);
							break;
						case "wolf":
							ctx.drawImage(villagerImage, game.players[key].x, game.players[key].y);
							break;
						case "villager":
							ctx.drawImage(villagerImage, game.players[key].x, game.players[key].y);
							break;
					}
				}	

				// Player role is wolf
				if (player.role == "wolf"){
					switch (game.players[key].role){
						case "hunter":
							ctx.drawImage(villagerImage, game.players[key].x, game.players[key].y);
							break;
						case "wolf":
							ctx.drawImage(wolfImage, game.players[key].x, game.players[key].y);
							break;
						case "villager":
							ctx.drawImage(villagerImage, game.players[key].x, game.players[key].y);
							break;
					}
				}	

				// Player role is villager
				if (player.role == "villager"){
					switch (game.players[key].role){
						case "hunter":
							ctx.drawImage(villagerImage, game.players[key].x, game.players[key].y);
							break;
						case "wolf":
							ctx.drawImage(villagerImage, game.players[key].x, game.players[key].y);
							break;
						case "villager":
							ctx.drawImage(villagerImage, game.players[key].x, game.players[key].y);
							break;
					}
				}	

				// Render the current player
				if (key === game.playerId) {
					ctx.drawImage(selectedImage, game.players[key].x, game.players[key].y);	
				}
			}
		}
	}

	if (noReady && game.state && game.state.time === "night") {
		ctx.drawImage(noImage, 0, 0);
	}
};

// The main game loop
var main = function () {
	var now = Date.now();
	var delta = now - then;

	update(delta / 1000);
	render();

	then = now;

	// Request to do this again ASAP
	requestAnimationFrame(main);
};

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
// var host = location.origin.replace(/^http/, 'ws')
var host = "ws://localhost:5000";
var ws = new WebSocket(host);
var then;

ws.onopen = function() {
	setInterval(function(){
		ws.send(JSON.stringify(player));
	}, 0);
	then = Date.now();
	reset();
	main();
};
ws.onmessage = function(event) {
	game = JSON.parse(event.data);
};

