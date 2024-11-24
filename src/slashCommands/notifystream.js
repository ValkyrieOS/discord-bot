const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notifystream')
        .setDescription('🎥 Notifica a los usuarios sobre un stream en Twitch')
        .addStringOption(option =>
            option.setName('titulo')
                .setDescription('Título del stream')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('descripcion')
                .setDescription('Descripción del stream')
                .setRequired(true)),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            // Verificar si es el owner del bot
            const application = await interaction.client.application.fetch();
            if (interaction.user.id !== application.owner.id) {
                return await interaction.editReply({
                    content: '```diff\n- ❌ Solo el dueño del bot puede usar este comando.\n```',
                    ephemeral: true
                });
            }

            const titulo = interaction.options.getString('titulo');
            const descripcion = interaction.options.getString('descripcion');

            // Crear embed para la notificación
            const streamEmbed = new EmbedBuilder()
                .setColor('#6441a5') // Color de Twitch
                .setTitle('🎥 ¡Stream en Vivo!')
                .setURL('https://www.twitch.tv/iamglazzier')
                .setDescription([
                    `**${titulo}**`,
                    '',
                    descripcion,
                    '',
                    '**¡Únete ahora!**',
                    '🔴 https://www.twitch.tv/iamglazzier',
                    '',
                    '> ¡No te pierdas las últimas novedades y actualizaciones del bot!'
                ].join('\n'))
                .setThumbnail('https://static-cdn.jtvnw.net/jtv_user_pictures/twitch-profile_image-8a8c5be2e3b64a9a-300x300.png')
                .addFields(
                    { name: '📅 Fecha', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '🎮 Plataforma', value: '[Twitch](https://www.twitch.tv/iamglazzier)', inline: true }
                )
                .setFooter({ 
                    text: 'ONAC Bot • Stream Notification',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            let successCount = 0;
            let failCount = 0;
            const processedUsers = new Set();

            // Enviar mensaje de inicio
            await interaction.editReply({
                content: '```diff\n+ 📨 Iniciando envío de notificaciones...\n```',
                ephemeral: true
            });

            // Procesar cada servidor
            for (const guild of interaction.client.guilds.cache.values()) {
                try {
                    const members = await guild.members.fetch();
                    
                    for (const member of members.values()) {
                        // Evitar duplicados y bots
                        if (!member.user.bot && !processedUsers.has(member.user.id)) {
                            processedUsers.add(member.user.id);
                            
                            try {
                                await member.send({ embeds: [streamEmbed] });
                                successCount++;
                            } catch {
                                failCount++;
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error al procesar servidor ${guild.name}:`, error);
                }
            }

            // Enviar resumen final
            const summaryEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('📊 Resumen de Notificaciones')
                .setDescription([
                    '**Resultados del envío:**',
                    `✅ Enviados: **${successCount}**`,
                    `❌ Fallidos: **${failCount}**`,
                    `📊 Total procesados: **${processedUsers.size}**`
                ].join('\n'))
                .setTimestamp();

            await interaction.editReply({
                content: '```diff\n+ ✅ Proceso completado\n```',
                embeds: [summaryEmbed],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error en comando notifystream:', error);
            const errorMessage = '```diff\n- ❌ Hubo un error al enviar las notificaciones.\n```';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
}; 