const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dmall')
        .setDescription('📨 Envía un mensaje privado a los miembros (Solo ONAC Owner)')
        .addStringOption(option =>
            option.setName('servidor')
                .setDescription('ID del servidor (deja vacío para enviar a todos)')
                .setRequired(false)),
    
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            // Verificar si el usuario es el propietario autorizado
            if (interaction.user.id !== '631907198930386950') {
                return await interaction.editReply({
                    content: '```diff\n- ❌ Solo el propietario de ONAC puede usar este comando.\n```',
                    ephemeral: true
                });
            }

            // Obtener el ID del servidor si se especificó
            const targetGuildId = interaction.options.getString('servidor');
            
            // Si se especificó un servidor, verificar que existe
            if (targetGuildId) {
                const targetGuild = interaction.client.guilds.cache.get(targetGuildId);
                if (!targetGuild) {
                    return await interaction.editReply({
                        content: '```diff\n- ❌ No se encontró el servidor especificado.\n```',
                        ephemeral: true
                    });
                }
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

            // Obtener los servidores y miembros
            const guilds = targetGuildId 
                ? [interaction.client.guilds.cache.get(targetGuildId)]
                : Array.from(interaction.client.guilds.cache.values());

            let totalMembers = 0;
            let sent = 0;
            let failed = 0;
            const processedUsers = new Set();

            // Contar total de miembros únicos
            for (const guild of guilds) {
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

            // Actualizar mensaje inicial
            await interaction.editReply({
                content: `\`\`\`diff\n+ 📨 Iniciando envío de mensajes...\n` +
                    `+ 📊 Total de usuarios a procesar: ${totalMembers}\n` +
                    `+ 🌐 Servidor: ${targetGuildId ? `Específico (${guilds[0].name})` : 'Todos los servidores'}\n\`\`\``,
                ephemeral: true
            });

            // Procesar cada servidor
            for (const guild of guilds) {
                const members = guild.members.cache;

                for (const [, member] of members) {
                    if (member.user.bot || processedUsers.has(member.user.id)) continue;
                    processedUsers.add(member.user.id);

                    try {
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
                                    `+ 🌐 Servidor: ${targetGuildId ? guild.name : 'Todos los servidores'}\n\`\`\``,
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
                .setDescription(
                    `Mensajes enviados ${targetGuildId ? `en ${guilds[0].name}` : `a través de ${guilds.length} servidores`}`
                )
                .setTimestamp();

            await interaction.editReply({
                content: null,
                embeds: [finalEmbed],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error en comando dmall:', error);
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '```diff\n- ❌ Hubo un error al ejecutar el comando.\n```',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '```diff\n- ❌ Hubo un error al ejecutar el comando.\n```',
                    ephemeral: true
                });
            }
        }
    }
}; 