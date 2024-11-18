const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

// Necesitarás obtener una API key gratuita de OpenWeatherMap
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('🌤️ Muestra el clima en una ubicación')
        .addStringOption(option =>
            option.setName('ciudad')
                .setDescription('Nombre de la ciudad')
                .setRequired(true)),
    async execute(interaction) {
        try {
            await interaction.deferReply();
            const city = interaction.options.getString('ciudad');
            
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_API_KEY}&units=metric&lang=es`
            );
            
            if (!response.ok) {
                throw new Error('Ciudad no encontrada');
            }

            const data = await response.json();
            
            // Mapeo de códigos de clima a emojis
            const weatherEmojis = {
                Clear: '☀️',
                Clouds: '☁️',
                Rain: '🌧️',
                Drizzle: '🌦️',
                Thunderstorm: '⛈️',
                Snow: '🌨️',
                Mist: '🌫️',
                Fog: '🌫️',
                Haze: '🌫️'
            };

            const emoji = weatherEmojis[data.weather[0].main] || '🌡️';

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${emoji} Clima en ${data.name}, ${data.sys.country}`)
                .addFields(
                    { 
                        name: '🌡️ Temperatura', 
                        value: `${Math.round(data.main.temp)}°C`, 
                        inline: true 
                    },
                    { 
                        name: '💧 Humedad', 
                        value: `${data.main.humidity}%`, 
                        inline: true 
                    },
                    { 
                        name: '🌪️ Viento', 
                        value: `${Math.round(data.wind.speed * 3.6)} km/h`, 
                        inline: true 
                    },
                    { 
                        name: '🌅 Sensación', 
                        value: `${Math.round(data.main.feels_like)}°C`, 
                        inline: true 
                    },
                    { 
                        name: '📊 Presión', 
                        value: `${data.main.pressure} hPa`, 
                        inline: true 
                    },
                    {
                        name: '👁️ Visibilidad',
                        value: `${(data.visibility / 1000).toFixed(1)} km`,
                        inline: true
                    },
                    {
                        name: '📝 Descripción',
                        value: data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1),
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `Solicitado por ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en comando weather:', error);
            const errorMessage = error.message === 'Ciudad no encontrada' 
                ? '```diff\n- ❌ Ciudad no encontrada. Verifica el nombre e intenta de nuevo.\n```'
                : '```diff\n- ❌ Error al obtener el clima. Intenta más tarde.\n```';
                
            if (interaction.deferred) {
                await interaction.editReply({
                    content: errorMessage,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: errorMessage,
                    ephemeral: true
                });
            }
        }
    }
}; 