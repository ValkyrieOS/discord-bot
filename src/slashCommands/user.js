const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Muestra información sobre un usuario')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario a inspeccionar')
                .setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getUser('usuario') || interaction.user;
        const member = await interaction.guild.members.fetch(target.id);

        const roles = member.roles.cache
            .sort((a, b) => b.position - a.position)
            .map(role => role)
            .slice(0, -1); // Excluir @everyone

        const embed = new EmbedBuilder()
            .setTitle(`📋 Información de ${target.tag}`)
            .setColor(member.displayHexColor)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: '👤 Usuario',
                    value: [
                        `Nombre: **${target.tag}**`,
                        `ID: \`${target.id}\``,
                        `Cuenta creada: <t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
                        `Bot: ${target.bot ? 'Sí' : 'No'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📊 Miembro',
                    value: [
                        `Apodo: **${member.nickname || 'Ninguno'}**`,
                        `Se unió: <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
                        `Color: ${member.displayHexColor}`,
                        `Roles: ${roles.length}`
                    ].join('\n'),
                    inline: true
                }
            )
            .addFields({
                name: '🎭 Roles',
                value: roles.join(' ') || 'Ninguno'
            });

        await interaction.reply({ embeds: [embed] });
    }
}; 