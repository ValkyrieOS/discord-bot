const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('📊 Crea una encuesta')
        .addStringOption(option =>
            option.setName('pregunta')
                .setDescription('La pregunta de la encuesta')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('opciones')
                .setDescription('Opciones separadas por comas (máx. 10)')
                .setRequired(false)),
    async execute(interaction) {
        try {
            const pregunta = interaction.options.getString('pregunta');
            const opcionesStr = interaction.options.getString('opciones');

            let opciones;
            let reacciones;

            if (opcionesStr) {
                // Encuesta con opciones personalizadas
                opciones = opcionesStr.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
                
                if (opciones.length > 10) {
                    return await interaction.reply({
                        content: '```diff\n- ❌ No puedes tener más de 10 opciones.\n```',
                        ephemeral: true
                    });
                }

                // Emojis numerados para las opciones
                reacciones = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
                
                const embed = new EmbedBuilder()
                    .setColor('#FF9900')
                    .setTitle('📊 Nueva Encuesta')
                    .setDescription(pregunta)
                    .addFields(
                        opciones.map((opcion, index) => ({
                            name: `Opción ${index + 1}`,
                            value: `${reacciones[index]} ${opcion}`,
                            inline: false
                        }))
                    )
                    .setFooter({ 
                        text: `Creada por ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTimestamp();

                const mensaje = await interaction.reply({ embeds: [embed], fetchReply: true });
                
                // Añadir reacciones para votar
                for (let i = 0; i < opciones.length; i++) {
                    await mensaje.react(reacciones[i]);
                }
            } else {
                // Encuesta simple Sí/No
                const embed = new EmbedBuilder()
                    .setColor('#FF9900')
                    .setTitle('📊 Nueva Encuesta')
                    .setDescription(pregunta)
                    .setFooter({ 
                        text: `Creada por ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTimestamp();

                const mensaje = await interaction.reply({ embeds: [embed], fetchReply: true });
                
                // Reacciones para Sí/No
                await mensaje.react('👍');
                await mensaje.react('👎');
            }

        } catch (error) {
            console.error('Error en comando poll:', error);
            await interaction.reply({
                content: '```diff\n- ❌ Error al crear la encuesta.\n```',
                ephemeral: true
            });
        }
    }
}; 