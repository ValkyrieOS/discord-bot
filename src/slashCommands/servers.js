const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const SERVERS_DATA_FILE = path.join(__dirname, '../../data/servers_history.json');

// Función para cargar datos anteriores
async function loadServersData() {
    try {
        const data = await fs.readFile(SERVERS_DATA_FILE, 'utf8');
        const parsedData = JSON.parse(data);
        return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

// Función para guardar datos
async function saveServersData(data) {
    try {
        // Asegurarse de que el directorio existe
        const dir = path.dirname(SERVERS_DATA_FILE);
        await fs.mkdir(dir, { recursive: true });
        
        await fs.writeFile(SERVERS_DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error al guardar datos de servidores:', error);
        throw error;
    }
}

async function updateServersData(newServerList) {
    try {
        const previousData = await loadServersData();
        
        // Actualizar o crear datos para cada servidor
        const updatedData = newServerList.map(server => {
            const previousServer = previousData.find(s => s.id === server.id);
            
            return {
                name: server.name,
                id: server.id,
                current: {
                    members: server.members,
                    bots: server.bots,
                    owner: server.owner,
                    boost: server.boost,
                    invite: server.invite,
                    icon: server.icon
                },
                previous: previousServer ? previousServer.current : {
                    members: server.members,
                    bots: server.bots,
                    owner: server.owner,
                    boost: server.boost,
                    invite: server.invite,
                    icon: server.icon
                }
            };
        });

        await saveServersData(updatedData);
        return updatedData;
    } catch (error) {
        console.error('Error al actualizar datos:', error);
        throw error;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('servers')
        .setDescription('📊 Muestra el top de servidores donde está el bot'),

    async execute(interaction) {
        try {
            await interaction.deferReply();
            const bot = interaction.client;
            
            // Obtener información de servidores
            const serverList = await Promise.all(
                Array.from(bot.guilds.cache.values()).map(async guild => {
                    try {
                        const members = await guild.members.fetch();
                        let inviteUrl = 'No disponible';
                        
                        try {
                            const invites = await guild.invites.fetch();
                            const invite = invites.first();
                            if (invite) inviteUrl = invite.url;
                        } catch {
                            // Si no se puede obtener la invitación, se mantiene como "No disponible"
                        }

                        return {
                            name: guild.name,
                            id: guild.id,
                            members: members.filter(member => !member.user.bot).size,
                            bots: members.filter(member => member.user.bot).size,
                            owner: (await guild.fetchOwner()).user.tag,
                            boost: guild.premiumSubscriptionCount,
                            invite: inviteUrl,
                            icon: guild.iconURL({ size: 1024, dynamic: true }) || null
                        };
                    } catch (error) {
                        console.error(`Error al obtener datos de ${guild.name}:`, error);
                        return null;
                    }
                })
            );

            const validServers = serverList.filter(server => server !== null)
                .sort((a, b) => b.members - a.members);

            // Actualizar y obtener datos históricos
            const historicalData = await updateServersData(validServers);

            if (validServers.length === 0) {
                return await interaction.editReply('```diff\n- No estoy en ningún servidor actualmente.\n```');
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setAuthor({ 
                    name: `📊 Servidores de ${bot.user.username}`, 
                    iconURL: bot.user.displayAvatarURL() 
                })
                .setFooter({ 
                    text: `Total: ${historicalData.length} servidores | ${historicalData.reduce((acc, server) => acc + server.current.members, 0)} usuarios` 
                })
                .setTimestamp();

            // Mostrar top 10 servidores
            const topServers = historicalData.slice(0, 10);
            let description = '';
            
            topServers.forEach((server, index) => {
                const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
                const memberDifference = server.current.members - server.previous.members;
                const diffText = memberDifference > 0 
                    ? `(+${memberDifference})` 
                    : memberDifference < 0 
                        ? `(${memberDifference})`
                        : '';

                description += `${medal} **${server.name}**\n`;
                description += `> 👥 Anterior: **${server.previous.members}** → Actual: **${server.current.members}** ${diffText}\n`;
                description += `> 🤖 ${server.current.bots} bots • 👑 ${server.current.owner}\n`;
                description += `> 🌟 ${server.current.boost} boosts\n`;
                description += `> 🔗 ${server.current.invite !== 'No disponible' ? `[Unirse](${server.current.invite})` : '`No disponible`'}\n`;
                if (index !== topServers.length - 1) description += '\n';
            });

            embed.setDescription(description);

            // Botón para exportar datos
            const exportButton = new ButtonBuilder()
                .setCustomId('export_json')
                .setLabel('Exportar Lista')
                .setEmoji('📋')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(exportButton);

            const response = await interaction.editReply({
                embeds: [embed],
                components: [row]
            });

            // Collector para el botón
            const collector = response.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'export_json' && i.user.id === interaction.user.id) {
                    try {
                        // Verificar si es el dueño del bot para exportar
                        const application = await interaction.client.application.fetch();
                        if (i.user.id !== application.owner.id) {
                            return await i.reply({
                                content: '```diff\n- ❌ Solo el dueño del bot puede exportar la lista.\n```',
                                ephemeral: true
                            });
                        }

                        const serversData = await loadServersData();
                        const jsonString = JSON.stringify(serversData, null, 2);
                        await i.reply({
                            content: 'Aquí tienes los datos actuales y anteriores de los servidores:',
                            files: [{
                                attachment: Buffer.from(jsonString),
                                name: 'servers_history.json'
                            }],
                            ephemeral: true
                        });
                    } catch (error) {
                        await i.reply({
                            content: '```diff\n- ❌ Error al exportar los datos.\n```',
                            ephemeral: true
                        });
                    }
                }
            });

            collector.on('end', () => {
                const disabledRow = new ActionRowBuilder()
                    .addComponents(exportButton.setDisabled(true));
                interaction.editReply({ components: [disabledRow] }).catch(() => {});
            });

        } catch (error) {
            console.error('Error en comando servers:', error);
            const content = '```diff\n- ❌ Hubo un error al ejecutar el comando.\n```';
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content });
            } else {
                await interaction.editReply({ content });
            }
        }
    }
}; 