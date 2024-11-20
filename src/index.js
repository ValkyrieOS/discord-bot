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
const { loadConfig, saveConfig } = require('./utils/configManager');
const { loadVips } = require('./utils/vipManager');

// Inicializar variables globales
if (!global.ticketConfig) global.ticketConfig = {};
if (!global.activeTickets) global.activeTickets = new Map();
if (!global.serverConfig) global.serverConfig = new Map();
if (!global.suggestions) global.suggestions = new Map();
if (!global.antiraidConfig) global.antiraidConfig = new Map();
if (!global.logsChannels) global.logsChannels = new Map();
if (!global.prefixConfig) global.prefixConfig = new Map();
if (!global.autoRoleConfig) global.autoRoleConfig = new Map();

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
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessageTyping
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.GuildMember,
        Partials.User,
        Partials.ThreadMember
    ]
});

// Colecciones para comandos y eventos
client.commands = new Collection();

// Cargar comandos
const commandFiles = fs.readdirSync('./src/slashCommands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./slashCommands/${file}`);
    client.commands.set(command.data.name, command);
}

// Cargar configuraciones al iniciar
async function loadConfigurations() {
    try {
        const config = await loadConfig();
        
        // Cargar configuración de tickets
        if (config.tickets) {
            global.ticketConfig = config.tickets;
        }

        // Cargar prefijos
        if (config.prefix) {
            global.prefixConfig = new Map(Object.entries(config.prefix));
        }

        // Cargar configuración de servidores y sugerencias
        if (config.suggestions) {
            global.serverConfig = new Map();
            for (const [guildId, data] of Object.entries(config.suggestions)) {
                global.serverConfig.set(guildId, {
                    suggestionsChannel: data.channel
                });
            }
        }

        // Cargar logs
        if (config.logs) {
            global.logsChannels = new Map(Object.entries(config.logs));
        }

        // Cargar autorole
        if (config.autorole) {
            global.autoRoleConfig = new Map(Object.entries(config.autorole));
        }

        // Cargar usuarios VIP desde el archivo JSON
        await loadVips();
        
        console.log('Configuraciones cargadas exitosamente.');
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
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        // Verificar permisos VIP
        const { isVIP, isCommandFree } = require('./utils/permissions');
        if (!isCommandFree(command.data.name) && !isVIP(interaction.user.id)) {
            return await interaction.reply({
                content: '```diff\n- ❌ Este comando solo está disponible para usuarios VIP.\n```',
                ephemeral: true
            });
        }

        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: '```diff\n- ❌ Hubo un error al ejecutar este comando!\n```',
            ephemeral: true
        }).catch(console.error);
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

// Eventos de logs
client.on('channelCreate', async channel => {
    if (!channel.guild) return;
    
    const logChannelId = global.logsChannels.get(channel.guild.id);
    if (!logChannelId) return;
    
    const logChannel = channel.guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    try {
        const embed = new EmbedBuilder()
            .setTitle('📝 Canal Creado')
            .setColor('#00ff00')
            .addFields([
                { name: 'Nombre', value: channel.name || 'N/A', inline: true },
                { name: 'Tipo', value: channel.type.toString() || 'N/A', inline: true },
                { name: 'ID', value: channel.id || 'N/A', inline: true }
            ])
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error al enviar log de canal creado:', error);
    }
});

client.on('channelDelete', async channel => {
    if (!channel.guild) return;
    
    const logChannelId = global.logsChannels.get(channel.guild.id);
    if (!logChannelId) return;
    
    const logChannel = channel.guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    try {
        const embed = new EmbedBuilder()
            .setTitle('🗑️ Canal Eliminado')
            .setColor('#ff0000')
            .addFields([
                { name: 'Nombre', value: channel.name || 'N/A', inline: true },
                { name: 'Tipo', value: channel.type.toString() || 'N/A', inline: true },
                { name: 'ID', value: channel.id || 'N/A', inline: true }
            ])
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error al enviar log de canal eliminado:', error);
    }
});

client.on('messageDelete', async message => {
    if (!message.guild || message.author?.bot) return;
    
    const logChannelId = global.logsChannels.get(message.guild.id);
    if (!logChannelId) return;
    
    const logChannel = message.guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    try {
        const embed = new EmbedBuilder()
            .setTitle('🗑️ Mensaje Eliminado')
            .setColor('#ff0000')
            .addFields([
                { name: 'Autor', value: `${message.author}` || 'Desconocido', inline: true },
                { name: 'Canal', value: `${message.channel}` || 'Desconocido', inline: true },
                { name: 'Contenido', value: message.content || 'Sin contenido' }
            ])
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error al enviar log de mensaje eliminado:', error);
    }
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    
    const logChannelId = global.logsChannels.get(oldMessage.guild.id);
    if (!logChannelId) return;
    
    const logChannel = oldMessage.guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    try {
        const embed = new EmbedBuilder()
            .setTitle('✏️ Mensaje Editado')
            .setColor('#ffff00')
            .addFields([
                { name: 'Autor', value: `${oldMessage.author}` || 'Desconocido', inline: true },
                { name: 'Canal', value: `${oldMessage.channel}` || 'Desconocido', inline: true },
                { name: 'Antes', value: oldMessage.content || 'Sin contenido' },
                { name: 'Después', value: newMessage.content || 'Sin contenido' }
            ])
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error al enviar log de mensaje editado:', error);
    }
});

client.on('guildMemberAdd', async member => {
    const logChannelId = global.logsChannels.get(member.guild.id);
    if (!logChannelId) return;
    
    const logChannel = member.guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    try {
        const embed = new EmbedBuilder()
            .setTitle('👋 Miembro Nuevo')
            .setColor('#00ff00')
            .addFields([
                { name: 'Usuario', value: `${member.user}` || 'Desconocido', inline: true },
                { name: 'ID', value: member.user.id || 'Desconocido', inline: true },
                { name: 'Cuenta Creada', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
            ])
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error al enviar log de miembro nuevo:', error);
    }
});

client.on('guildMemberRemove', async member => {
    const logChannelId = global.logsChannels.get(member.guild.id);
    if (!logChannelId) return;
    
    const logChannel = member.guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    try {
        const embed = new EmbedBuilder()
            .setTitle('👋 Miembro Salió')
            .setColor('#ff0000')
            .addFields([
                { name: 'Usuario', value: `${member.user}` || 'Desconocido', inline: true },
                { name: 'ID', value: member.user.id || 'Desconocido', inline: true },
                { name: 'Se unió', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true }
            ])
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error al enviar log de miembro salió:', error);
    }
});

// Manejo de cierre del proceso
process.on('SIGINT', async () => {
    process.exit(0);
});

process.on('SIGTERM', async () => {
    process.exit(0);
});

// Iniciar el bot
client.login(config.token);