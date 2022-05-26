// Loading dependencies
const { Client, Intents, Collection, MessageEmbed } = require('discord.js');
const auth = require('./auth.json');
const flagbot = require('./flagbot.json');
// Create a new bot object
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		// Intents.FLAGS.GUILD_PRESENCES
	],
	partials: ['MESSAGE', 'REACTION'],
});

// Loading global variables
var allData = JSON.parse(JSON.stringify(flagbot));

items = Object.keys(allData);
//.forEach((item, i) => console.log(allData[item].name));

var aliasList = new Map();

items.forEach((item, i) =>
	if (allData[item].alias1 != "") {
		aliasList.set(allData[item].alias1, item);
	}
	if (allData[item].alias2 != "") {
		aliasList.set(allData[item].alias2, item);
	}
	if (allData[item].alias3 != "") {
		aliasList.set(allData[item].alias3, item);
	}
	if (allData[item].alias4 != "") {
		aliasList.set(allData[item].alias4, item);
	}
	if (allData[item].alias5 != "") {
		aliasList.set(allData[item].alias5, item);
	}
);





// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
	console.log('Ready!');
	client.user.setActivity("Flagbot Active!");
});

client.on('message', function (m) {
	// bot does not reply to itself
	if (m.author.bot) return;
	
	let ml = m.content.toLowerCase();
	
	if (ml == "^help") help(m.channel);

	
	
});

function help(ch) {
	const emb = new MessageEmbed()
		.setTitle('Help Guide!')
		.setColor('#67b4c2')
		.addField('Commands', '--------------------------------------')
		.addField('^help', "Displays help.", true)
		.setTimestamp();
	ch.send({ embeds: [emb] });
}

client.on("messageReactionAdd", async (reaction, user) => {
	return;
});


client.on('error', console.error);

client.login(auth.token);
