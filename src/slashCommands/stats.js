const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Muestra estadísticas detalladas del servidor'),
    async execute(interaction) {
        const guild = interaction.guild;
        const members = await guild.members.fetch();
        
        // Estadísticas de miembros
        const totalMembers = guild.memberCount;
        const humans = members.filter(member => !member.user.bot).size;
        const bots = members.filter(member => member.user.bot).size;
        const online = members.filter(member => member.presence?.status === 'online').size;
        const offline = members.filter(member => !member.presence || member.presence.status === 'offline').size;

        // Estadísticas de canales
        const channels = guild.channels.cache;
        const textChannels = channels.filter(c => c.type === 0).size;
        const voiceChannels = channels.filter(c => c.type === 2).size;
        const categories = channels.filter(c => c.type === 4).size;

        // Estadísticas de roles y emojis
        const roles = guild.roles.cache.size;
        const emojis = guild.emojis.cache.size;

        const embed = new EmbedBuilder()
            .setTitle(`📊 Estadísticas de ${guild.name}`)
            .setColor('#0099ff')
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                {
                    name: '👥 Miembros',
                    value: [
                        `Total: **${totalMembers}**`,
                        `Usuarios: **${humans}**`,
                        `Bots: **${bots}**`,
                        `En línea: **${online}**`,
                        `Desconectados: **${offline}**`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '💬 Canales',
                    value: [
                        `Total: **${channels.size}**`,
                        `Texto: **${textChannels}**`,
                        `Voz: **${voiceChannels}**`,
                        `Categorías: **${categories}**`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎭 Otros',
                    value: [
                        `Roles: **${roles}**`,
                        `Emojis: **${emojis}**`,
                        `Nivel de Boost: **${guild.premiumTier}**`,
                        `Boosts: **${guild.premiumSubscriptionCount}**`
                    ].join('\n'),
                    inline: true
                }
            )
            .setFooter({ text: `ID: ${guild.id} • Creado el ${guild.createdAt.toLocaleDateString()}` });

        await interaction.reply({ embeds: [embed] });
    }
}; 