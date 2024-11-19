const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('🛡️ Gestiona roles de usuarios')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Añade un rol a un usuario')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('Usuario al que añadir el rol')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Rol a añadir')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remueve un rol de un usuario')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('Usuario del que remover el rol')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Rol a remover')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('usuario');
        const role = interaction.options.getRole('rol');

        try {
            const member = await interaction.guild.members.fetch(user.id);
            
            // Verificar jerarquía de roles
            if (role.position >= interaction.member.roles.highest.position) {
                return await interaction.reply({
                    content: '```diff\n- ❌ No puedes gestionar un rol igual o superior al tuyo.\n```',
                    ephemeral: true
                });
            }

            if (subcommand === 'add') {
                await member.roles.add(role);
                action = 'añadido a';
                color = '#00ff00';
                emoji = '➕';
            } else {
                await member.roles.remove(role);
                action = 'removido de';
                color = '#ff0000';
                emoji = '➖';
            }

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`${emoji} Rol ${action} ${user.tag}`)
                .addFields(
                    { name: '👤 Usuario', value: user.tag, inline: true },
                    { name: '🎭 Rol', value: role.name, inline: true },
                    { name: '👮 Moderador', value: interaction.user.tag, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '```diff\n- ❌ No se pudo gestionar el rol.\n```',
                ephemeral: true
            });
        }
    }
}; 