const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('🛡️ Desbanea a un usuario del servidor')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('ID del usuario a desbanear')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razón')
                .setDescription('Razón del desbaneo')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        const userId = interaction.options.getString('id');
        const reason = interaction.options.getString('razón') || 'No especificada';

        try {
            const banList = await interaction.guild.bans.fetch();
            const bannedUser = banList.get(userId);

            if (!bannedUser) {
                return await interaction.reply({
                    content: '```diff\n- ❌ Este usuario no está baneado.\n```',
                    ephemeral: true
                });
            }

            await interaction.guild.members.unban(userId, `${reason} | Por: ${interaction.user.tag}`);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🔓 Usuario Desbaneado')
                .addFields(
                    { name: '👤 Usuario', value: `${bannedUser.user.tag}`, inline: true },
                    { name: '🆔 ID', value: userId, inline: true },
                    { name: '👮 Moderador', value: interaction.user.tag, inline: true },
                    { name: '📝 Razón', value: reason }
                )
                .setThumbnail(bannedUser.user.displayAvatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '```diff\n- ❌ No se pudo desbanear al usuario.\n```',
                ephemeral: true
            });
        }
    }
}; 