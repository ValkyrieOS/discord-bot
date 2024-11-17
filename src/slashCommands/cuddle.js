const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cuddle')
        .setDescription('🤗 Acurrúcate con alguien especial')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('Usuario con quien quieres acurrucarte')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        
        if (user.id === interaction.user.id) {
            return await interaction.reply({
                content: '```diff\n- ❌ ¿Necesitas un abrazo? ¡Pídele a alguien que te acurruque!\n```',
                ephemeral: true
            });
        }

        try {
            const response = await fetch('https://nekos.life/api/v2/img/cuddle');
            const data = await response.json();
            
            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setAuthor({
                    name: '💫 Interacción Social',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setDescription(`### 🤗 ¡Momento tierno!\n\n> **${interaction.user}** se acurruca con **${user}**\n\n*¡Qué momento tan dulce!*`)
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
                content: '```diff\n- ❌ ¡Ups! No pude acurrucarme, ¡pero el sentimiento es lo que cuenta! 🤗\n```',
                ephemeral: true
            });
        }
    }
}; 