const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staffwarn')
        .setDescription('🚫 Advierte a un miembro del staff')
        .addUserOption(option =>
            option.setName('staff')
                .setDescription('Miembro del staff a advertir')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Razón de la advertencia')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        try {
            if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({
                    content: '```diff\n- ❌ Solo los administradores pueden advertir al staff.\n```',
                    ephemeral: true
                });
            }

            const staff = interaction.options.getUser('staff');
            const razon = interaction.options.getString('razon');
            const moderador = interaction.user;
            const servidor = interaction.guild.name;

            const miembro = await interaction.guild.members.fetch(staff.id).catch(() => null);
            if (!miembro) {
                return await interaction.reply({
                    content: '```diff\n- ❌ No se encontró al usuario en el servidor.\n```',
                    ephemeral: true
                });
            }

            if (staff.id === moderador.id) {
                return await interaction.reply({
                    content: '```diff\n- ❌ No puedes advertirte a ti mismo.\n```',
                    ephemeral: true
                });
            }

            if (!miembro.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return await interaction.reply({
                    content: '```diff\n- ❌ Este usuario no es miembro del staff.\n```',
                    ephemeral: true
                });
            }

            const staffWarnEmbed = new EmbedBuilder()
                .setTitle('⚠️ Advertencia de Staff')
                .setColor('#FF0000')
                .setDescription(`${staff} ha sido advertido como miembro del staff\n\n**Razón:**\n\`\`\`${razon}\`\`\``)
                .addFields(
                    { name: 'Administrador', value: `${moderador}`, inline: true },
                    { name: 'Fecha', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                )
                .setTimestamp();

            // Enviar al canal de logs
            try {
                const canalLogsId = global.logsChannels.get(interaction.guild.id);
                if (canalLogsId) {
                    const canalLogs = await interaction.guild.channels.fetch(canalLogsId);
                    if (canalLogs) {
                        await canalLogs.send({ embeds: [staffWarnEmbed] });
                    }
                }
            } catch (error) {
                console.log('No se pudo enviar al canal de logs');
            }

            // Enviar DM al staff
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Has sido advertido como Staff')
                    .setColor('#FF0000')
                    .setDescription(`Has recibido una advertencia como miembro del staff en **${servidor}**\n\n**Razón:**\n\`\`\`${razon}\`\`\``)
                    .addFields(
                        { name: 'Administrador', value: `${moderador}`, inline: true },
                        { name: 'Fecha', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                    )
                    .setTimestamp();

                await staff.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log('No se pudo enviar DM al staff');
            }

            // Enviar confirmación al canal
            await interaction.reply({ 
                content: `✅ Has advertido al staff ${staff}`,
                embeds: [staffWarnEmbed] 
            });

        } catch (error) {
            console.error('Error en comando staffwarn:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: '```diff\n- ❌ Hubo un error al ejecutar el comando.\n```',
                    ephemeral: true
                });
            }
        }
    },
}; 