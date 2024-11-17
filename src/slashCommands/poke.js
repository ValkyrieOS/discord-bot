const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poke')
        .setDescription('👉 Toca a alguien para llamar su atención')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('Usuario a quien quieres tocar')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        
        if (user.id === interaction.user.id) {
            return await interaction.reply({
                content: '```diff\n- ❌ ¿Por qué querrías tocarte a ti mismo?\n```',
                ephemeral: true
            });
        }

        try {
            const response = await fetch('https://nekos.life/api/v2/img/poke');
            const data = await response.json();
            
            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setAuthor({
                    name: '💫 Interacción Social',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setDescription(`### 👉 ¡Hey, atención!\n\n> **${interaction.user}** toca a **${user}** para llamar su atención\n\n*¡Alguien quiere tu atención!*`)
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
                content: '```diff\n- ❌ ¡Ups! No pude tocarte, ¡pero quería llamar tu atención! 👉\n```',
                ephemeral: true
            });
        }
    }
}; 