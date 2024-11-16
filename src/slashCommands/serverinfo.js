const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Muestra información sobre el servidor'),
    async execute(interaction) {
        const server = interaction.guild;
        
        const embed = new EmbedBuilder()
            .setTitle(`Información de ${server.name}`)
            .setColor('#0099ff')
            .setThumbnail(server.iconURL({ dynamic: true }))
            .addFields(
                { name: '👥 Miembros', value: `${server.memberCount}`, inline: true },
                { name: '📅 Creado el', value: `<t:${Math.floor(server.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '👑 Dueño', value: `<@${server.ownerId}>`, inline: true },
                { name: '💬 Canales', value: `${server.channels.cache.size}`, inline: true },
                { name: '🎭 Roles', value: `${server.roles.cache.size}`, inline: true },
                { name: '🌍 Región', value: server.preferredLocale, inline: true }
            )
            .setFooter({ text: `ID: ${server.id}` });

        await interaction.reply({ embeds: [embed] });
    },
}; 