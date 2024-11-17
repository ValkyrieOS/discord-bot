const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('🤗 Abraza a un usuario')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('Usuario a quien quieres abrazar')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        
        if (user.id === interaction.user.id) {
            return await interaction.reply({
                content: '```diff\n- ❌ ¿Necesitas un abrazo? ¡Pídele a alguien que te abrace!\n```',
                ephemeral: true
            });
        }

        try {
            const response = await fetch('https://nekos.life/api/v2/img/hug');
            const data = await response.json();
            
            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setAuthor({
                    name: '💫 Interacción Social',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setDescription(`### 🤗 ¡Un abrazo lleno de cariño!\n\n> **${interaction.user}** abraza con mucho amor a **${user}**\n\n*¡Los abrazos hacen el día más feliz!*`)
                .setImage(data.url)
                .setFooter({ 
                    text: `💝 Comando usado por ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al obtener el GIF:', error);
            await interaction.reply({
                content: '```diff\n- ❌ ¡Ups! Algo salió mal, pero toma este abrazo virtual 🤗\n```',
                ephemeral: true
            });
        }
    }
}; 