const Discord = require('discord.js');
const { Client, Intents, WebhookClient } = require('discord.js');
const fs = require("fs");
const util = require("util");
const readdir = util.promisify(fs.readdir);

const client = new Client({
  intents:
    [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MEMBERS,
      Intents.FLAGS.GUILD_BANS,
      Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
      Intents.FLAGS.GUILD_INTEGRATIONS,
      Intents.FLAGS.GUILD_WEBHOOKS,
      Intents.FLAGS.GUILD_INVITES,
      Intents.FLAGS.GUILD_VOICE_STATES,
      Intents.FLAGS.GUILD_PRESENCES,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      Intents.FLAGS.GUILD_MESSAGE_TYPING
    ]
});

const interactionCommands = [];


client.settings = {
  "owner": "OWNER DISCORD ID HERE",
  "color": "YOUR EMBED COLOR (like eb1c5a)"
};

async function startUp() {

  client.events = new Discord.Collection();
  client.commands = new Discord.Collection();
  client.logger = require("./modules/Logger.js");
  client.config = require("./config.json");

  //Events
  let eventFiles = fs.readdirSync('./events/').filter(file => file.endsWith('.js'));
  for (let eventFile of eventFiles) {
    let event = require(`./events/${eventFile}`);
    let eventName = eventFile.split(".")[0];
    client.on(eventName, event.bind(null, client));
  }

  //Commands
  let commandCategories = await readdir("./commands/");
  commandCategories.forEach(commandCategory => {
    fs.readdir(`./commands/${commandCategory}/`, (err, commandCategoryFiles) => {
      if (err) console.error(err);
      for (let commandFile of commandCategoryFiles) {
        let command = require(`./commands/${commandCategory}/${commandFile}`);
        client.commands.set(command.interaction ? command.interaction.name : command.name, command);
        if (command.interaction)
          interactionCommands.push(command.interaction);
      };
    });
  });

  // Connect to Mongoose
  const mongoose = require('mongoose');
  client.database = require('./Mongoose/Mongoose.js');
  mongoose.connect(client.config.mongooseToken, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    client.logger.log('Connected to MongoDB');
  }).catch((err) => {
    console.log('Unable to connect to MongoDB Database.\nError: ' + err);
  });

  await client.login(client.config.token);

}; startUp();

client.on("ready", async () => {

  const { REST } = require('@discordjs/rest');
  const { Routes } = require('discord-api-types/v9');

  const rest = new REST({ version: '9' }).setToken(client.config.token);
  await rest.put(Routes.applicationCommands(client.user.id), { body: interactionCommands });

  client.logger.ready("Bot hazırdır anaam")

});
