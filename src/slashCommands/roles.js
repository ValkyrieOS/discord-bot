const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roles')
        .setDescription('Gestiona los roles del servidor')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lista todos los roles del servidor'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Muestra información sobre un rol específico')
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('El rol a inspeccionar')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('members')
                .setDescription('Lista los miembros que tienen un rol específico')
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('El rol a inspeccionar')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'list': {
                const roles = interaction.guild.roles.cache
                    .sort((a, b) => b.position - a.position)
                    .map(role => `${role} (${role.members.size} miembros)`);

                const embed = new EmbedBuilder()
                    .setTitle('📋 Lista de Roles')
                    .setColor('#0099ff')
                    .setDescription(roles.join('\n'))
                    .setFooter({ text: `Total: ${roles.length} roles` });

                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'info': {
                const role = interaction.options.getRole('rol');
                const permissions = role.permissions.toArray().join(', ');

                const embed = new EmbedBuilder()
                    .setTitle(`ℹ️ Información del Rol: ${role.name}`)
                    .setColor(role.color)
                    .addFields(
                        { name: 'ID', value: role.id, inline: true },
                        { name: 'Color', value: role.hexColor, inline: true },
                        { name: 'Posición', value: `${role.position}`, inline: true },
                        { name: 'Miembros', value: `${role.members.size}`, inline: true },
                        { name: 'Mencionable', value: role.mentionable ? 'Sí' : 'No', inline: true },
                        { name: 'Mostrado separadamente', value: role.hoist ? 'Sí' : 'No', inline: true },
                        { name: 'Permisos', value: permissions || 'Ninguno' }
                    );

                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'members': {
                const role = interaction.options.getRole('rol');
                const members = role.members.map(member => `${member.user.tag}`);

                const embed = new EmbedBuilder()
                    .setTitle(`👥 Miembros con el rol ${role.name}`)
                    .setColor(role.color)
                    .setDescription(members.join('\n') || 'No hay miembros con este rol')
                    .setFooter({ text: `Total: ${members.length} miembros` });

                await interaction.reply({ embeds: [embed] });
                break;
            }
        }
    }
}; 