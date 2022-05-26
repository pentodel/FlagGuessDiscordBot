// Loading dependencies
const Discord = require("discord.js");
const config = require('./config.json');
const auth = require('./auth.json');
const flagbot = require('./flagbot.json');
// Create a new bot object
const client = new Discord.Client();

// Loading global variables
//var allData = JSON.parse(JSON.stringify(flagbot));

//console.log(allData["1"].name);




// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
	console.log('Ready!');
	client.user.setActivity("Flagbot Active!");
});

client.on('message', function (m) {
	// bot does not reply to itself
	if (mm.author.bot) return;

	
});

client.on("messageReactionAdd", async (reaction, user) => {
	return;
});


client.on('error', console.error);

client.login(auth.token);
