const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roles')
        .setDescription('📋 Muestra la lista de roles del servidor'),
    async execute(interaction) {
        const roles = interaction.guild.roles.cache
            .sort((a, b) => b.position - a.position)
            .map(role => {
                return {
                    name: role.name,
                    id: role.id,
                    color: role.hexColor,
                    members: role.members.size,
                    position: role.position
                };
            })
            .filter(role => role.name !== '@everyone');

        const totalRoles = roles.length;
        const rolesPerPage = 15;
        const pages = Math.ceil(totalRoles / rolesPerPage);
        let currentPage = 0;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`🎭 Roles de ${interaction.guild.name}`)
            .setDescription(roles
                .slice(currentPage * rolesPerPage, (currentPage + 1) * rolesPerPage)
                .map(role => `<@&${role.id}> • ${role.members} miembros`)
                .join('\n'))
            .setFooter({ 
                text: `Total: ${totalRoles} roles | Página ${currentPage + 1}/${pages}` 
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
}; 