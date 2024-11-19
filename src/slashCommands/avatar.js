const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('🖼️ Muestra el avatar de un usuario')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario del que quieres ver el avatar')
                .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario') || interaction.user;
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Avatar de ${user.username}`)
            .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
            .setDescription(`[PNG](${user.displayAvatarURL({ format: 'png', size: 4096 })}) • [JPG](${user.displayAvatarURL({ format: 'jpg', size: 4096 })}) • [WEBP](${user.displayAvatarURL({ format: 'webp', size: 4096 })})`)
            .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
}; 