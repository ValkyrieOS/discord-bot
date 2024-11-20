const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadConfig, saveConfig } = require('../utils/configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prefix')
        .setDescription('🏷️ Sistema de prefijos automáticos')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Configura un prefijo para un rol')
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('El rol al que se aplicará el prefijo')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('prefijo')
                        .setDescription('El prefijo que se añadirá (usa {username} para el nombre)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Elimina el prefijo de un rol')
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('El rol del que se eliminará el prefijo')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription('Comprueba y aplica todos los prefijos'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Muestra todos los prefijos configurados'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
    async execute(interaction) {
        try {
            await interaction.deferReply();
            const subcommand = interaction.options.getSubcommand();

            // Cargar configuración desde el archivo
            const config = await loadConfig();

            switch (subcommand) {
                case 'setup': {
                    const role = interaction.options.getRole('rol');
                    const prefix = interaction.options.getString('prefijo');

                    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageNicknames)) {
                        return await interaction.editReply({
                            content: '❌ No tengo permisos para cambiar apodos en este servidor.',
                            ephemeral: true
                        });
                    }

                    // Guardar en la variable global
                    if (!global.prefixConfig.has(interaction.guildId)) {
                        global.prefixConfig.set(interaction.guildId, {});
                    }
                    const guildPrefixes = global.prefixConfig.get(interaction.guildId);
                    guildPrefixes[role.id] = prefix;
                    global.prefixConfig.set(interaction.guildId, guildPrefixes);

                    // Guardar en el archivo de configuración
                    if (!config.prefix) config.prefix = {};
                    config.prefix[interaction.guildId] = guildPrefixes;
                    await saveConfig(config);

                    // Aplicar el prefijo a todos los miembros con ese rol
                    const members = interaction.guild.members.cache.filter(member => member.roles.cache.has(role.id));
                    let applied = 0;
                    let failed = 0;

                    for (const [, member] of members) {
                        try {
                            const newNickname = prefix.replace('{username}', member.user.username);
                            await member.setNickname(newNickname);
                            applied++;
                        } catch {
                            failed++;
                        }
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('✅ Prefijo Configurado')
                        .setColor('#00FF00')
                        .setDescription(`Prefijo configurado para el rol ${role}`)
                        .addFields(
                            { name: '📝 Prefijo', value: `\`${prefix}\``, inline: true },
                            { name: '✅ Aplicados', value: `${applied}`, inline: true },
                            { name: '❌ Fallidos', value: `${failed}`, inline: true }
                        )
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'remove': {
                    const role = interaction.options.getRole('rol');
                    const guildPrefixes = global.prefixConfig.get(interaction.guildId);

                    if (!guildPrefixes || !guildPrefixes[role.id]) {
                        return await interaction.editReply({
                            content: '❌ No hay ningún prefijo configurado para ese rol.',
                            ephemeral: true
                        });
                    }

                    // Eliminar de la variable global
                    delete guildPrefixes[role.id];
                    if (Object.keys(guildPrefixes).length === 0) {
                        global.prefixConfig.delete(interaction.guildId);
                    } else {
                        global.prefixConfig.set(interaction.guildId, guildPrefixes);
                    }

                    // Actualizar archivo de configuración
                    if (!config.prefix) config.prefix = {};
                    if (Object.keys(guildPrefixes).length === 0) {
                        delete config.prefix[interaction.guildId];
                    } else {
                        config.prefix[interaction.guildId] = guildPrefixes;
                    }
                    await saveConfig(config);

                    // Restaurar nombres originales
                    const members = interaction.guild.members.cache.filter(member => member.roles.cache.has(role.id));
                    let restored = 0;
                    let failed = 0;

                    for (const [, member] of members) {
                        try {
                            await member.setNickname(null);
                            restored++;
                        } catch {
                            failed++;
                        }
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('🗑️ Prefijo Eliminado')
                        .setColor('#FF0000')
                        .setDescription(`Prefijo eliminado del rol ${role}`)
                        .addFields(
                            { name: '✅ Restaurados', value: `${restored}`, inline: true },
                            { name: '❌ Fallidos', value: `${failed}`, inline: true }
                        )
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'check': {
                    const guildPrefixes = global.prefixConfig.get(interaction.guildId);
                    if (!guildPrefixes) {
                        return await interaction.editReply({
                            content: '❌ No hay prefijos configurados en este servidor.',
                            ephemeral: true
                        });
                    }

                    let applied = 0;
                    let failed = 0;

                    // Aplicar todos los prefijos configurados
                    for (const [roleId, prefix] of Object.entries(guildPrefixes)) {
                        const role = await interaction.guild.roles.fetch(roleId);
                        if (!role) continue;

                        const members = interaction.guild.members.cache.filter(member => member.roles.cache.has(roleId));
                        for (const [, member] of members) {
                            try {
                                const newNickname = prefix.replace('{username}', member.user.username);
                                await member.setNickname(newNickname);
                                applied++;
                            } catch {
                                failed++;
                            }
                        }
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('🔄 Prefijos Verificados')
                        .setColor('#0099FF')
                        .addFields(
                            { name: '✅ Aplicados', value: `${applied}`, inline: true },
                            { name: '❌ Fallidos', value: `${failed}`, inline: true }
                        )
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'list': {
                    const guildPrefixes = global.prefixConfig.get(interaction.guildId);
                    if (!guildPrefixes || Object.keys(guildPrefixes).length === 0) {
                        return await interaction.editReply({
                            content: '❌ No hay prefijos configurados en este servidor.',
                            ephemeral: true
                        });
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('📋 Lista de Prefijos')
                        .setColor('#0099FF')
                        .setDescription('Prefijos configurados en este servidor:')
                        .setTimestamp();

                    for (const [roleId, prefix] of Object.entries(guildPrefixes)) {
                        const role = await interaction.guild.roles.fetch(roleId);
                        if (role) {
                            embed.addFields({
                                name: role.name,
                                value: `\`${prefix}\``,
                                inline: true
                            });
                        }
                    }

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
            }
        } catch (error) {
            console.error('Error en comando prefix:', error);
            await interaction.followUp({
                content: '❌ Hubo un error al ejecutar el comando.',
                ephemeral: true
            });
        }
    }
}; 