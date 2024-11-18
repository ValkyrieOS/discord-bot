const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('📝 Sistema de sugerencias')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Crea una nueva sugerencia')
                .addStringOption(option =>
                    option.setName('sugerencia')
                        .setDescription('Tu sugerencia')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Configura el canal de sugerencias')
                .addChannelOption(option =>
                    option.setName('canal')
                        .setDescription('Canal para las sugerencias')
                        .setRequired(true))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'setup': {
                // Verificar permisos de administrador
                if (!interaction.member.permissions.has('Administrator')) {
                    return await interaction.reply({
                        content: '```diff\n- ❌ Necesitas permisos de administrador para configurar el sistema\n```',
                        ephemeral: true
                    });
                }

                const channel = interaction.options.getChannel('canal');

                // Verificar que sea un canal de texto
                if (channel.type !== 0) {
                    return await interaction.reply({
                        content: '```diff\n- ❌ Debes seleccionar un canal de texto\n```',
                        ephemeral: true
                    });
                }

                // Guardar configuración
                if (!global.serverConfig) {
                    global.serverConfig = new Map();
                }

                global.serverConfig.set(interaction.guildId, {
                    ...global.serverConfig.get(interaction.guildId),
                    suggestionsChannel: channel.id
                });

                await interaction.reply({
                    content: `✅ Canal de sugerencias configurado en <#${channel.id}>`,
                    ephemeral: true
                });
                break;
            }

            case 'create': {
                // Verificar si el sistema está configurado
                const serverConfig = global.serverConfig?.get(interaction.guildId);
                if (!serverConfig?.suggestionsChannel) {
                    return await interaction.reply({
                        content: '```diff\n- ❌ El sistema de sugerencias no está configurado\n- Un administrador debe usar /suggest setup primero\n```',
                        ephemeral: true
                    });
                }

                const suggestion = interaction.options.getString('sugerencia');
                const channel = await interaction.guild.channels.fetch(serverConfig.suggestionsChannel);

                if (!channel) {
                    return await interaction.reply({
                        content: '```diff\n- ❌ El canal de sugerencias no fue encontrado\n```',
                        ephemeral: true
                    });
                }

                // Crear embed de la sugerencia
                const embed = new EmbedBuilder()
                    .setTitle('📝 Nueva Sugerencia')
                    .setColor('#2F3136')
                    .addFields(
                        { 
                            name: '💭 Sugerencia', 
                            value: suggestion 
                        },
                        { 
                            name: '📊 Estado', 
                            value: '```\n⬆️ 0 votos (0%)\n⬇️ 0 votos (0%)\n\nTotal: 0 votos```' 
                        }
                    )
                    .setFooter({
                        text: `Sugerido por ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTimestamp();

                // Crear botones de votación
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('vote_up')
                            .setLabel('0')
                            .setEmoji('⬆️')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('vote_down')
                            .setLabel('0')
                            .setEmoji('⬇️')
                            .setStyle(ButtonStyle.Danger)
                    );

                const message = await channel.send({
                    embeds: [embed],
                    components: [row]
                });

                // Inicializar votos
                if (!global.suggestions) {
                    global.suggestions = new Map();
                }

                global.suggestions.set(message.id, {
                    upvotes: new Set(),
                    downvotes: new Set()
                });

                await interaction.reply({
                    content: `✅ Tu sugerencia ha sido publicada en <#${channel.id}>`,
                    ephemeral: true
                });
                break;
            }
        }
    }
}; 