const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('🔇 Mutea temporalmente a un usuario')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('El usuario a mutear')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duracion')
                .setDescription('Duración del mute (1m, 1h, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Razón del mute')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        const duration = interaction.options.getString('duracion');
        const reason = interaction.options.getString('razon');

        // Convertir duración a milisegundos
        const durationRegex = /^(\d+)([mhd])$/;
        const match = duration.match(durationRegex);

        if (!match) {
            return await interaction.reply({
                content: '```diff\n- ❌ Formato de duración inválido. Usa: 1m, 1h, 1d\n```',
                ephemeral: true
            });
        }

        const [, time, unit] = match;
        const timeInMs = {
            'm': time * 60 * 1000,
            'h': time * 60 * 60 * 1000,
            'd': time * 24 * 60 * 60 * 1000
        }[unit];

        if (timeInMs > 2419200000) { // 28 días
            return await interaction.reply({
                content: '```diff\n- ❌ La duración máxima del mute es de 28 días.\n```',
                ephemeral: true
            });
        }

        try {
            const member = await interaction.guild.members.fetch(user.id);

            // Verificar jerarquía de roles
            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return await interaction.reply({
                    content: '```diff\n- ❌ No puedes mutear a alguien con un rol igual o superior al tuyo.\n```',
                    ephemeral: true
                });
            }

            // Verificar si el bot puede mutear al usuario
            if (!member.moderatable) {
                return await interaction.reply({
                    content: '```diff\n- ❌ No tengo permisos para mutear a este usuario.\n```',
                    ephemeral: true
                });
            }

            // Crear embed para el log
            const muteEmbed = new EmbedBuilder()
                .setTitle('🔇 Usuario Muteado')
                .setColor('#FFA500')
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Usuario', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Moderador', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Duración', value: duration, inline: true },
                    { name: 'Razón', value: reason }
                )
                .setTimestamp();

            // Intentar enviar DM al usuario
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🔇 Has sido muteado')
                    .setColor('#FFA500')
                    .setDescription(`Has sido muteado en **${interaction.guild.name}**\n\n**Duración:** ${duration}\n**Razón:**\n\`\`\`${reason}\`\`\``)
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log('No se pudo enviar DM al usuario');
            }

            // Mutear al usuario
            await member.timeout(timeInMs, reason);

            // Enviar confirmación
            await interaction.reply({ embeds: [muteEmbed] });

            // Enviar al canal de logs si existe
            try {
                const canalLogsId = global.logsChannels.get(interaction.guild.id);
                if (canalLogsId) {
                    const canalLogs = await interaction.guild.channels.fetch(canalLogsId);
                    if (canalLogs) {
                        await canalLogs.send({ embeds: [muteEmbed] });
                    }
                }
            } catch (error) {
                console.log('No se pudo enviar al canal de logs');
            }

        } catch (error) {
            console.error('Error al mutear:', error);
            await interaction.reply({
                content: '```diff\n- ❌ Hubo un error al intentar mutear al usuario.\n```',
                ephemeral: true
            });
        }
    }
}; 