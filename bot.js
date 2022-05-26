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

var items = Object.keys(allData);
//.forEach((item, i) => console.log(allData[item].name));

var aliasList = new Map();

items.forEach((id) => {
	aliasList.set(allData[id].name.toLowerCase(), id);
	
	if (Array.isArray(allData[id].alias)) {
		allData[id].alias.forEach((al) => {
			aliasList.set(al.toLowerCase(),id);
		});
	}
});





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
	
	let messagewords = ml.split(" ");
	
	if (messagewords[0] == "^data") {
		messagewords.shift(); // remove the first item
		let alias = messagewords.join(" ");
		let id = getid(alias);
		if (id == undefined) {
			m.channel.send("Country not found!");
			return;
		}
		countrydata(id, m.channel);
		return;
	}
	
	
});

function help(ch) {
	let emb = new MessageEmbed()
		.setTitle('Help Guide!')
		.setColor('#67b4c2')
		.addField('Commands', '--------------------------------------')
		.addField('^help', "Displays help.", true)
		.setTimestamp();
	ch.send({ embeds: [emb] });
}

function getid(alias) {
	return aliasList.get(alias);
}

function countrydata(id, ch) {
	let country = allData[id];	
	let aliases = "None.";
	if (country.alias != "") {
		aliases = "";
		country.alias.forEach((e) => {
			aliases += e + ", ";
		});
	}
	let emb = new MessageEmbed()
		.setTitle(country.name)
		.setColor('#000000')
		.setImage(country.url)
		.addField('Sovereign', country.sovereign.toString(), true)
		.addField('Continent', country.continent, true)
		.addField('Subregion', country.subregion, true)
		.addField('Aliases', aliases, true)
		.setTimestamp();
	ch.send({ embeds: [emb] });
}

client.on("messageReactionAdd", async (reaction, user) => {
	return;
});


client.on('error', console.error);

client.login(auth.token);
