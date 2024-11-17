const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('feed')
        .setDescription('🍪 Dale de comer a alguien')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('Usuario a quien quieres alimentar')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        
        if (user.id === interaction.user.id) {
            return await interaction.reply({
                content: '```diff\n- ❌ ¿No puedes alimentarte tú mismo?\n```',
                ephemeral: true
            });
        }

        try {
            const response = await fetch('https://nekos.life/api/v2/img/feed');
            const data = await response.json();
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setAuthor({
                    name: '💫 Interacción Social',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setDescription(`### 🍪 ¡Hora de comer!\n\n> **${interaction.user}** alimenta a **${user}**\n\n*¡Qué delicioso!*`)
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
                content: '```diff\n- ❌ ¡Ups! No pude darte de comer, ¡pero la intención es lo que cuenta! 🍪\n```',
                ephemeral: true
            });
        }
    }
}; 