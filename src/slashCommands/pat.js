const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pat')
        .setDescription('✨ Dale una palmadita cariñosa a alguien')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('Usuario a quien quieres dar una palmadita')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        
        if (user.id === interaction.user.id) {
            return await interaction.reply({
                content: '```diff\n- ❌ ¿Por qué querrías darte palmaditas a ti mismo?\n```',
                ephemeral: true
            });
        }

        try {
            const response = await fetch('https://nekos.life/api/v2/img/pat');
            const data = await response.json();
            
            const embed = new EmbedBuilder()
                .setColor('#9400D3')
                .setAuthor({
                    name: '💫 Interacción Social',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setDescription(`### ✨ ¡Palmadita cariñosa!\n\n> **${interaction.user}** le da unas tiernas palmaditas a **${user}**\n\n*¡Las palmaditas siempre alegran el día!*`)
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
                content: '```diff\n- ❌ ¡Ups! No pude dar la palmadita, ¡pero toma este cariño virtual! ✨\n```',
                ephemeral: true
            });
        }
    }
}; 