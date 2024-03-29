// Loading dependencies
const { Client, Intents, Collection, MessageEmbed, MessageAttachment } = require('discord.js');
const auth = require('./auth.json');
var persistent = require('./persistent.json');
const flagbot = require('./flagbot.json');
const fs = require('fs');
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
var persistentData = JSON.parse(JSON.stringify(persistent));

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

var currentBank = setRegion("all", false);

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
var stateSaver = currentState;

var waitCountdown = 0;
var periodic = persistentData.periodic;
var waitNo = persistentData.waitNo;
var chance = persistentData.chance;
var currentFlag = persistentData.currentFlag;
var streak = persistentData.streak;
var hintLevel = 0;


var currentRegion = "all";
var sovereignOnly = false; // false to access all, true to only sovereign
var regions = ["all", "africa", "asia", "europe", "north america", "south america", "oceania", "misc", "north africa", "south africa", "east africa", "west africa", "central africa", "central asia", "south asia", "southeast asia", "east asia", "west asia", "north europe", "south europe", "east europe", "west europe", "contiguous north america", "caribbean", "upper south america", "middle south america", "lower south america", "australasia", "melanesia", "micronesia", "polynesia"];


client.once('ready', () => {
	console.log('Ready!');
	client.user.setActivity("Flagbot Active!");
});

client.on('messageCreate', function (m) {
	// bot does not reply to itself or any other bot
	if (m.author.bot) return;
	console.log(currentState.name + " - " + periodic);
	
	let ml = m.content.toLowerCase();
	let ch = m.channel;
		
	let messagewords = ml.split(" ");
	let command = messagewords[0];
	messagewords.shift(); // remove the first item
	let content = messagewords.join(" ").trim();
	
	if (waitCountdown == 1) {
		waitCountdown = 0;
		if (currentState == State.Waiting) currentState = State.On;
	} else if (waitCountdown > 1) {
		waitCountdown--;
	}
	if (currentState == State.Served && periodic > 0) {
		periodic--;
	}
	
	switch(command) {
		case "^help":
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
			
		case "^reshow":
		case "^r":
			if (currentState != State.Served) {
				ch.send("There is no flag currently waiting for a guess!");
				break;
			}
			countryguessemb(currentFlag, ch);
			break;

		case "^checkstate":
			if (currentState == State.Served) {
				ch.send("There is a flag currently waiting for a guess! Use `^reshow` to send it again!");
				break;
			} else if (currentState == State.On || currentState == State.Waiting) {
				ch.send("No flag is currently waiting for a guess! Send messages to spawn one or use `^force` to get one now!");
				break;
			} else {
				ch.send("Current state is off! No flags will be sent unless forced.");
			}
			break;
			
		case "^force":
			if (currentState == State.Served) {
				ch.send("There is a flag currently waiting for a guess! Use `^reshow` to send it again!");
			} else {
				serve(ch);
			}
			break;
			
		case "^turnoff":
			if (currentState == State.Off) {
				ch.send("Random flags are already off!");
				break;
			}
			stateSaver = currentState;
			currentState = State.Off;
			ch.send("Random flags have been turned off!");
			break;
		
		case "^turnon":
			if (currentState != State.Off) {
				ch.send("Random flags are already sending!");
				break;
			}
			currentState = stateSaver;
			ch.send("Random flags have been turned on!");
			break;
				
		case "^changeregion":
			if (regions.includes(content)) {
				currentRegion = content;
				currentBank = setRegion(currentRegion, sovereignOnly);
				ch.send(`Region has been changed to ${currentRegion}!`);
				break;
			} else {
				ch.send(`${content} is not a region!`);
			}
			break;
				
		case "^sovereignonly":
			if (sovereignOnly) {
				ch.send("Random flags already set to only be sovereign!");
				break;
			} else {
				ch.send("Set to only show flags that are sovereign!");
				sovereignOnly = true;
				currentBank = setRegion(currentRegion, sovereignOnly);				
			}
			break;
				
		case "^sovereignoff":
			if (!sovereignOnly) {
				ch.send("Random flags already set to ignore sovereign!");
				break;
			} else {
				ch.send("Set to show flags regardless of sovereignty!");
				sovereignOnly = false;
				currentBank = setRegion(currentRegion, sovereignOnly);				
			}
			break;
		
		case "^checkregion":
			ch.send(`Region: ${currentRegion}, Sovereignty: ${sovereignOnly}.`);
			break;
		
		case "^regionlist":
			ch.send(regions.toString());
			break;
			
		case "^hint":
		case "^h":
			if (currentState != State.Served) {
				ch.send("There is no flag to guess!");
				break;
			}
			
			if (hintLevel == 0) {
				ch.send(`This flag is from the region of ${allData[currentFlag].continent} and the subregion of ${allData[currentFlag].subregion}.`);
			} else {
				let namePattern = getNamePattern(allData[currentFlag].name, hintLevel - 1);
				ch.send(`The name pattern of this country is ${namePattern}.`);
			}
			hintLevel++;
			break;
		case "^setwaitcountdown":
			let newwait = parseInt(content);
			if (newwait == NaN) {
				ch.send("Not a number.");
				break;
			}
			waitNo = newwait;
			persistentData.waitNo = newwait;
			if (waitCountdown > newwait) waitCountdown = newwait;
			writePersistent();
			break;
			
		case "^setspawnchance":
			let newchance = parseInt(content);
			if (newchance == NaN) {
				ch.send("Not a number.");
				break;
			}
			chance = newchance;
			persistentData.chance = newchance;
			writePersistent();
			break;
			
			
	}
	
	if (currentState == State.On && Math.floor(Math.random() * chance) == 0) {
		serve(ch);
	} else if (currentState == State.Served && periodic == 0) {
		countryguessemb(currentFlag, ch);
		periodic = 20;
	}
});

