const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ppt')
        .setDescription('Juega piedra, papel o tijeras')
        .addStringOption(option =>
            option.setName('eleccion')
                .setDescription('Elige tu jugada')
                .setRequired(true)
                .addChoices(
                    { name: '🪨 Piedra', value: 'piedra' },
                    { name: '📄 Papel', value: 'papel' },
                    { name: '✂️ Tijeras', value: 'tijeras' }
                )),
    async execute(interaction) {
        const opciones = ['piedra', 'papel', 'tijeras'];
        const eleccionBot = opciones[Math.floor(Math.random() * opciones.length)];
        const eleccionUsuario = interaction.options.getString('eleccion');

        const emojis = {
            piedra: '🪨',
            papel: '📄',
            tijeras: '✂️'
        };

        let resultado;
        if (eleccionUsuario === eleccionBot) {
            resultado = '¡Empate! 🤝';
        } else if (
            (eleccionUsuario === 'piedra' && eleccionBot === 'tijeras') ||
            (eleccionUsuario === 'papel' && eleccionBot === 'piedra') ||
            (eleccionUsuario === 'tijeras' && eleccionBot === 'papel')
        ) {
            resultado = '¡Ganaste! 🎉';
        } else {
            resultado = '¡Perdiste! 😢';
        }

        const embed = new EmbedBuilder()
            .setTitle('Piedra, Papel o Tijeras')
            .setColor('#00FF00')
            .addFields(
                { name: 'Tu elección', value: `${emojis[eleccionUsuario]} ${eleccionUsuario}`, inline: true },
                { name: 'Mi elección', value: `${emojis[eleccionBot]} ${eleccionBot}`, inline: true },
                { name: 'Resultado', value: resultado }
            );

        await interaction.reply({ embeds: [embed] });
    },
}; 