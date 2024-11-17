const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { version } = require('../../package.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Muestra información sobre el bot'),
    async execute(interaction) {
        const bot = interaction.client;
        
        // Calcular el tiempo activo
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);
        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({ 
                name: bot.user.username, 
                iconURL: bot.user.displayAvatarURL() 
            })
            .setDescription('*Bot multifuncional de código abierto desarrollado por ONAC Team*')
            .setThumbnail(bot.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                {
                    name: '📊 Estadísticas',
                    value: [
                        `┃ \`🌐\` Servidores: **${bot.guilds.cache.size}**`,
                        `┃ \`👥\` Usuarios: **${bot.users.cache.size}**`,
                        `┃ \`💬\` Canales: **${bot.channels.cache.size}**`,
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⏰ Estado',
                    value: [
                        `┃ \`⌚\` Tiempo activo: **${uptimeString}**`,
                        `┃ \`📅\` Creado: <t:${Math.floor(bot.user.createdTimestamp / 1000)}:R>`,
                        `┃ \`🔄\` Versión: **${version}**`,
                    ].join('\n'),
                    inline: false
                },
                { 
                    name: '🔗 Enlaces',
                    value: [
                        `[\`💻\` GitHub](https://github.com/ValkyrieOS/discord-bot)`,
                        `[\`➕\` Invitar](https://discord.com/oauth2/authorize?client_id=${bot.user.id}&permissions=8&scope=bot%20applications.commands)`,
                        `[\`❓\` Soporte](https://discord.gg/nvaYNqJyeF)`,
                    ].join(' • '),
                    inline: false
                }
            )
            .setFooter({ 
                text: `ID: ${bot.user.id} • MIT License`, 
                iconURL: 'https://i.imgur.com/8DKwbhj.png'
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
}; 