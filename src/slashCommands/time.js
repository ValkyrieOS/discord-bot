const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment-timezone');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('time')
        .setDescription('🕒 Muestra la hora en una zona horaria específica')
        .addStringOption(option =>
            option.setName('zona')
                .setDescription('Zona horaria (ej: America/Mexico_City, Europe/Madrid, Asia/Tokyo)')
                .setRequired(true)
                .addChoices(
                    { name: '🇲🇽 Ciudad de México', value: 'America/Mexico_City' },
                    { name: '🇪🇸 Madrid', value: 'Europe/Madrid' },
                    { name: '🇯🇵 Tokyo', value: 'Asia/Tokyo' },
                    { name: '🇺🇸 Nueva York', value: 'America/New_York' },
                    { name: '🇬🇧 Londres', value: 'Europe/London' },
                    { name: '🇦🇷 Buenos Aires', value: 'America/Argentina/Buenos_Aires' },
                    { name: '🇨🇱 Santiago', value: 'America/Santiago' },
                    { name: '🇨🇴 Bogotá', value: 'America/Bogota' },
                    { name: '🇵🇪 Lima', value: 'America/Lima' },
                    { name: '🇧🇷 São Paulo', value: 'America/Sao_Paulo' }
                )),
    async execute(interaction) {
        try {
            const timezone = interaction.options.getString('zona');
            const time = moment().tz(timezone);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🕒 Hora Mundial')
                .addFields(
                    { 
                        name: '📍 Zona Horaria', 
                        value: timezone.replace('_', ' '), 
                        inline: true 
                    },
                    { 
                        name: '⏰ Hora Local', 
                        value: time.format('HH:mm:ss'), 
                        inline: true 
                    },
                    { 
                        name: '📅 Fecha', 
                        value: time.format('DD/MM/YYYY'), 
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `Solicitado por ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en comando time:', error);
            await interaction.reply({
                content: '```diff\n- ❌ Zona horaria no válida o error al obtener la hora.\n```',
                ephemeral: true
            });
        }
    }
}; 