function writePersistent() {
	persistent = JSON.stringify(persistentData)
	fs.writeFile('persistent.json', persistent, (err) => {
		if (err) {
			throw err;
		}
		console.log("Persistent data written.");
	});
	return;
}

function help(ch) {
	let emb = new MessageEmbed()
		.setTitle('Help Guide!')
		.setColor('#67b4c2')
		.addField('Commands', '--------------------------------------')
		.addField('^help', "Sends help embed.", true)
		.addField('^data, ^d [country]', "Sends country info.", true)
		.addField('^guess, ^g [country]', "Guess a country name.", true)
		.addField('^streak', "Show current streak data.", true)
		.addField('^reshow, ^r', "If a flag hasn't been guessed yet, show it again.", true)
		.addField('^checkstate', "Show current state of random flags.", true)
		.addField('^changeregion `[region]`', "Change the region from which flags can appear.", true)
		.addField('^regionlist', "Send the list of available regions.", true)
		.addField('^sovereignonly', "Make it so that only flags from sovereign nations appear.", true)
		.addField('^sovereignoff', "Make it so that all flags appear regardless of sovereignty.", true)
		.addField('^checkregion', "Display what region the bot is set to and if non-sovereign nations ill be shown.", true)
		.addField('^force', "Force send a new flag. Will reset streak if there is a flag that needs to be guessed.", true)
		.addField('^turnon', 'Turn on random flags.', true)
		.addField('^turnoff', 'Turn off random flags.', true)
		.addField('^hint, ^h', 'Get a hint for the current flag!', true)
		.setTimestamp();
	ch.send({ embeds: [emb] });
	return;
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

function setRegion(reg, sov) {
	let arrayBank = []
	if (reg == "all") {
		Object.keys(allData).forEach((curr) => {
			if (!sov) {
				arrayBank.push(curr);
			} else if (allData[curr].sovereign == true) {
				arrayBank.push(curr);
			}
		})
	} else {
		Object.keys(allData).forEach((curr) => {
			if (!sov) {
				if (allData[curr].continent.toLowerCase() == reg ||
					allData[curr].subregion.toLowerCase() == reg) {
					arrayBank.push(curr);
				}
			} else if (allData[curr].sovereign == true) {
				if (allData[curr].continent.toLowerCase() == reg ||
					allData[curr].subregion.toLowerCase() == reg) {
					arrayBank.push(curr);
				}
			}
		})
	}
	return arrayBank;
}

function serve(ch) {
	currentFlag = currentBank[Math.floor(Math.random() * currentBank.length)];
	countryguessemb(currentFlag, ch);
	currentState = State.Served;
	waitCountdown = waitNo;
	periodic = 20;
	hintLevel = 0;
	persistentData.currentFlag = currentFlag;
	persistentData.periodic = periodic;
	writePersistent();
}

function guess(id, ch) {
	if (id == currentFlag) {
		ch.send(`${allData[currentFlag].name} is correct! Congratulations! 🥳`);
		if (waitCountdown > 0) {
			currentState = State.Waiting;
		} else {
			currentState = State.On;
		}
		streak++;
		persistentData.streak = streak;
		persistentData.currentFlag = null;
		persistentData.periodic = 0;
		writePersistent();
	} else {
		ch.send("This guess is not correct! 😔");
		streak = 0;
	}
}

function getNamePattern(name, characters) {
	let charShowList = [];
	if (characters < name.length) {
		for (let i = 0; i < name.length; i++) {
			charShowList.push(i);
		}
		
		if (characters > 0) {
			charShowList.shift();
			characters--;
			for (let i = 0; i < characters; i++) {
				charShowList.splice(Math.floor(Math.random() * charShowList.length), 1);
			}
		}
	}
	
	let newString = "`";
	
	for (let i = 0; i < name.length; i++) {
		let c = name.charAt(i);
		if (c == ' ') newString += ' ';
		else if (!charShowList.includes(i)) {
			newString += c;
		} else {
			newString += "_";
		}
	}
	
	newString += "`";
	return newString;
}

client.on("messageReactionAdd", async (reaction, user) => {
	return;
});


client.on('error', console.error);

client.login(auth.token);
