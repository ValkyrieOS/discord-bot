const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const { createTranscript } = require('discord-html-transcripts');

// Mapa global para almacenar tickets activos
if (!global.activeTickets) {
    global.activeTickets = new Map();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('🎫 Sistema de tickets de soporte')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Configura el sistema de tickets')
                .addChannelOption(option =>
                    option.setName('canal')
                        .setDescription('Canal donde se mostrará el panel de tickets')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('staff')
                        .setDescription('Rol de staff que podrá ver los tickets')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Cierra un ticket actual'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('forceclose')
                .setDescription('Fuerza el cierre de un ticket (Solo Administradores)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Añade un usuario al ticket')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('Usuario a añadir')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remueve un usuario del ticket')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('Usuario a remover')
                        .setRequired(true))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'setup': {
                const channel = interaction.options.getChannel('canal');
                const staffRole = interaction.options.getRole('staff');

                // Verificar que el canal sea de texto
                if (channel.type !== ChannelType.GuildText) {
                    return await interaction.reply({
                        content: '```diff\n- ❌ El canal debe ser un canal de texto\n```',
                        ephemeral: true
                    });
                }

                // Verificar permisos en el canal
                if (!channel.permissionsFor(interaction.guild.members.me).has(['SendMessages', 'ViewChannel', 'EmbedLinks'])) {
                    return await interaction.reply({
                        content: '```diff\n- ❌ No tengo los permisos necesarios en ese canal\n```',
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle('🎫 Centro de Soporte')
                    .setDescription('¿Necesitas ayuda? ¡Estamos aquí para ti!')
                    .setColor('#2F3136')
                    .addFields(
                        { 
                            name: '📝 Cómo crear un ticket', 
                            value: '```\n1. Presiona el botón de abajo\n2. Describe tu problema\n3. Espera respuesta del staff\n```'
                        },
                        { 
                            name: '⚠️ Importante', 
                            value: '> • Un ticket a la vez por usuario\n> • Se paciente, el staff te atenderá pronto\n> • No abuses del sistema'
                        }
                    )
                    .setFooter({ text: 'Sistema de tickets • ' + interaction.guild.name })
                    .setTimestamp();

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('create_ticket')
                            .setLabel('Crear Ticket')
                            .setEmoji('🎫')
                            .setStyle(ButtonStyle.Primary)
                    );

                try {
                    const msg = await channel.send({
                        embeds: [embed],
                        components: [row]
                    });

                    // Inicializar la configuración global si no existe
                    if (!global.ticketConfig) {
                        global.ticketConfig = {};
                    }

                    // Guardar configuración
                    global.ticketConfig = {
                        messageId: msg.id,
                        channelId: channel.id,
                        staffRoleId: staffRole.id,
                        guildId: interaction.guild.id
                    };

                    // Guardar configuración
                    saveConfigurations();

                    await interaction.reply({
                        content: '```diff\n+ ✅ Sistema de tickets configurado correctamente\n```',
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Error al configurar tickets:', error);
                    await interaction.reply({
                        content: '```diff\n- ❌ Hubo un error al configurar el sistema de tickets\n```',
                        ephemeral: true
                    });
                }
                break;
            }
            case 'close': {
                if (!interaction.channel || !interaction.channel.name || !interaction.channel.name.startsWith('ticket-')) {
                    return await interaction.reply({
                        content: '```diff\n- ❌ Este comando solo puede usarse en canales de ticket\n```',
                        ephemeral: true
                    });
                }

                const ticketId = interaction.channel.name.split('-')[1];
                const ticket = global.activeTickets.get(ticketId);

                if (!ticket) {
                    return await interaction.reply({
                        content: '```diff\n- ❌ No se encontró información del ticket\n```',
                        ephemeral: true
                    });
                }

                // Verificar permisos
                const member = await interaction.guild.members.fetch(interaction.user.id);
                const hasPermission = member.roles.cache.has(global.ticketConfig.staffRoleId) || 
                                    ticket.userId === interaction.user.id;

                if (!hasPermission) {
                    return await interaction.reply({
                        content: '```diff\n- ❌ No tienes permiso para cerrar este ticket\n```',
                        ephemeral: true
                    });
                }

                // Crear transcript
                const transcript = await createTranscript(interaction.channel, {
                    limit: -1,
                    fileName: `ticket-${ticketId}.html`,
                });

                // Enviar transcript al canal de logs
                try {
                    const logChannel = await interaction.guild.channels.fetch(global.logsChannels.get(interaction.guild.id));
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('📝 Ticket Cerrado')
                            .setColor('#FF0000')
                            .addFields(
                                { name: 'Ticket', value: `#${ticketId}`, inline: true },
                                { name: 'Creador', value: `<@${ticket.userId}>`, inline: true },
                                { name: 'Cerrado por', value: `${interaction.user}`, inline: true },
                                { name: 'Staff Asignado', value: ticket.staffId ? `<@${ticket.staffId}>` : 'No asignado', inline: true }
                            )
                            .setTimestamp();

                        await logChannel.send({
                            embeds: [embed],
                            files: [transcript]
                        });
                    }
                } catch (error) {
                    console.error('Error al enviar transcript:', error);
                }

                // Eliminar ticket del registro
                global.activeTickets.delete(ticketId);

                // Eliminar canal
                await interaction.reply('```diff\n+ ✅ Cerrando ticket en 5 segundos...\n```');
                setTimeout(() => interaction.channel.delete(), 5000);
                break;
            }
            case 'forceclose': {
                if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
                    return await interaction.reply({
                        content: '```diff\n- ❌ Solo los administradores pueden forzar el cierre de tickets\n```',
                        ephemeral: true
                    });
                }

                if (!interaction.channel.name.startsWith('ticket-')) {
                    return await interaction.reply({
                        content: '```diff\n- ❌ Este comando solo puede usarse en canales de ticket\n```',
                        ephemeral: true
                    });
                }

                const ticketId = interaction.channel.name.split('-')[1];
                const ticket = global.activeTickets.get(ticketId);

                const closeEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Cierre Forzado de Ticket')
                    .setColor('#FF0000')
                    .addFields(
                        { name: '📝 Información', value: 
                          `> 🆔 **ID:** \`${ticketId}\`\n` +
                          `> 👤 **Creador:** ${ticket ? `<@${ticket.userId}>` : 'Desconocido'}\n` +
                          `> ⚡ **Forzado por:** ${interaction.user}\n` +
                          `> ⏰ **Fecha:** <t:${Math.floor(Date.now() / 1000)}:F>`
                        }
                    )
                    .setFooter({ text: `Sistema de Tickets • ${interaction.guild.name}` })
                    .setTimestamp();

                await interaction.reply({ embeds: [closeEmbed] });

                if (ticket) {
                    global.activeTickets.delete(ticketId);
                }

                setTimeout(() => interaction.channel.delete(), 5000);
                break;
            }
            case 'add': {
                if (!interaction.channel || !interaction.channel.name || !interaction.channel.name.startsWith('ticket-')) {
                    return await interaction.reply({
                        content: '```diff\n- ❌ Este comando solo puede usarse en canales de ticket\n```',
                        ephemeral: true
                    });
                }

                const user = interaction.options.getUser('usuario');
                await interaction.channel.permissionOverwrites.edit(user, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });

                await interaction.reply({
                    content: '```diff\n+ ✅ Se añadió a ' + user.tag + ' al ticket\n```',
                    ephemeral: true
                });
                break;
            }
            case 'remove': {
                if (!interaction.channel || !interaction.channel.name || !interaction.channel.name.startsWith('ticket-')) {
                    return await interaction.reply({
                        content: '```diff\n- ❌ Este comando solo puede usarse en canales de ticket\n```',
                        ephemeral: true
                    });
                }

                const user = interaction.options.getUser('usuario');
                await interaction.channel.permissionOverwrites.delete(user);

                await interaction.reply({
                    content: '```diff\n+ ✅ Se removió a ' + user.tag + ' del ticket\n```',
                    ephemeral: true
                });
                break;
            }
        }
    }
}; 