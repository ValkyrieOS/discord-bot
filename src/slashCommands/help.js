const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('📚 Muestra todos los comandos disponibles'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({
                name: '📚 Centro de Ayuda',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setDescription('*Aquí tienes una lista de todos los comandos disponibles:*')
            .addFields(
                {
                    name: '🛡️ Moderación',
                    value: '```\n/ban - Banea a un usuario\n/mute - Mutea temporalmente a un usuario\n/kick - Expulsa a un usuario\n/warn - Advierte a un usuario```'
                },
                {
                    name: '💫 Interacción Social',
                    value: '```\n/hug - Abraza a alguien\n/kiss - Besa a alguien\n/pat - Da palmaditas\n/slap - Da un golpecito```'
                },
                {
                    name: '🔞 NSFW (Solo en canales NSFW)',
                    value: '```\n/spank - Da una nalgada\n⚠️ Otros comandos NSFW en mantenimiento por problemas con la API```'
                },
                {
                    name: '📊 Información',
                    value: '```\n/user - Info de usuario\n/server - Info del servidor\n/stats - Estadísticas\n/roles - Info de roles```'
                }
            )
            .setFooter({ 
                text: 'Usa los comandos con responsabilidad', 
                iconURL: interaction.client.user.displayAvatarURL() 
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
}; 