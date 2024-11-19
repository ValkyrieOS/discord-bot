const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// Crear un Map global para almacenar la configuración de autoroles
if (!global.autoRoleConfig) {
    global.autoRoleConfig = new Map();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('🎭 Sistema de roles automáticos')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Configura el rol automático para nuevos miembros')
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Rol que se asignará automáticamente')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Desactiva el sistema de roles automáticos'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sync')
                .setDescription('Sincroniza el rol automático con todos los miembros sin roles'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'setup': {
                    const role = interaction.options.getRole('rol');

                    // Verificar permisos del bot
                    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                        return await interaction.reply({
                            content: '```diff\n- ❌ No tengo permisos para gestionar roles\n```',
                            ephemeral: true
                        });
                    }

                    // Verificar posición del rol
                    if (role.position >= interaction.guild.members.me.roles.highest.position) {
                        return await interaction.reply({
                            content: '```diff\n- ❌ No puedo asignar un rol que está por encima de mi rol más alto\n```',
                            ephemeral: true
                        });
                    }

                    // Guardar configuración
                    global.autoRoleConfig.set(interaction.guildId, role.id);

                    const embed = new EmbedBuilder()
                        .setTitle('✅ AutoRole Configurado')
                        .setColor('#00FF00')
                        .setDescription(`El rol ${role} será asignado automáticamente a los nuevos miembros.`)
                        .addFields({
                            name: '💡 Consejo',
                            value: 'Usa `/autorole sync` para aplicar el rol a los miembros existentes que no tienen roles.'
                        })
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    break;
                }

                case 'disable': {
                    global.autoRoleConfig.delete(interaction.guildId);

                    const embed = new EmbedBuilder()
                        .setTitle('🚫 AutoRole Desactivado')
                        .setColor('#FF0000')
                        .setDescription('El sistema de roles automáticos ha sido desactivado.')
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    break;
                }

                case 'sync': {
                    const roleId = global.autoRoleConfig.get(interaction.guildId);
                    if (!roleId) {
                        return await interaction.reply({
                            content: '```diff\n- ❌ El sistema de AutoRole no está configurado\n```',
                            ephemeral: true
                        });
                    }

                    const role = await interaction.guild.roles.fetch(roleId);
                    if (!role) {
                        return await interaction.reply({
                            content: '```diff\n- ❌ El rol configurado ya no existe\n```',
                            ephemeral: true
                        });
                    }

                    await interaction.deferReply({ ephemeral: true });

                    // Obtener miembros sin roles (excepto @everyone)
                    const members = await interaction.guild.members.fetch();
                    const membersWithoutRoles = members.filter(member => 
                        member.roles.cache.size === 1 && !member.user.bot
                    );

                    let applied = 0;
                    let failed = 0;

                    // Aplicar el rol a los miembros sin roles
                    for (const [, member] of membersWithoutRoles) {
                        try {
                            await member.roles.add(role);
                            applied++;
                        } catch {
                            failed++;
                        }
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('🔄 Sincronización Completada')
                        .setColor('#0099FF')
                        .addFields(
                            { name: '✅ Roles Aplicados', value: `${applied}`, inline: true },
                            { name: '❌ Fallidos', value: `${failed}`, inline: true },
                            { name: '👥 Total Procesados', value: `${membersWithoutRoles.size}`, inline: true }
                        )
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
            }
        } catch (error) {
            console.error('Error en comando autorole:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '```diff\n- ❌ Hubo un error al ejecutar el comando\n```',
                    ephemeral: true
                });
            }
        }
    }
}; 