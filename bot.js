// Loading dependencies
const { Client, Intents, Collection, MessageEmbed, MessageAttachment } = require('discord.js');
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

// SETUP
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

var currentBank = setRegion("all");

class State {
	static On = new State("on");
	static Off = new State("off");
	static Served = new State("served");
	static Waiting = new State("waiting");
	
	constructor(name) {
		this.name = name;
	}
}

var currentState = State.On;

var waitCountdown = 0;
var currentFlag = null;
var streak = 0;



client.once('ready', () => {
	console.log('Ready!');
	client.user.setActivity("Flagbot Active!");
});

client.on('message', function (m) {
	// bot does not reply to itself or any other bot
	if (m.author.bot) return;
	
	let ml = m.content.toLowerCase();
	let ch = m.channel;
		
	let messagewords = ml.split(" ");
	let command = messagewords[0];
	messagewords.shift(); // remove the first item
	let content = messagewords.join(" ").trim().toLowerCase();
	
	if (waitCountdown == 1) {
		waitCountdown = 0;
		currentState = State.On;
	} else if (waitCountdown > 1) {
		waitCountdown--;
	}
	
	switch(command) {
		case "^help":
		case "^h":
			help(ch);
			break;
		
		case "^data":
		case "^d":
			if (currentState == State.Served) {
				ch.send("Cannot use data command while waiting for a guess!");
				break;
			}
			let id = getid(content);
			if (id == undefined) {
				m.channel.send("Country not found!");
				break;
			}
			countrydata(id, ch);
			break;
			
		case "^guess":
		case "^g":
			if (currentState != State.Served) {
				ch.send("There's no flag to guess!");
				break;
			}
			guess(getid(content),ch);
			break;
		case "^streak":
			ch.send(`The current streak is ${streak}!`);
			break;
	}
	
	console.log(currentState.toString());
	if (currentState == State.On && Math.floor(Math.random() * 10) == 0) {
		console.log("random");
		serve(ch);
	}
	
	
});

function help(ch) {
	let emb = new MessageEmbed()
		.setTitle('Help Guide!')
		.setColor('#67b4c2')
		.addField('Commands', '--------------------------------------')
		.addField('^help, ^h', "Sends help embed.", true)
		.addField('^data, ^d [country]', "Sends country info.", true)
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
		aliases = country.alias.toString();
	}
	
	// let image = 'flag (' + id + ')'
	// const attachment = new MessageAttachment(`./images/${image}`, `${image}`);
	
	let emb = new MessageEmbed()
		.setTitle(country.name)
		.setColor('#000000')
		.addField('Sovereign', country.sovereign.toString(), true)
		.addField('Continent', country.continent, true)
		.addField('Subregion', country.subregion, true)
		.addField('Aliases', aliases, true)
		.setImage(country.url)
		.setTimestamp();
		
	// .setImage(`attachment://${image}.png`)
	// ch.send({ embeds: [emb], files: [{ attachment: `./images/${image}.png`, name: `${image}.png` }] });
	
	ch.send({embeds: [emb]});
}

function countryguessemb(id, ch) {
	let country = allData[id];
	let embedcolor = "#" + Math.floor(Math.random()*16777215).toString(16);
	
	let emb = new MessageEmbed()
		.setTitle("Guess the country!")
		.setDescription("Guess with `^guess [country]`!")
		.setColor(embedcolor)
		.setImage(country.url)
		.setTimestamp();
		
	ch.send({embeds: [emb]});
}

function setRegion(reg) {
	let arrayBank = []
	if (reg == "all") {
		Object.keys(allData).forEach((curr) => {
			arrayBank.push(curr);
		})
		return arrayBank;
	} else {
		Object.keys(allData).forEach((curr) => {
			if (allData[curr].continent.toLowerCase() == reg ||
				allData[curr].subregion.toLowerCase() == reg) {
				arrayBank.push(curr);
			}
		})
		return arrayBank;
	}
}

function serve(ch) {
	currentFlag = currentBank[Math.floor(Math.random() * currentBank.length)];
	countryguessemb(currentFlag, ch);
	currentState = State.Served;
	waitCountdown = 20;
}

function guess(id, ch) {
	if (id == currentFlag) {
		ch.send("This is correct! Congratulations! 🥳");
		if (waitCountdown > 0) {
			currentState = State.Waiting;
		} else {
			currentState = State.On;
		}
		streak++;
	} else {
		ch.send("This guess is not correct!");
		streak = 0;
	}
}

client.on("messageReactionAdd", async (reaction, user) => {
	return;
});


client.on('error', console.error);

client.login(auth.token);
