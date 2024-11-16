const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

// Crear una Collection global para almacenar los canales de logs
if (!global.logsChannels) {
    global.logsChannels = new Map();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlogs')
        .setDescription('Configura el canal de logs de sanciones')
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal donde se enviarán los logs')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        try {
            if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({
                    content: '```diff\n- ❌ Solo los administradores pueden configurar el canal de logs.\n```',
                    ephemeral: true
                });
            }

            const canal = interaction.options.getChannel('canal');
            
            // Verificar permisos del bot en el canal
            const permissions = canal.permissionsFor(interaction.guild.members.me);
            if (!permissions.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
                return await interaction.reply({
                    content: '```diff\n- ❌ No tengo los permisos necesarios en ese canal. Necesito: Ver canal, Enviar mensajes y Enviar enlaces.\n```',
                    ephemeral: true
                });
            }

            // Guardar el canal en la memoria
            global.logsChannels.set(interaction.guild.id, canal.id);

            // Verificar que funciona enviando un mensaje de prueba
            try {
                await canal.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('✅ Canal de Logs Configurado')
                            .setDescription('Este canal ha sido configurado como canal de logs de sanciones.')
                            .setColor('#00FF00')
                            .setTimestamp()
                    ]
                });
            } catch (error) {
                console.error('Error al enviar mensaje de prueba:', error);
                return await interaction.reply({
                    content: '```diff\n- ❌ No pude enviar un mensaje de prueba al canal. Por favor verifica mis permisos.\n```',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('✅ Canal de Logs Configurado')
                .setColor('#00FF00')
                .setDescription(`Los logs de sanciones serán enviados a ${canal}`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error en comando setlogs:', error);
            await interaction.reply({
                content: '```diff\n- ❌ Hubo un error al configurar el canal de logs.\n```',
                ephemeral: true
            });
        }
    },
}; 