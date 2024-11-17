const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// Mapa global para almacenar la configuración del antiraid
if (!global.antiraidConfig) {
    global.antiraidConfig = new Map();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antiraid')
        .setDescription('🛡️ Configura el sistema anti-raid')
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('Activa el sistema anti-raid')
                .addNumberOption(option =>
                    option.setName('joins')
                        .setDescription('Número de uniones en el período')
                        .setRequired(true)
                        .setMinValue(3)
                        .setMaxValue(20))
                .addNumberOption(option =>
                    option.setName('seconds')
                        .setDescription('Período de tiempo en segundos')
                        .setRequired(true)
                        .setMinValue(3)
                        .setMaxValue(60))
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Acción a tomar')
                        .setRequired(true)
                        .addChoices(
                            { name: '🔒 Bloquear servidor', value: 'lock' },
                            { name: '🚫 Kickear usuarios', value: 'kick' },
                            { name: '🔨 Banear usuarios', value: 'ban' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Desactiva el sistema anti-raid'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Muestra el estado actual del anti-raid'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '```diff\n- ❌ Solo los administradores pueden configurar el anti-raid.\n```',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'enable': {
                const joins = interaction.options.getNumber('joins');
                const seconds = interaction.options.getNumber('seconds');
                const action = interaction.options.getString('action');

                global.antiraidConfig.set(interaction.guild.id, {
                    enabled: true,
                    joins,
                    seconds,
                    action,
                    recentJoins: []
                });

                const embed = new EmbedBuilder()
                    .setTitle('🛡️ Anti-Raid Activado')
                    .setColor('#00FF00')
                    .setDescription(`El sistema anti-raid ha sido configurado con los siguientes parámetros:`)
                    .addFields(
                        { name: 'Uniones máximas', value: `${joins} usuarios`, inline: true },
                        { name: 'En período de', value: `${seconds} segundos`, inline: true },
                        { name: 'Acción', value: `${action === 'lock' ? '🔒 Bloquear servidor' : action === 'kick' ? '🚫 Kickear usuarios' : '🔨 Banear usuarios'}`, inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'disable': {
                global.antiraidConfig.delete(interaction.guild.id);
                
                const embed = new EmbedBuilder()
                    .setTitle('🛡️ Anti-Raid Desactivado')
                    .setColor('#FF0000')
                    .setDescription('El sistema anti-raid ha sido desactivado.')
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'status': {
                const config = global.antiraidConfig.get(interaction.guild.id);
                
                if (!config || !config.enabled) {
                    return await interaction.reply({
                        content: '```diff\n- ❌ El sistema anti-raid está desactivado en este servidor.\n```',
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle('🛡️ Estado del Anti-Raid')
                    .setColor('#0099ff')
                    .addFields(
                        { name: 'Estado', value: '✅ Activado', inline: true },
                        { name: 'Uniones máximas', value: `${config.joins} usuarios`, inline: true },
                        { name: 'En período de', value: `${config.seconds} segundos`, inline: true },
                        { name: 'Acción', value: `${config.action === 'lock' ? '🔒 Bloquear servidor' : config.action === 'kick' ? '🚫 Kickear usuarios' : '🔨 Banear usuarios'}`, inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
                break;
            }
        }
    }
}; 