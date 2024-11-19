const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('🛡️ Banea a un usuario del servidor')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario a banear')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razón')
                .setDescription('Razón del baneo')
                .setRequired(false))
        .addNumberOption(option =>
            option.setName('días')
                .setDescription('Días de mensajes a eliminar')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razón') || 'No especificada';
        const days = interaction.options.getNumber('días') || 0;

        try {
            const member = await interaction.guild.members.fetch(user.id);
            
            // Verificar jerarquía de roles
            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return await interaction.reply({
                    content: '```diff\n- ❌ No puedes banear a alguien con un rol igual o superior al tuyo.\n```',
                    ephemeral: true
                });
            }

            await member.ban({ deleteMessageDays: days, reason: `${reason} | Por: ${interaction.user.tag}` });

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔨 Usuario Baneado')
                .addFields(
                    { name: '👤 Usuario', value: `${user.tag}`, inline: true },
                    { name: '🆔 ID', value: user.id, inline: true },
                    { name: '👮 Moderador', value: interaction.user.tag, inline: true },
                    { name: '📝 Razón', value: reason },
                    { name: '🗑️ Mensajes eliminados', value: `${days} días` }
                )
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '```diff\n- ❌ No se pudo banear al usuario.\n```',
                ephemeral: true
            });
        }
    }
}; 