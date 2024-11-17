const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slap')
        .setDescription('👋 Dale un golpecito juguetón a alguien')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('Usuario a quien quieres dar un golpecito')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        
        if (user.id === interaction.user.id) {
            return await interaction.reply({
                content: '```diff\n- ❌ ¿Por qué querrías golpearte a ti mismo? ¡No lo hagas!\n```',
                ephemeral: true
            });
        }

        try {
            const response = await fetch('https://nekos.life/api/v2/img/slap');
            const data = await response.json();
            
            const embed = new EmbedBuilder()
                .setColor('#FF4500')
                .setAuthor({
                    name: '💫 Interacción Social',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setDescription(`### 👋 ¡Golpecito juguetón!\n\n> **${interaction.user}** le da un golpecito juguetón a **${user}**\n\n*¡Es todo diversión y juegos!*`)
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
                content: '```diff\n- ❌ ¡Ups! El golpecito falló, ¡pero fue con cariño! 👋\n```',
                ephemeral: true
            });
        }
    }
}; 