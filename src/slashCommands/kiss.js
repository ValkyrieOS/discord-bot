const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kiss')
        .setDescription('💋 Dale un beso a alguien especial')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('Usuario a quien quieres besar')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        
        if (user.id === interaction.user.id) {
            return await interaction.reply({
                content: '```diff\n- ❌ ¡No puedes besarte a ti mismo!\n```',
                ephemeral: true
            });
        }

        try {
            const response = await fetch('https://nekos.life/api/v2/img/kiss');
            const data = await response.json();
            
            const embed = new EmbedBuilder()
                .setColor('#FF1493')
                .setAuthor({
                    name: '💫 Interacción Social',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setDescription(`### 💋 ¡Un beso especial!\n\n> **${interaction.user}** le da un dulce beso a **${user}**\n\n*¡El amor está en el aire!*`)
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
                content: '```diff\n- ❌ ¡Ups! Algo salió mal con el beso virtual 💋\n```',
                ephemeral: true
            });
        }
    }
}; 