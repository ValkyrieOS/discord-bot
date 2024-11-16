const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('⚠️ Advierte a un usuario')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('El usuario a advertir')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Razón de la advertencia')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        try {
            if (!interaction.memberPermissions.has(PermissionFlagsBits.ModerateMembers)) {
                return await interaction.reply({
                    content: '```diff\n- ❌ No tienes permisos para usar este comando.\n```',
                    ephemeral: true
                });
            }

            const usuario = interaction.options.getUser('usuario');
            const razon = interaction.options.getString('razon');
            const moderador = interaction.user;
            const servidor = interaction.guild.name;

            const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
            if (!miembro) {
                return await interaction.reply({
                    content: '```diff\n- ❌ No se encontró al usuario en el servidor.\n```',
                    ephemeral: true
                });
            }

            if (usuario.id === moderador.id) {
                return await interaction.reply({
                    content: '```diff\n- ❌ No puedes advertirte a ti mismo.\n```',
                    ephemeral: true
                });
            }

            if (miembro.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return await interaction.reply({
                    content: '```diff\n- ❌ No puedes advertir a un miembro del staff.\n```',
                    ephemeral: true
                });
            }

            const warnEmbed = new EmbedBuilder()
                .setTitle('⚠️ Advertencia')
                .setColor('#FF0000')
                .setDescription(`${usuario} ha sido advertido\n\n**Razón:**\n\`\`\`${razon}\`\`\``)
                .addFields(
                    { name: 'Moderador', value: `${moderador}`, inline: true },
                    { name: 'Fecha', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                )
                .setTimestamp();

            // Enviar al canal de logs
            try {
                const canalLogsId = global.logsChannels.get(interaction.guild.id);
                if (canalLogsId) {
                    const canalLogs = await interaction.guild.channels.fetch(canalLogsId);
                    if (canalLogs) {
                        await canalLogs.send({ embeds: [warnEmbed] });
                    }
                }
            } catch (error) {
                console.log('No se pudo enviar al canal de logs');
            }

            // Enviar DM al usuario
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Has sido advertido')
                    .setColor('#FF0000')
                    .setDescription(`Has recibido una advertencia en **${servidor}**\n\n**Razón:**\n\`\`\`${razon}\`\`\``)
                    .addFields(
                        { name: 'Moderador', value: `${moderador}`, inline: true },
                        { name: 'Fecha', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                    )
                    .setTimestamp();

                await usuario.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log('No se pudo enviar DM al usuario');
            }

            // Enviar confirmación al canal
            await interaction.reply({ 
                content: `✅ Has advertido a ${usuario}`,
                embeds: [warnEmbed] 
            });

        } catch (error) {
            console.error('Error en comando warn:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: '```diff\n- ❌ Hubo un error al ejecutar el comando.\n```',
                    ephemeral: true
                });
            }
        }
    },
}; 