const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const fs = require('fs').promises;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('📥 Gestiona la configuración del servidor')
        .addSubcommand(subcommand =>
            subcommand
                .setName('export')
                .setDescription('Exporta la configuración actual del servidor'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('import')
                .setDescription('Importa una configuración desde un archivo')
                .addAttachmentOption(option =>
                    option.setName('archivo')
                        .setDescription('Archivo JSON con la configuración')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'export': {
                    // Recopilar toda la configuración del servidor
                    const guildConfig = {
                        guildId: interaction.guildId,
                        guildName: interaction.guild.name,
                        exportDate: new Date().toISOString(),
                        prefix: {
                            roles: global.prefixConfig?.get(interaction.guildId) || {}
                        },
                        suggestions: {
                            channel: global.serverConfig?.get(interaction.guildId)?.suggestionsChannel
                        },
                        logs: {
                            channel: global.logsChannels?.get(interaction.guildId)
                        }
                        // Puedes añadir más configuraciones aquí
                    };

                    // Convertir a JSON con formato legible
                    const jsonString = JSON.stringify(guildConfig, null, 2);
                    const buffer = Buffer.from(jsonString, 'utf-8');

                    // Crear el archivo adjunto
                    const attachment = new AttachmentBuilder(buffer, {
                        name: `config_${interaction.guild.name}_${Date.now()}.json`
                    });

                    // Crear embed informativo
                    const embed = new EmbedBuilder()
                        .setTitle('📤 Configuración Exportada')
                        .setColor('#00FF00')
                        .setDescription('La configuración ha sido exportada exitosamente.')
                        .addFields(
                            { name: '🏷️ Prefijos', value: Object.keys(guildConfig.prefix.roles).length > 0 ? '✅ Incluido' : '❌ No configurado', inline: true },
                            { name: '💭 Sugerencias', value: guildConfig.suggestions.channel ? '✅ Incluido' : '❌ No configurado', inline: true },
                            { name: '📝 Logs', value: guildConfig.logs.channel ? '✅ Incluido' : '❌ No configurado', inline: true }
                        )
                        .setTimestamp();

                    await interaction.reply({
                        embeds: [embed],
                        files: [attachment],
                        ephemeral: true
                    });
                    break;
                }

                case 'import': {
                    const file = interaction.options.getAttachment('archivo');

                    // Verificar el tipo de archivo
                    if (!file.name.endsWith('.json')) {
                        return await interaction.reply({
                            content: '❌ El archivo debe ser de tipo JSON.',
                            ephemeral: true
                        });
                    }

                    try {
                        // Descargar y parsear el archivo
                        const response = await fetch(file.url);
                        const configData = await response.json();

                        // Verificar que el archivo sea válido
                        if (!configData.guildId || !configData.guildName) {
                            return await interaction.reply({
                                content: '❌ El archivo de configuración no es válido.',
                                ephemeral: true
                            });
                        }

                        // Aplicar configuraciones
                        let applied = [];

                        // Importar prefijos
                        if (configData.prefix?.roles) {
                            if (!global.prefixConfig) global.prefixConfig = new Map();
                            global.prefixConfig.set(interaction.guildId, configData.prefix.roles);
                            applied.push('🏷️ Prefijos');
                        }

                        // Importar configuración de sugerencias
                        if (configData.suggestions?.channel) {
                            if (!global.serverConfig) global.serverConfig = new Map();
                            global.serverConfig.set(interaction.guildId, {
                                ...global.serverConfig.get(interaction.guildId),
                                suggestionsChannel: configData.suggestions.channel
                            });
                            applied.push('💭 Sugerencias');
                        }

                        // Importar configuración de logs
                        if (configData.logs?.channel) {
                            if (!global.logsChannels) global.logsChannels = new Map();
                            global.logsChannels.set(interaction.guildId, configData.logs.channel);
                            applied.push('📝 Logs');
                        }

                        const embed = new EmbedBuilder()
                            .setTitle('📥 Configuración Importada')
                            .setColor('#00FF00')
                            .setDescription('La configuración ha sido importada exitosamente.')
                            .addFields({
                                name: '✅ Módulos Importados',
                                value: applied.length > 0 ? applied.join('\n') : 'Ninguno'
                            })
                            .setTimestamp();

                        await interaction.reply({
                            embeds: [embed],
                            ephemeral: true
                        });

                    } catch (error) {
                        console.error('Error al importar configuración:', error);
                        await interaction.reply({
                            content: '❌ Error al procesar el archivo de configuración.',
                            ephemeral: true
                        });
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Error en comando config:', error);
            await interaction.reply({
                content: '❌ Hubo un error al ejecutar el comando.',
                ephemeral: true
            });
        }
    }
}; 