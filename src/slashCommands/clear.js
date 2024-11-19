const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('🛡️ Elimina una cantidad de mensajes del canal')
        .addIntegerOption(option =>
            option.setName('cantidad')
                .setDescription('Cantidad de mensajes a eliminar (1-100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true))
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Filtrar mensajes por usuario')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const amount = interaction.options.getInteger('cantidad');
        const user = interaction.options.getUser('usuario');

        try {
            await interaction.deferReply({ ephemeral: true });
            
            const messages = await interaction.channel.messages.fetch({ limit: amount });
            
            if (user) {
                const filtered = messages.filter(msg => msg.author.id === user.id);
                await interaction.channel.bulkDelete(filtered, true);
                
                await interaction.editReply({
                    content: `\`\`\`diff\n+ ✅ Se eliminaron ${filtered.size} mensajes de ${user.tag}.\n\`\`\``,
                    ephemeral: true
                });
            } else {
                await interaction.channel.bulkDelete(amount, true);
                
                await interaction.editReply({
                    content: `\`\`\`diff\n+ ✅ Se eliminaron ${amount} mensajes.\n\`\`\``,
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: '```diff\n- ❌ No se pudieron eliminar los mensajes. Asegúrate de que no sean más antiguos de 14 días.\n```',
                ephemeral: true
            });
        }
    }
}; 