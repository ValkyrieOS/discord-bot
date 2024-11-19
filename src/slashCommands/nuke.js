const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('🛡️ Elimina y recrea un canal')
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal a limpiar (por defecto el actual)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const channel = interaction.options.getChannel('canal') || interaction.channel;

        try {
            await interaction.deferReply({ ephemeral: true });

            // Guardar información del canal
            const position = channel.position;
            const permissions = channel.permissionOverwrites.cache;
            const name = channel.name;
            const type = channel.type;
            const parent = channel.parent;
            const topic = channel.topic;

            // Eliminar y recrear el canal
            await channel.delete();
            const newChannel = await interaction.guild.channels.create({
                name: name,
                type: type,
                parent: parent,
                topic: topic,
                position: position,
                permissionOverwrites: permissions
            });

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('💥 Canal Limpiado')
                .addFields(
                    { name: '📝 Canal', value: newChannel.toString(), inline: true },
                    { name: '👮 Moderador', value: interaction.user.tag, inline: true }
                )
                .setTimestamp();

            await newChannel.send({ embeds: [embed] });
            
            // Notificar al moderador
            await interaction.editReply({
                content: `\`\`\`diff\n+ ✅ Canal limpiado exitosamente: ${newChannel.toString()}\n\`\`\``,
                ephemeral: true
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: '```diff\n- ❌ No se pudo limpiar el canal.\n```',
                ephemeral: true
            });
        }
    }
}; 