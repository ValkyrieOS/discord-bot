const { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
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

// Añadir después de las declaraciones de intents
const recentJoins = new Map();

// Añadir este evento después del evento interactionCreate
client.on('guildMemberAdd', async member => {
    const config = global.antiraidConfig.get(member.guild.id);
    if (!config || !config.enabled) return;

    const now = Date.now();
    config.recentJoins = config.recentJoins.filter(join => now - join < config.seconds * 1000);
    config.recentJoins.push(now);

    if (config.recentJoins.length >= config.joins) {
        // Se detectó un raid
        const embed = new EmbedBuilder()
            .setTitle('🚨 ¡RAID DETECTADO!')
            .setColor('#FF0000')
            .setDescription(`Se ha detectado un posible raid (${config.recentJoins.length} uniones en ${config.seconds} segundos)`)
            .setTimestamp();

        // Ejecutar acción configurada
        switch (config.action) {
            case 'lock': {
                // Bloquear todos los canales
                const channels = await member.guild.channels.fetch();
                channels.forEach(async channel => {
                    if (channel.manageable) {
                        await channel.permissionOverwrites.edit(member.guild.roles.everyone, {
                            SendMessages: false,
                            Connect: false
                        });
                    }
                });
                embed.addFields({ name: '🔒 Acción tomada', value: 'Servidor bloqueado temporalmente' });
                break;
            }
            case 'kick': {
                // Kickear usuarios recientes
                const recentMembers = await member.guild.members.fetch({
                    time: config.seconds * 1000
                });
                recentMembers.forEach(async m => {
                    if (m.kickable && m.joinedTimestamp > now - (config.seconds * 1000)) {
                        await m.kick('Anti-raid: Posible raid detectado');
                    }
                });
                embed.addFields({ name: '🚫 Acción tomada', value: 'Usuarios recientes expulsados' });
                break;
            }
            case 'ban': {
                // Banear usuarios recientes
                const recentMembers = await member.guild.members.fetch({
                    time: config.seconds * 1000
                });
                recentMembers.forEach(async m => {
                    if (m.bannable && m.joinedTimestamp > now - (config.seconds * 1000)) {
                        await m.ban({ reason: 'Anti-raid: Posible raid detectado' });
                    }
                });
                embed.addFields({ name: '🔨 Acción tomada', value: 'Usuarios recientes baneados' });
                break;
            }
        }

        // Enviar notificación al canal de logs
        try {
            const canalLogsId = global.logsChannels.get(member.guild.id);
            if (canalLogsId) {
                const canalLogs = await member.guild.channels.fetch(canalLogsId);
                if (canalLogs) {
                    await canalLogs.send({ embeds: [embed] });
                }
            }
        } catch (error) {
            console.log('No se pudo enviar al canal de logs');
        }

        // Limpiar la lista de uniones recientes
        config.recentJoins = [];
    }
});