const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('servers')
        .setDescription('Muestra el top de servidores donde está el bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        try {
            // Verificar si es el dueño del bot
            const application = await interaction.client.application.fetch();
            if (interaction.user.id !== application.owner.id) {
                return await interaction.reply({
                    content: '```diff\n- ❌ Solo el dueño del bot puede usar este comando.\n```',
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });
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
                            invite: inviteUrl
                        };
                    } catch (error) {
                        console.error(`Error al obtener datos de ${guild.name}:`, error);
                        return null;
                    }
                })
            );

            const validServers = serverList.filter(server => server !== null)
                .sort((a, b) => b.members - a.members);

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
                    text: `Total: ${validServers.length} servidores | ${validServers.reduce((acc, server) => acc + server.members, 0)} usuarios` 
                })
                .setTimestamp();

            // Mostrar top 10 servidores
            const topServers = validServers.slice(0, 10);
            let description = '';
            
            topServers.forEach((server, index) => {
                const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
                description += `${medal} **${server.name}**\n`;
                description += `> 👥 **${server.members}** usuarios • 🤖 ${server.bots} bots\n`;
                description += `> 👑 ${server.owner} • 🌟 ${server.boost} boosts\n`;
                description += `> 🔗 ${server.invite !== 'No disponible' ? `[Unirse](${server.invite})` : '`No disponible`'}\n`;
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
                        const jsonString = JSON.stringify(validServers, null, 2);
                        await i.reply({
                            files: [{
                                attachment: Buffer.from(jsonString),
                                name: 'servers_list.json'
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
                await interaction.reply({ content, ephemeral: true });
            } else {
                await interaction.editReply({ content });
            }
        }
    }
}; 