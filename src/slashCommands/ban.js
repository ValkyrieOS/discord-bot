const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('🔨 Banea a un usuario del servidor')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('El usuario a banear')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Razón del baneo')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('dias')
                .setDescription('Días de mensajes a eliminar')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razon');
        const days = interaction.options.getNumber('dias') || 0;
        
        try {
            const member = await interaction.guild.members.fetch(user.id);
            
            // Verificar jerarquía de roles
            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return await interaction.reply({
                    content: '```diff\n- ❌ No puedes banear a alguien con un rol igual o superior al tuyo.\n```',
                    ephemeral: true
                });
            }

            // Verificar si el bot puede banear al usuario
            if (!member.bannable) {
                return await interaction.reply({
                    content: '```diff\n- ❌ No tengo permisos para banear a este usuario.\n```',
                    ephemeral: true
                });
            }

            // Crear embed para el log
            const banEmbed = new EmbedBuilder()
                .setTitle('🔨 Usuario Baneado')
                .setColor('#FF0000')
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Usuario', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Moderador', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Razón', value: reason },
                    { name: 'Mensajes eliminados', value: `${days} días`, inline: true }
                )
                .setTimestamp();

            // Intentar enviar DM al usuario
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🔨 Has sido baneado')
                    .setColor('#FF0000')
                    .setDescription(`Has sido baneado de **${interaction.guild.name}**\n\n**Razón:**\n\`\`\`${reason}\`\`\``)
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log('No se pudo enviar DM al usuario');
            }

            // Banear al usuario
            await member.ban({ deleteMessageDays: days, reason: reason });

            // Enviar confirmación
            await interaction.reply({ embeds: [banEmbed] });

            // Enviar al canal de logs si existe
            try {
                const canalLogsId = global.logsChannels.get(interaction.guild.id);
                if (canalLogsId) {
                    const canalLogs = await interaction.guild.channels.fetch(canalLogsId);
                    if (canalLogs) {
                        await canalLogs.send({ embeds: [banEmbed] });
                    }
                }
            } catch (error) {
                console.log('No se pudo enviar al canal de logs');
            }

        } catch (error) {
            console.error('Error al banear:', error);
            await interaction.reply({
                content: '```diff\n- ❌ Hubo un error al intentar banear al usuario.\n```',
                ephemeral: true
            });
        }
    }
}; 