const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('globalsorteo')
        .setDescription('🎉 Realiza un sorteo global entre todos los usuarios del bot')
        .addStringOption(option =>
            option.setName('premio')
                .setDescription('Premio del sorteo')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('ganadores')
                .setDescription('Número de ganadores')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(50))
        .addStringOption(option =>
            option.setName('alcance')
                .setDescription('Alcance del sorteo')
                .setRequired(true)
                .addChoices(
                    { name: '🌐 Todos los servidores', value: 'global' },
                    { name: '🏠 Solo este servidor', value: 'local' }
                ))
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

            const premio = interaction.options.getString('premio');
            const numGanadores = interaction.options.getInteger('ganadores');
            const alcance = interaction.options.getString('alcance');

            // Obtener todos los usuarios únicos del bot
            const processedUsers = new Set();
            let totalUsers = 0;
            let successfulDMs = 0;
            let winners = [];

            // Recopilar usuarios según el alcance seleccionado
            if (alcance === 'local') {
                // Solo usuarios del servidor actual
                const members = await interaction.guild.members.fetch();
                members.forEach(member => {
                    if (!member.user.bot) {
                        processedUsers.add(member.id);
                        totalUsers++;
                    }
                });
            } else {
                // Usuarios de todos los servidores
                for (const guild of interaction.client.guilds.cache.values()) {
                    try {
                        const members = await guild.members.fetch();
                        members.forEach(member => {
                            if (!member.user.bot && !processedUsers.has(member.id)) {
                                processedUsers.add(member.id);
                                totalUsers++;
                            }
                        });
                    } catch (error) {
                        console.error(`Error al obtener miembros del servidor ${guild.name}:`, error);
                    }
                }
            }

            // Verificar si hay suficientes participantes
            if (processedUsers.size < numGanadores) {
                return await interaction.editReply({
                    content: '```diff\n- ❌ No hay suficientes participantes para el número de ganadores solicitado.\n```',
                    ephemeral: true
                });
            }

            // Seleccionar ganadores aleatoriamente
            const userArray = Array.from(processedUsers);
            while (winners.length < numGanadores && userArray.length > 0) {
                const randomIndex = Math.floor(Math.random() * userArray.length);
                winners.push(userArray.splice(randomIndex, 1)[0]);
            }

            // Preparar embeds para ganadores y no ganadores
            const winnerEmbed = new EmbedBuilder()
                .setTitle('🎉 ¡Felicidades! ¡Has Ganado!')
                .setColor('#00FF00')
                .setDescription(`¡Has ganado en el sorteo${alcance === 'local' ? ' del servidor' : ' global'}!\n\n**Premio:** ${premio}`)
                .setFooter({ text: alcance === 'local' ? `Sorteo en ${interaction.guild.name}` : 'Sorteo Global' })
                .setTimestamp();

            const loserEmbed = new EmbedBuilder()
                .setTitle('🎲 Resultado del Sorteo')
                .setColor('#FF0000')
                .setDescription(`Lo sentimos, no has ganado en esta ocasión.\n\n**Premio:** ${premio}`)
                .setFooter({ text: alcance === 'local' ? `Sorteo en ${interaction.guild.name}` : 'Sorteo Global' })
                .setTimestamp();

            // Enviar mensajes a todos los usuarios
            let sent = 0;
            for (const userId of processedUsers) {
                try {
                    const user = await interaction.client.users.fetch(userId);
                    const isWinner = winners.includes(userId);
                    await user.send({ 
                        embeds: [isWinner ? winnerEmbed : loserEmbed] 
                    });
                    successfulDMs++;

                    // Actualizar progreso cada 10 mensajes
                    sent++;
                    if (sent % 10 === 0) {
                        const progress = Math.floor((sent / totalUsers) * 20);
                        const progressBar = '█'.repeat(progress) + '░'.repeat(20 - progress);
                        const percentage = Math.floor((sent / totalUsers) * 100);

                        await interaction.editReply({
                            content: `\`\`\`diff\n+ 📨 Enviando resultados del sorteo:\n\n` +
                                `[${progressBar}] ${percentage}%\n\n` +
                                `+ ✅ Mensajes enviados: ${sent}\n` +
                                `+ 📊 Total de usuarios: ${totalUsers}\n\`\`\``,
                            ephemeral: true
                        });
                    }

                    // Esperar 1 segundo entre mensajes para evitar rate limits
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`Error al enviar DM a ${userId}:`, error);
                }
            }

            // Crear lista de ganadores
            const winnersList = [];
            for (const winnerId of winners) {
                try {
                    const user = await interaction.client.users.fetch(winnerId);
                    winnersList.push(`<@${user.id}> (${user.tag})`);
                } catch (error) {
                    winnersList.push(`<@${winnerId}> (ID: ${winnerId})`);
                }
            }

            // Enviar resumen final
            const finalEmbed = new EmbedBuilder()
                .setTitle(`🎉 Sorteo ${alcance === 'local' ? 'Local' : 'Global'} Completado`)
                .setColor('#00FF00')
                .addFields(
                    { name: '🎁 Premio', value: premio, inline: true },
                    { name: '👥 Participantes', value: successfulDMs.toString(), inline: true },
                    { name: '🌍 Alcance', value: alcance === 'local' ? 'Solo este servidor' : 'Todos los servidores', inline: true },
                    { name: '👑 Ganadores', value: winnersList.join('\n') || 'Ninguno' }
                )
                .setFooter({ text: alcance === 'local' ? `Sorteo en ${interaction.guild.name}` : 'Sorteo Global' })
                .setTimestamp();

            await interaction.editReply({
                content: null,
                embeds: [finalEmbed],
                ephemeral: true
            });

            // Enviar anuncio público de ganadores
            const publicEmbed = new EmbedBuilder()
                .setTitle(`🎉 ¡Ganadores del Sorteo ${alcance === 'local' ? 'Local' : 'Global'}!`)
                .setColor('#00FF00')
                .setDescription(`**Premio:** ${premio}`)
                .addFields(
                    { name: '👑 Ganadores', value: winnersList.join('\n') || 'Ninguno' },
                    { name: '📊 Estadísticas', value: `Participantes totales: ${successfulDMs}` }
                )
                .setFooter({ text: alcance === 'local' ? `Sorteo en ${interaction.guild.name}` : 'Sorteo Global' })
                .setTimestamp();

            await interaction.channel.send({ embeds: [publicEmbed] });

        } catch (error) {
            console.error('Error en comando globalsorteo:', error);
            const errorMessage = '```diff\n- ❌ Hubo un error al ejecutar el sorteo.\n```';
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
}; 