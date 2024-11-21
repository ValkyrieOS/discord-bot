const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('📊 Muestra información detallada del servidor'),
    async execute(interaction) {
        try {
            const guild = interaction.guild;
            await guild.members.fetch();
            
            const totalMembers = guild.memberCount;
            const humans = guild.members.cache.filter(member => !member.user.bot).size;
            const bots = guild.members.cache.filter(member => member.user.bot).size;
            const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
            const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
            const categories = guild.channels.cache.filter(c => c.type === 4).size;
            const roles = guild.roles.cache.size - 1; // -1 para excluir @everyone

            const embed = new EmbedBuilder()
                .setTitle(`📊 Información de ${guild.name}`)
                .setColor('#0099ff')
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .addFields(
                    { 
                        name: '👑 Dueño', 
                        value: `<@${guild.ownerId}>`,
                        inline: true 
                    },
                    { 
                        name: '📅 Creado', 
                        value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
                        inline: true 
                    },
                    { 
                        name: '🌍 Región', 
                        value: guild.preferredLocale,
                        inline: true 
                    },
                    { 
                        name: '👥 Miembros', 
                        value: `Total: ${totalMembers}\nUsuarios: ${humans}\nBots: ${bots}`,
                        inline: true 
                    },
                    { 
                        name: '💬 Canales', 
                        value: `Texto: ${textChannels}\nVoz: ${voiceChannels}\nCategorías: ${categories}`,
                        inline: true 
                    },
                    { 
                        name: '🎭 Roles', 
                        value: `${roles} roles`,
                        inline: true 
                    },
                    {
                        name: '🚀 Mejoras',
                        value: `Nivel: ${guild.premiumTier}\nMejoras: ${guild.premiumSubscriptionCount}`,
                        inline: true
                    }
                )
                .setFooter({ 
                    text: `ID: ${guild.id}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en comando serverinfo:', error);
            await interaction.reply({
                content: '```diff\n- ❌ Hubo un error al mostrar la información del servidor.\n```',
                ephemeral: true
            });
        }
    }
}; 