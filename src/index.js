const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.AutoModerationExecution,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

// Colecciones para comandos y eventos
client.commands = new Collection();
client.events = new Collection();

// Cargar comandos
const commandFiles = fs.readdirSync('./src/slashCommands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./slashCommands/${file}`);
    client.commands.set(command.data.name, command);
}

// Manejar interacciones de comandos
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        console.log(`[Command] ${interaction.user.tag} ejecutó /${interaction.commandName}`);
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        await interaction.reply({ 
            content: '¡Hubo un error al ejecutar este comando!', 
            ephemeral: true 
        });
    }
});

client.on('ready', () => {
    console.log(`Bot está listo como ${client.user.tag}!`);
    client.user.setActivity('Discord Bots', { type: 'WATCHING' });
});

client.login(config.token);