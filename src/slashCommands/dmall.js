const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dmall')
        .setDescription('📨 Envía un mensaje privado a todos los miembros (Solo ONAC Owner)'),
    
    async execute(interaction) {
        try {
            // Verificar si el usuario es el propietario autorizado
            if (interaction.user.id !== '631907198930386950') {
                return await interaction.reply({
                    content: '```diff\n- ❌ Solo el propietario de ONAC puede usar este comando.\n```',
                    ephemeral: true
                });
            }

            // Crear el embed para el DM
            const dmEmbed = new EmbedBuilder()
                .setTitle('🌟 ¡Únete al Servidor Oficial de ONAC!')
                .setColor('#5865F2')
                .setDescription(`¡Hola <@{userId}>! Te invitamos a unirte al servidor oficial de soporte de ONAC, donde podrás:\n\n` +
                    '• 🤝 Obtener ayuda y soporte\n' +
                    '• 🎉 Participar en eventos exclusivos\n' +
                    '• 💡 Sugerir nuevas características\n' +
                    '• 🤖 Estar al día con las actualizaciones\n\n' +
                    '**¡Únete ahora!**\n' +
                    'https://discord.gg/czkd3NAaed')
                .setTimestamp()
                .setFooter({ text: 'ONAC Support Server' });

            // Obtener todos los servidores y miembros
            const guilds = interaction.client.guilds.cache;
            let totalMembers = 0;
            let sent = 0;
            let failed = 0;
            const processedUsers = new Set(); // Para evitar DMs duplicados

            // Contar total de miembros únicos
            for (const [, guild] of guilds) {
                await guild.members.fetch();
                guild.members.cache.forEach(member => {
                    if (!member.user.bot && !processedUsers.has(member.user.id)) {
                        processedUsers.add(member.user.id);
                        totalMembers++;
                    }
                });
            }

            // Reiniciar Set para el proceso de envío
            processedUsers.clear();

            // Responder al comando inicialmente
            await interaction.reply({
                content: `\`\`\`diff\n+ 📨 Iniciando envío de mensajes...\n+ 📊 Total de usuarios a procesar: ${totalMembers}\n\`\`\``,
                ephemeral: true
            });

            // Procesar cada servidor
            for (const [, guild] of guilds) {
                const members = guild.members.cache;

                for (const [, member] of members) {
                    if (member.user.bot || processedUsers.has(member.user.id)) continue;
                    processedUsers.add(member.user.id);

                    try {
                        // Crear embed personalizado con mención
                        const personalizedEmbed = EmbedBuilder.from(dmEmbed)
                            .setDescription(dmEmbed.data.description.replace('{userId}', member.user.id));

                        await member.send({ embeds: [personalizedEmbed] });
                        sent++;

                        // Calcular progreso
                        const progress = Math.floor((sent + failed) / totalMembers * 20);
                        const progressBar = '█'.repeat(progress) + '░'.repeat(20 - progress);
                        const percentage = Math.floor((sent + failed) / totalMembers * 100);

                        // Actualizar cada 5 mensajes
                        if (sent % 5 === 0) {
                            await interaction.editReply({
                                content: `\`\`\`diff\n+ 📨 Progreso del envío:\n\n` +
                                    `[${progressBar}] ${percentage}%\n\n` +
                                    `+ ✅ Enviados: ${sent}\n` +
                                    `- ❌ Fallidos: ${failed}\n` +
                                    `+ 📊 Total: ${totalMembers}\n` +
                                    `+ 🌐 Servidores: ${guilds.size}\n\`\`\``,
                                ephemeral: true
                            });
                        }

                        // Esperar 1 segundo entre mensajes para evitar rate limits
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (error) {
                        failed++;
                        console.error(`Error al enviar DM a ${member.user.tag}:`, error);
                    }
                }
            }

            // Actualización final
            const finalEmbed = new EmbedBuilder()
                .setTitle('📨 Envío de Mensajes Completado')
                .setColor(failed === 0 ? '#00FF00' : '#FFAA00')
                .addFields(
                    { name: '✅ Mensajes Enviados', value: sent.toString(), inline: true },
                    { name: '❌ Mensajes Fallidos', value: failed.toString(), inline: true },
                    { name: '📊 Total Procesado', value: totalMembers.toString(), inline: true }
                )
                .setDescription(`Mensajes enviados a través de ${guilds.size} servidores`)
                .setTimestamp();

            await interaction.editReply({
                content: null,
                embeds: [finalEmbed],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error en comando dmall:', error);
            await interaction.reply({
                content: '```diff\n- ❌ Hubo un error al ejecutar el comando.\n```',
                ephemeral: true
            });
        }
    }
}; 