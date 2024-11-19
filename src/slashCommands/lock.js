const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('🛡️ Bloquea o desbloquea un canal')
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal a bloquear/desbloquear (por defecto el actual)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('razón')
                .setDescription('Razón del bloqueo')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const channel = interaction.options.getChannel('canal') || interaction.channel;
        const reason = interaction.options.getString('razón') || 'No especificada';

        try {
            const isLocked = channel.permissionsFor(interaction.guild.roles.everyone).has('SendMessages');
            
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: isLocked ? false : true
            });

            const embed = new EmbedBuilder()
                .setColor(isLocked ? '#ff0000' : '#00ff00')
                .setTitle(`🔒 Canal ${isLocked ? 'Bloqueado' : 'Desbloqueado'}`)
                .addFields(
                    { name: '📝 Razón', value: reason },
                    { name: '👮 Moderador', value: interaction.user.tag }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '```diff\n- ❌ No se pudo modificar el canal.\n```',
                ephemeral: true
            });
        }
    }
}; 