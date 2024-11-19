const { 
    Client, 
    Collection, 
    GatewayIntentBits, 
    Partials, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits, 
    ChannelType, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle 
} = require('discord.js');
const { createTranscript } = require('discord-html-transcripts');
const fs = require('fs');
const fsPromises = fs.promises;
const config = require('../config.json');
const path = require('path');

// Inicializar variables globales
if (!global.ticketConfig) global.ticketConfig = {};
if (!global.activeTickets) global.activeTickets = new Map();
if (!global.serverConfig) global.serverConfig = new Map();
if (!global.suggestions) global.suggestions = new Map();
if (!global.antiraidConfig) global.antiraidConfig = new Map();
if (!global.logsChannels) global.logsChannels = new Map();
if (!global.prefixConfig) global.prefixConfig = new Map();

// Inicializar cliente
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
        GatewayIntentBits.GuildInvites
    ],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

// Colecciones para comandos y eventos
client.commands = new Collection();

// Cargar comandos
const commandFiles = fs.readdirSync('./src/slashCommands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./slashCommands/${file}`);
    client.commands.set(command.data.name, command);
}

// Función para guardar configuraciones
async function saveConfigurations() {
    try {
        const configPath = path.join(__dirname, './data/config.json');
        const configDir = path.dirname(configPath);

        await fsPromises.mkdir(configDir, { recursive: true });

        const configToSave = {
            ticketConfig: global.ticketConfig,
            prefixConfig: Object.fromEntries(global.prefixConfig),
            serverConfig: Object.fromEntries(global.serverConfig),
            logsChannels: Object.fromEntries(global.logsChannels),
            autoRoleConfig: Object.fromEntries(global.autoRoleConfig || new Map())
        };

        await fsPromises.writeFile(configPath, JSON.stringify(configToSave, null, 2));
        console.log('Configuraciones guardadas exitosamente.');
    } catch (error) {
        console.error('Error al guardar configuraciones:', error);
    }
}

// Cargar configuraciones al iniciar
async function loadConfigurations() {
    try {
        const configPath = path.join(__dirname, './data/config.json');
        if (fs.existsSync(configPath)) {
            const data = await fsPromises.readFile(configPath, 'utf-8');
            const savedConfig = JSON.parse(data);
            
            global.ticketConfig = savedConfig.ticketConfig || {};
            global.prefixConfig = new Map(Object.entries(savedConfig.prefixConfig || {}));
            global.serverConfig = new Map(Object.entries(savedConfig.serverConfig || {}));
            global.logsChannels = new Map(Object.entries(savedConfig.logsChannels || {}));
            global.autoRoleConfig = new Map(Object.entries(savedConfig.autoRoleConfig || {}));
            
            console.log('Configuraciones cargadas exitosamente.');
        }
    } catch (error) {
        console.error('Error al cargar configuraciones:', error);
    }
}

// Eventos del cliente
client.on('ready', async () => {
    console.log(`Bot está listo como ${client.user.tag}!`);
    client.user.setActivity('Discord Bots', { type: 'WATCHING' });
    await loadConfigurations();
});

// Manejar comandos e interacciones
client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            await command.execute(interaction);
        } else if (interaction.isStringSelectMenu() && interaction.customId === 'help_menu') {
            const command = client.commands.get('help');
            if (!command) return;
            await command.execute(interaction);
        }
    } catch (error) {
        console.error(error);
        const errorMessage = '```diff\n- ❌ ¡Hubo un error al ejecutar este comando!\n```';
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
});

// Sistema Anti-raid
client.on('guildMemberAdd', async member => {
    const config = global.antiraidConfig.get(member.guild.id);
    if (!config || !config.enabled) return;

    const now = Date.now();
    config.recentJoins = config.recentJoins.filter(join => now - join < config.seconds * 1000);
    config.recentJoins.push(now);

    if (config.recentJoins.length >= config.joins) {
        // Implementar lógica anti-raid aquí
        console.log(`Raid detectado en ${member.guild.name}`);
    }
});

// Añadir el evento guildMemberAdd para el autorole
client.on('guildMemberAdd', async member => {
    try {
        // Verificar configuración de autorole
        const roleId = global.autoRoleConfig?.get(member.guild.id);
        if (!roleId || member.user.bot) return;

        const role = await member.guild.roles.fetch(roleId);
        if (!role) return;

        // Asignar el rol
        await member.roles.add(role);
    } catch (error) {
        console.error('Error al aplicar autorole:', error);
    }
});

// Manejo de cierre del proceso
process.on('SIGINT', async () => {
    await saveConfigurations();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await saveConfigurations();
    process.exit(0);
});

// Iniciar el bot
client.login(config.token);