const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// Sistema de advertencias global
if (!global.warnings) {
    global.warnings = new Map();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('🛡️ Sistema de advertencias')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Añade una advertencia a un usuario')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('Usuario a advertir')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('razón')
                        .setDescription('Razón de la advertencia')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Elimina una advertencia de un usuario')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('Usuario')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('ID de la advertencia')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Muestra las advertencias de un usuario')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('Usuario')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Elimina todas las advertencias de un usuario')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('Usuario')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('usuario');
        const guildWarnings = global.warnings.get(interaction.guildId) || new Map();

        try {
            switch (subcommand) {
                case 'add': {
                    const reason = interaction.options.getString('razón');
                    const userWarnings = guildWarnings.get(user.id) || [];
                    
                    const warning = {
                        id: userWarnings.length + 1,
                        reason,
                        moderator: interaction.user.id,
                        timestamp: Date.now()
                    };

                    userWarnings.push(warning);
                    guildWarnings.set(user.id, userWarnings);
                    global.warnings.set(interaction.guildId, guildWarnings);

                    const embed = new EmbedBuilder()
                        .setColor('#ff9900')
                        .setTitle('⚠️ Nueva Advertencia')
                        .addFields(
                            { name: '👤 Usuario', value: user.tag, inline: true },
                            { name: '🆔 Warn ID', value: `#${warning.id}`, inline: true },
                            { name: '👮 Moderador', value: interaction.user.tag, inline: true },
                            { name: '📝 Razón', value: reason }
                        )
                        .setFooter({ text: `Total de advertencias: ${userWarnings.length}` })
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'remove': {
                    const warnId = interaction.options.getInteger('id');
                    const userWarnings = guildWarnings.get(user.id) || [];
                    
                    const index = userWarnings.findIndex(w => w.id === warnId);
                    if (index === -1) {
                        return await interaction.reply({
                            content: '```diff\n- ❌ No se encontró la advertencia especificada.\n```',
                            ephemeral: true
                        });
                    }

                    userWarnings.splice(index, 1);
                    guildWarnings.set(user.id, userWarnings);
                    global.warnings.set(interaction.guildId, guildWarnings);

                    await interaction.reply({
                        content: `\`\`\`diff\n+ ✅ Se eliminó la advertencia #${warnId} de ${user.tag}.\n\`\`\``,
                        ephemeral: true
                    });
                    break;
                }

                case 'list': {
                    const userWarnings = guildWarnings.get(user.id) || [];
                    
                    if (userWarnings.length === 0) {
                        return await interaction.reply({
                            content: `\`\`\`diff\n+ ℹ️ ${user.tag} no tiene advertencias.\n\`\`\``,
                            ephemeral: true
                        });
                    }

                    const embed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle(`📋 Advertencias de ${user.tag}`)
                        .setDescription(userWarnings.map(w => 
                            `**#${w.id}** | <t:${Math.floor(w.timestamp / 1000)}:R>\n` +
                            `👮 Por: <@${w.moderator}>\n` +
                            `📝 Razón: ${w.reason}\n`
                        ).join('\n'))
                        .setFooter({ text: `Total: ${userWarnings.length} advertencias` })
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'clear': {
                    guildWarnings.delete(user.id);
                    global.warnings.set(interaction.guildId, guildWarnings);

                    await interaction.reply({
                        content: `\`\`\`diff\n+ ✅ Se eliminaron todas las advertencias de ${user.tag}.\n\`\`\``,
                        ephemeral: true
                    });
                    break;
                }
            }

        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '```diff\n- ❌ Hubo un error al procesar el comando.\n```',
                ephemeral: true
            });
        }
    }
}; 