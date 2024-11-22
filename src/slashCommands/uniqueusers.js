const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uniqueusers')
        .setDescription('📊 Ver estadísticas de usuarios únicos del bot'),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            // Conjunto para almacenar IDs únicos
            const uniqueUsers = new Map();
            let totalBots = 0;
            let activeLastWeek = 0;
            const now = Date.now();
            const oneWeek = 7 * 24 * 60 * 60 * 1000;

            // Procesar cada servidor
            for (const guild of interaction.client.guilds.cache.values()) {
                try {
                    const members = await guild.members.fetch();
                    
                    members.forEach(member => {
                        const userId = member.user.id;
                        
                        if (member.user.bot) {
                            if (!uniqueUsers.has(`bot_${userId}`)) {
                                uniqueUsers.set(`bot_${userId}`, {
                                    tag: member.user.tag,
                                    isBot: true
                                });
                                totalBots++;
                            }
                        } else {
                            if (!uniqueUsers.has(userId)) {
                                // Guardar información del usuario
                                uniqueUsers.set(userId, {
                                    tag: member.user.tag,
                                    joinedAt: member.joinedTimestamp,
                                    lastMessageTimestamp: member.lastMessageTimestamp,
                                    isBot: false,
                                    servers: [guild.name]
                                });
                            } else {
                                // Actualizar servidores donde está el usuario
                                const userData = uniqueUsers.get(userId);
                                if (!userData.servers.includes(guild.name)) {
                                    userData.servers.push(guild.name);
                                }
                            }

                            // Verificar actividad en la última semana
                            const userData = uniqueUsers.get(userId);
                            const lastActivity = member.lastMessageTimestamp || member.joinedTimestamp;
                            if (lastActivity && (now - lastActivity) <= oneWeek) {
                                userData.isActive = true;
                                activeLastWeek++;
                            }
                        }
                    });
                } catch (error) {
                    console.error(`Error al obtener miembros del servidor ${guild.name}:`, error);
                }
            }

            // Calcular estadísticas
            const totalUsers = uniqueUsers.size - totalBots;
            const totalUnique = uniqueUsers.size;
            const activePercentage = ((activeLastWeek / totalUsers) * 100).toFixed(1);
            const multiServer = Array.from(uniqueUsers.values()).filter(u => !u.isBot && u.servers?.length > 1).length;

            // Crear embed con la información
            const embed = new EmbedBuilder()
                .setTitle('📊 Estadísticas de Usuarios Únicos')
                .setColor('#00FF00')
                .setDescription('Estadísticas globales de usuarios únicos basadas en ID.')
                .addFields([
                    {
                        name: '👥 Usuarios Totales',
                        value: [
                            `> 🧑 **${totalUsers.toLocaleString()}** usuarios únicos`,
                            `> 🤖 **${totalBots.toLocaleString()}** bots únicos`,
                            `> 📊 **${totalUnique.toLocaleString()}** total`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '📈 Estadísticas',
                        value: [
                            `> 🏃 **${activeLastWeek.toLocaleString()}** usuarios activos (${activePercentage}%)`,
                            `> 🌐 **${interaction.client.guilds.cache.size.toLocaleString()}** servidores`,
                            `> 🔄 **${multiServer.toLocaleString()}** usuarios en múltiples servidores`
                        ].join('\n'),
                        inline: false
                    }
                ])
                .setFooter({ 
                    text: `Solicitado por ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            // Enviar respuesta
            await interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {
            console.error('Error en comando uniqueusers:', error);
            const errorMessage = '```diff\n- ❌ Hubo un error al obtener las estadísticas.\n```';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
}; 