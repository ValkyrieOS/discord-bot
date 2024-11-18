const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('choice')
        .setDescription('🎲 Elige una opción aleatoria entre las proporcionadas')
        .addStringOption(option =>
            option.setName('opciones')
                .setDescription('Opciones separadas por comas (ej: pizza, hamburguesa, sushi)')
                .setRequired(true)),
    async execute(interaction) {
        const opciones = interaction.options.getString('opciones')
            .split(',')
            .map(opcion => opcion.trim())
            .filter(opcion => opcion.length > 0);

        if (opciones.length < 2) {
            return await interaction.reply({
                content: '```diff\n- ❌ Debes proporcionar al menos 2 opciones separadas por comas.\n```',
                ephemeral: true
            });
        }

        const eleccion = opciones[Math.floor(Math.random() * opciones.length)];

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('🎲 Elección Aleatoria')
            .addFields(
                { 
                    name: '📋 Opciones', 
                    value: opciones.join('\n'),
                    inline: false
                },
                { 
                    name: '✨ He elegido', 
                    value: `**${eleccion}**`,
                    inline: false
                }
            )
            .setFooter({ 
                text: `Solicitado por ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
}; 