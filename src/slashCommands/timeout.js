const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('🛡️ Silencia temporalmente a un usuario')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario a silenciar')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duración')
                .setDescription('Duración del silencio')
                .setRequired(true)
                .addChoices(
                    { name: '60 segundos', value: '60' },
                    { name: '5 minutos', value: '300' },
                    { name: '10 minutos', value: '600' },
                    { name: '1 hora', value: '3600' },
                    { name: '1 día', value: '86400' },
                    { name: '1 semana', value: '604800' }
                ))
        .addStringOption(option =>
            option.setName('razón')
                .setDescription('Razón del silencio')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        const duration = parseInt(interaction.options.getString('duración'));
        const reason = interaction.options.getString('razón') || 'No especificada';

        try {
            const member = await interaction.guild.members.fetch(user.id);
            
            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return await interaction.reply({
                    content: '```diff\n- ❌ No puedes silenciar a alguien con un rol igual o superior al tuyo.\n```',
                    ephemeral: true
                });
            }

            await member.timeout(duration * 1000, `${reason} | Por: ${interaction.user.tag}`);

            const embed = new EmbedBuilder()
                .setColor('#ffff00')
                .setTitle('🔇 Usuario Silenciado')
                .addFields(
                    { name: '👤 Usuario', value: `${user.tag}`, inline: true },
                    { name: '🆔 ID', value: user.id, inline: true },
                    { name: '👮 Moderador', value: interaction.user.tag, inline: true },
                    { name: '⏱️ Duración', value: `<t:${Math.floor(Date.now()/1000) + duration}:R>`, inline: true },
                    { name: '📝 Razón', value: reason }
                )
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '```diff\n- ❌ No se pudo silenciar al usuario.\n```',
                ephemeral: true
            });
        }
    }
}; 