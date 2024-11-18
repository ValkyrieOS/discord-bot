const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('servers')
        .setDescription('Muestra el top de servidores donde está el bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        try {
            // Verificar si el usuario es el dueño del bot
            const application = await interaction.client.application.fetch();
            if (interaction.user.id !== application.owner.id) {
                return await interaction.reply({
                    content: '```diff\n- ❌ Solo el dueño del bot puede usar este comando.\n```',
                    ephemeral: true
                });
            }

            const bot = interaction.client;
            
            // Obtener información detallada de cada servidor
            const serverList = await Promise.all(
                Array.from(bot.guilds.cache.values()).map(async guild => {
                    const members = await guild.members.fetch();
                    const realMembers = members.filter(member => !member.user.bot).size;
                    const bots = members.filter(member => member.user.bot).size;
                    
                    return {
                        name: guild.name,
                        totalMembers: guild.memberCount,
                        realMembers: realMembers,
                        bots: bots,
                        id: guild.id,
                        owner: (await guild.fetchOwner()).user.tag,
                        boostLevel: guild.premiumTier,
                        boostCount: guild.premiumSubscriptionCount,
                        channels: guild.channels.cache.size,
                        roles: guild.roles.cache.size
                    };
                })
            );

            // Ordenar por cantidad de miembros reales
            serverList.sort((a, b) => b.realMembers - a.realMembers);

            if (serverList.length === 0) {
                return await interaction.reply({
                    content: '```diff\n- No estoy en ningún servidor actualmente.\n```',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setAuthor({ 
                    name: `🏆 Top Servidores de ${bot.user.username}`, 
                    iconURL: bot.user.displayAvatarURL() 
                })
                .setDescription(`*Mostrando los ${Math.min(15, serverList.length)} servidores más grandes de un total de ${serverList.length} servidores*`)
                .setThumbnail(bot.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            // Mostrar top 15 servidores
            const topServers = serverList.slice(0, 15);
            let description = '';
            
            topServers.forEach((server, index) => {
                const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `\`${index + 1}.\``;
                description += `${medal} **${server.name}**\n`;
                description += `┃ \`👥\` Miembros: **${server.realMembers}** usuarios`;
                description += ` + \`🤖\` **${server.bots}** bots\n`;
                description += `┃ \`👑\` Owner: **${server.owner}**\n`;
                description += `┃ \`🚀\` Boost: Nivel **${server.boostLevel}** (${server.boostCount} boosts)\n`;
                description += `┃ \`💬\` Canales: **${server.channels}** | \`🎭\` Roles: **${server.roles}**\n`;
                description += `┃ \`🆔\` \`${server.id}\`\n`;
                if (index !== topServers.length - 1) description += '\n';
            });

            embed.setDescription(description);

            // Crear botón para exportar JSON
            const exportButton = new ButtonBuilder()
                .setCustomId('export_json')
                .setLabel('Exportar datos')
                .setEmoji('📊')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder()
                .addComponents(exportButton);

            const response = await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });

            // Collector para el botón
            const collector = response.createMessageComponentCollector({ 
                time: 60000 // 1 minuto
            });

            collector.on('collect', async i => {
                if (i.customId === 'export_json' && i.user.id === interaction.user.id) {
                    const jsonData = serverList.map(server => ({
                        nombre: server.name,
                        id: server.id,
                        miembros: server.realMembers,
                        bots: server.bots,
                        total: server.totalMembers,
                        propietario: server.owner
                    }));

                    const jsonString = JSON.stringify(jsonData, null, 2);
                    const buffer = Buffer.from(jsonString, 'utf-8');

                    await i.reply({
                        files: [{
                            attachment: buffer,
                            name: 'servers_data.json'
                        }],
                        ephemeral: true
                    });
                }
            });

            collector.on('end', async () => {
                try {
                    const disabledRow = new ActionRowBuilder()
                        .addComponents(exportButton.setDisabled(true));
                    
                    await interaction.editReply({
                        components: [disabledRow]
                    });
                } catch (error) {
                    console.error('Error al desactivar botones:', error);
                }
            });

        } catch (error) {
            console.error('Error en comando servers:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '```diff\n- ❌ Hubo un error al ejecutar el comando.\n```',
                    ephemeral: true
                });
            }
        }
    }
}; 