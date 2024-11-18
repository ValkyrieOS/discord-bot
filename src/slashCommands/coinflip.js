const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('🪙 Lanza una moneda al aire'),
    async execute(interaction) {
        const resultados = [
            { nombre: 'Cara', emoji: '👑' },
            { nombre: 'Cruz', emoji: '❌' }
        ];

        const resultado = resultados[Math.floor(Math.random() * resultados.length)];
        const mensajesAdicionales = [
            '¡La suerte está echada!',
            '¡El destino ha hablado!',
            '¡La moneda ha decidido!',
            '¡La fortuna ha elegido!',
            '¡El resultado está claro!'
        ];

        const mensajeAdicional = mensajesAdicionales[Math.floor(Math.random() * mensajesAdicionales.length)];

        const embed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setTitle('🪙 Lanzamiento de Moneda')
            .setDescription(`*La moneda gira en el aire...*\n\n**${mensajeAdicional}**\n\n${resultado.emoji} Ha salido **${resultado.nombre}**`)
            .setFooter({ 
                text: `Lanzado por ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
}; 