const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cleartickets')
        .setDescription('⚠️ Limpia la memoria de tickets y cierra todos los tickets activos')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        // Verificar permisos
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '```diff\n- ❌ Solo los administradores pueden usar este comando\n```',
                ephemeral: true
            });
        }

        // Crear embed de confirmación
        const warningEmbed = new EmbedBuilder()
            .setTitle('⚠️ ADVERTENCIA: Limpieza de Tickets')
            .setColor('#FF0000')
            .setDescription('**¡ESTA ACCIÓN ES IRREVERSIBLE!**\n\nEsto hará lo siguiente:\n\n' +
                '```diff\n' +
                '- Eliminará TODOS los tickets de la memoria\n' +
                '- Cerrará TODOS los canales de tickets activos\n' +
                '- Puede romper tickets que estén en uso\n' +
                '- Requiere reconfigurar el sistema de tickets\n```\n' +
                '¿Estás seguro de que quieres continuar?')
            .setFooter({ text: 'Reacciona con ✅ para confirmar o ❌ para cancelar' });

        const message = await interaction.reply({
            embeds: [warningEmbed],
            fetchReply: true
        });

        // Añadir reacciones
        await message.react('✅');
        await message.react('❌');

        // Crear collector para las reacciones
        const filter = (reaction, user) => {
            return ['✅', '❌'].includes(reaction.emoji.name) && user.id === interaction.user.id;
        };

        const collector = message.createReactionCollector({ filter, time: 30000, max: 1 });

        collector.on('collect', async (reaction, user) => {
            if (reaction.emoji.name === '✅') {
                try {
                    // Obtener todos los canales de tickets
                    const ticketChannels = interaction.guild.channels.cache.filter(channel => 
                        channel.name.startsWith('ticket-')
                    );

                    // Contador de tickets cerrados
                    let closedCount = 0;
                    let failedCount = 0;

                    // Cerrar todos los canales de tickets
                    for (const [_, channel] of ticketChannels) {
                        try {
                            await channel.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor('#FF0000')
                                        .setDescription('🔒 Este ticket ha sido cerrado por limpieza del sistema.')
                                ]
                            });
                            await channel.delete();
                            closedCount++;
                        } catch (error) {
                            console.error(`Error al cerrar canal ${channel.name}:`, error);
                            failedCount++;
                        }
                    }

                    // Limpiar la memoria
                    const ticketsInMemory = global.activeTickets.size;
                    global.activeTickets.clear();

                    const resultEmbed = new EmbedBuilder()
                        .setTitle('🧹 Limpieza de Tickets Completada')
                        .setColor('#00FF00')
                        .addFields(
                            { name: '📊 Resultados', value:
                              `> 🎫 Tickets en memoria eliminados: \`${ticketsInMemory}\`\n` +
                              `> ✅ Canales cerrados exitosamente: \`${closedCount}\`\n` +
                              `> ❌ Canales que fallaron: \`${failedCount}\`\n`
                            },
                            { name: '⚠️ Siguiente paso', value: 'Usa `/ticket setup` para reconfigurar el sistema de tickets.' }
                        )
                        .setTimestamp();

                    await interaction.editReply({
                        embeds: [resultEmbed],
                        components: []
                    });

                } catch (error) {
                    console.error('Error durante la limpieza:', error);
                    await interaction.editReply({
                        content: '```diff\n- ❌ Ocurrió un error durante la limpieza\n```',
                        embeds: [],
                        components: []
                    });
                }
            } else {
                // Cancelar operación
                const cancelEmbed = new EmbedBuilder()
                    .setTitle('❌ Operación Cancelada')
                    .setColor('#FF0000')
                    .setDescription('La limpieza de tickets ha sido cancelada.')
                    .setTimestamp();

                await interaction.editReply({
                    embeds: [cancelEmbed],
                    components: []
                });
            }
        });

        collector.on('end', async (collected) => {
            if (collected.size === 0) {
                const timeoutEmbed = new EmbedBuilder()
                    .setTitle('⏰ Tiempo Agotado')
                    .setColor('#FF0000')
                    .setDescription('La operación ha sido cancelada por tiempo de espera.')
                    .setTimestamp();

                await interaction.editReply({
                    embeds: [timeoutEmbed],
                    components: []
                });
            }
        });
    }
}; 