const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('⏰ Crea un recordatorio')
        .addStringOption(option =>
            option.setName('tiempo')
                .setDescription('Tiempo para el recordatorio (ej: 1h, 30m, 2d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mensaje')
                .setDescription('Mensaje del recordatorio')
                .setRequired(true)),
    async execute(interaction) {
        try {
            const tiempoStr = interaction.options.getString('tiempo');
            const mensaje = interaction.options.getString('mensaje');

            // Convertir tiempo a milisegundos
            const tiempoRegex = /^(\d+)([mhd])$/;
            const match = tiempoStr.match(tiempoRegex);

            if (!match) {
                return await interaction.reply({
                    content: '```diff\n- ❌ Formato de tiempo inválido. Usa: 1m (minuto), 1h (hora), 1d (día)\n```',
                    ephemeral: true
                });
            }

            const [, cantidad, unidad] = match;
            const multiplicadores = {
                'm': 60 * 1000,            // minutos
                'h': 60 * 60 * 1000,       // horas
                'd': 24 * 60 * 60 * 1000   // días
            };

            const duracion = parseInt(cantidad) * multiplicadores[unidad];
            const tiempoFinal = new Date(Date.now() + duracion);

            // Confirmar la creación del recordatorio
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('⏰ Recordatorio Creado')
                .addFields(
                    { 
                        name: '📝 Mensaje', 
                        value: mensaje,
                        inline: false
                    },
                    { 
                        name: '⏱️ Te recordaré en', 
                        value: `<t:${Math.floor(tiempoFinal.getTime() / 1000)}:R>`,
                        inline: true
                    }
                )
                .setFooter({ 
                    text: `Solicitado por ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Establecer el recordatorio
            setTimeout(async () => {
                const reminderEmbed = new EmbedBuilder()
                    .setColor('#FF9900')
                    .setTitle('⏰ ¡Recordatorio!')
                    .setDescription(`${interaction.user}\n\n${mensaje}`)
                    .setFooter({ 
                        text: `Recordatorio creado hace ${tiempoStr}`,
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTimestamp();

                try {
                    // Intentar enviar por DM primero
                    await interaction.user.send({ 
                        content: '¡Hey! Tienes un recordatorio pendiente:',
                        embeds: [reminderEmbed] 
                    });
                } catch (error) {
                    // Si no se puede enviar DM, enviar al canal
                    await interaction.channel.send({
                        content: `¡Hey ${interaction.user}! Tu recordatorio ha llegado:`,
                        embeds: [reminderEmbed]
                    });
                }
            }, duracion);

        } catch (error) {
            console.error('Error en comando remind:', error);
            await interaction.reply({
                content: '```diff\n- ❌ Error al crear el recordatorio.\n```',
                ephemeral: true
            });
        }
    }
}; 