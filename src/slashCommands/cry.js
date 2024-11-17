const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cry')
        .setDescription('😢 Expresa tu tristeza')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('Usuario que te hizo llorar')
                .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        
        try {
            const response = await fetch('https://api.waifu.pics/sfw/cry');
            const data = await response.json();
            
            const embed = new EmbedBuilder()
                .setColor('#87CEEB')
                .setAuthor({
                    name: '💫 Interacción Social',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setDescription(user ? 
                    `### 😢 ¡Momento triste!\n\n> **${interaction.user}** llora por culpa de **${user}**\n\n*¡No llores, todo estará bien!*` :
                    `### 😢 ¡Momento triste!\n\n> **${interaction.user}** está llorando\n\n*¡Alguien dele un abrazo!*`)
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
                content: '```diff\n- ❌ ¡No llores! Aunque el comando falló, estamos aquí para ti 😢\n```',
                ephemeral: true
            });
        }
    }
}; 