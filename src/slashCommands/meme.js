const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Obtén un meme aleatorio'),
    async execute(interaction) {
        try {
            const response = await fetch('https://meme-api.com/gimme');
            const data = await response.json();

            const embed = new EmbedBuilder()
                .setTitle(data.title)
                .setColor('#FF9900')
                .setImage(data.url)
                .setFooter({ text: `👍 ${data.ups} | Subreddit: r/${data.subreddit}` });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ 
                content: '¡No pude obtener el meme! Intenta de nuevo.', 
                ephemeral: true 
            });
        }
    },
}; 