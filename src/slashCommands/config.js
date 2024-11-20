const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadConfig, saveConfig } = require('../utils/configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('📥 Gestiona la configuración del servidor')
        .addSubcommand(subcommand =>
            subcommand
                .setName('save')
                .setDescription('Guarda la configuración actual en el archivo'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            // Verificar si es el dueño del bot
            const application = await interaction.client.application.fetch();
            if (interaction.user.id !== application.owner.id) {
                return await interaction.editReply({
                    content: '```diff\n- ❌ Solo el dueño del bot puede usar este comando.\n```',
                    ephemeral: true
                });
            }

            // Cargar la configuración actual
            const config = await loadConfig();

            // Recopilar configuración de prefijos
            config.prefix = {};
            for (const [guildId, prefixes] of global.prefixConfig) {
                config.prefix[guildId] = prefixes;
            }

            // Recopilar configuración de sugerencias
            config.suggestions = {};
            for (const [guildId, serverConfig] of global.serverConfig) {
                if (serverConfig.suggestionsChannel) {
                    config.suggestions[guildId] = {
                        channel: serverConfig.suggestionsChannel
                    };
                }
            }

            // Recopilar configuración de logs
            config.logs = {};
            for (const [guildId, channelId] of global.logsChannels) {
                config.logs[guildId] = channelId;
            }

            // Recopilar configuración de autorole
            config.autorole = {};
            for (const [guildId, roleId] of global.autoRoleConfig) {
                config.autorole[guildId] = roleId;
            }

            // Mantener la configuración de tickets si existe
            if (!config.tickets) {
                config.tickets = {};
            }
            if (global.ticketConfig) {
                config.tickets = global.ticketConfig;
            }

            // Guardar la configuración en el archivo
            await saveConfig(config);

            // Crear embed con el resumen
            const embed = new EmbedBuilder()
                .setTitle('💾 Configuración Guardada')
                .setColor('#00FF00')
                .setDescription('La configuración ha sido guardada exitosamente en el archivo.')
                .addFields(
                    { 
                        name: '🏷️ Prefijos', 
                        value: `${Object.keys(config.prefix).length} servidores`, 
                        inline: true 
                    },
                    { 
                        name: '💭 Sugerencias', 
                        value: `${Object.keys(config.suggestions).length} servidores`, 
                        inline: true 
                    },
                    { 
                        name: '📝 Logs', 
                        value: `${Object.keys(config.logs).length} servidores`, 
                        inline: true 
                    },
                    { 
                        name: '🎭 AutoRole', 
                        value: `${Object.keys(config.autorole).length} servidores`, 
                        inline: true 
                    },
                    {
                        name: '🎫 Tickets',
                        value: `${Object.keys(config.tickets || {}).length} servidores`,
                        inline: true
                    }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en comando config:', error);
            await interaction.editReply({
                content: '```diff\n- ❌ Hubo un error al ejecutar el comando.\n```',
                ephemeral: true
            });
        }
    }
}; 