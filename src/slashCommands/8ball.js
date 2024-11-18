const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('🎱 La bola mágica responderá a tu pregunta')
        .addStringOption(option =>
            option.setName('pregunta')
                .setDescription('¿Qué quieres preguntar?')
                .setRequired(true)),
    async execute(interaction) {
        const pregunta = interaction.options.getString('pregunta');
        
        const respuestas = [
            '✅ Es cierto',
            '✅ Definitivamente sí',
            '✅ Sin duda',
            '✅ Sí, definitivamente',
            '✅ Puedes confiar en ello',
            '❓ Como yo lo veo, sí',
            '❓ Probablemente',
            '❓ Las señales apuntan a que sí',
            '❓ No puedo predecirlo ahora',
            '❓ Pregunta de nuevo más tarde',
            '❓ Mejor no decirte ahora',
            '❌ No cuentes con ello',
            '❌ Mi respuesta es no',
            '❌ Mis fuentes dicen que no',
            '❌ Las perspectivas no son buenas',
            '❌ Muy dudoso'
        ];

        const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];

        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle('🎱 La Bola Mágica ha hablado')
            .addFields(
                { 
                    name: '❓ Pregunta', 
                    value: pregunta,
                    inline: false
                },
                { 
                    name: '🔮 Respuesta', 
                    value: respuesta,
                    inline: false
                }
            )
            .setFooter({ 
                text: `Preguntado por ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
}; 