const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dance')
        .setDescription('💃 Baila solo o con alguien')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('Usuario con quien quieres bailar')
                .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        
        try {
            const response = await fetch('https://api.waifu.pics/sfw/dance');
            const data = await response.json();
            
            const embed = new EmbedBuilder()
                .setColor('#9370DB')
                .setAuthor({
                    name: '💫 Interacción Social',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setDescription(user ? 
                    `### 💃 ¡A bailar!\n\n> **${interaction.user}** baila con **${user}**\n\n*¡La pista es toda suya!*` :
                    `### 💃 ¡A bailar!\n\n> **${interaction.user}** está bailando\n\n*¡Mueve el esqueleto!*`)
                .setImage(data.url)
                .setFooter({ 
                    text: `💝 Comando usado por ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error:', error);
            await interaction.reply({
                content: '```diff\n- ❌ ¡Ups! No pude bailar, ¡pero el ritmo sigue! 💃\n```',
                ephemeral: true
            });
        }
    }
}; 