const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('🏓 Muestra la latencia del bot'),
    async execute(interaction) {
        const sent = await interaction.deferReply({ fetchReply: true });
        const ping = sent.createdTimestamp - interaction.createdTimestamp;
        const wsping = interaction.client.ws.ping;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🏓 Pong!')
            .addFields(
                { name: '📡 Latencia', value: `\`${ping}ms\``, inline: true },
                { name: '💻 API', value: `\`${wsping}ms\``, inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
}; 