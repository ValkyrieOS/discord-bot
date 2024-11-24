const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// Lista de IDs de bots a eliminar
const BOTS_TO_REMOVE = [
    '276060004262477825', 
    '611188617934667799', 
    '808346067317162015',
    '155149108183695360',
    '429457053791158281',
    '282859044593598464'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kickfusionedbots')
        .setDescription('🤖 Elimina bots específicos del servidor')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Verificar si es el dueño del bot
            const application = await interaction.client.application.fetch();
            if (interaction.user.id !== application.owner.id) {
                return await interaction.reply({
                    content: '```diff\n- ❌ Solo el dueño del bot puede usar este comando.\n```',
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            const guild = interaction.guild;
            const kickedBots = [];
            const notFoundBots = [];
            const failedKicks = [];

            // Obtener todos los miembros del servidor
            const members = await guild.members.fetch();

            // Procesar cada bot de la lista
            for (const botId of BOTS_TO_REMOVE) {
                const member = members.get(botId);
                
                if (!member) {
                    notFoundBots.push(botId);
                    continue;
                }

                try {
                    await member.kick('Bot eliminado por comando kickfusionedbots');
                    kickedBots.push(`${member.user.tag} (${botId})`);
                } catch (error) {
                    console.error(`Error al expulsar bot ${botId}:`, error);
                    failedKicks.push(`${member.user.tag} (${botId})`);
                }
            }

            // Crear embed con resultados
            const embed = new EmbedBuilder()
                .setTitle('🤖 Resultado de Eliminación de Bots')
                .setColor(kickedBots.length > 0 ? '#00ff00' : '#ff0000')
                .setDescription('Resumen de la operación de eliminación de bots.')
                .addFields([
                    {
                        name: '✅ Bots Eliminados',
                        value: kickedBots.length > 0 
                            ? kickedBots.map(bot => `> ${bot}`).join('\n')
                            : '> Ningún bot fue eliminado',
                        inline: false
                    },
                    {
                        name: '❌ Bots No Encontrados',
                        value: notFoundBots.length > 0 
                            ? notFoundBots.map(id => `> ${id}`).join('\n')
                            : '> Ninguno',
                        inline: false
                    },
                    {
                        name: '⚠️ Errores al Eliminar',
                        value: failedKicks.length > 0 
                            ? failedKicks.map(bot => `> ${bot}`).join('\n')
                            : '> Ninguno',
                        inline: false
                    }
                ])
                .setFooter({ 
                    text: `Solicitado por ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en comando kickfusionedbots:', error);
            const errorMessage = '```diff\n- ❌ Hubo un error al ejecutar el comando.\n```';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
}; 