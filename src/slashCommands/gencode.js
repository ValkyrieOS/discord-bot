const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadCodes, saveCodes } = require('../utils/codeManager');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gencode')
        .setDescription('🎟️ Genera un código de canje')
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Tipo de código')
                .setRequired(true)
                .addChoices(
                    { name: '👑 VIP', value: 'vip' },
                    { name: '💎 Premium', value: 'premium' },
                    { name: '🎭 Rol Especial', value: 'role' }
                ))
        .addIntegerOption(option =>
            option.setName('usos')
                .setDescription('Número de usos del código')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addStringOption(option =>
            option.setName('duracion')
                .setDescription('Duración del beneficio (1d, 7d, 30d, permanent)')
                .setRequired(true)),
    async execute(interaction) {
        try {
            // Verificar si es el owner
            const application = await interaction.client.application.fetch();
            if (interaction.user.id !== application.owner.id) {
                return await interaction.reply({
                    content: '```diff\n- ❌ Solo el dueño del bot puede generar códigos.\n```',
                    ephemeral: true
                });
            }

            const tipo = interaction.options.getString('tipo');
            const usos = interaction.options.getInteger('usos');
            const duracion = interaction.options.getString('duracion');

            // Validar duración
            const duracionRegex = /^(\d+)d$|^permanent$/;
            if (!duracionRegex.test(duracion)) {
                return await interaction.reply({
                    content: '```diff\n- ❌ Formato de duración inválido. Usa: 1d, 7d, 30d o permanent\n```',
                    ephemeral: true
                });
            }

            // Generar código único
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            
            // Cargar códigos existentes
            const codesData = await loadCodes();
            
            // Agregar nuevo código
            codesData.codes[code] = {
                tipo,
                usos_restantes: usos,
                usos_totales: usos,
                duracion,
                creado_por: interaction.user.id,
                fecha_creacion: new Date().toISOString(),
                canjeados_por: []
            };

            // Guardar códigos
            await saveCodes(codesData);

            // Crear embed
            const embed = new EmbedBuilder()
                .setTitle('🎟️ Código Generado')
                .setColor('#00FF00')
                .setDescription(`\`${code}\``)
                .addFields(
                    { 
                        name: '📋 Detalles', 
                        value: [
                            `Tipo: ${tipo}`,
                            `Usos: ${usos}`,
                            `Duración: ${duracion}`,
                        ].join('\n')
                    }
                )
                .setFooter({ 
                    text: 'Guarda este código en un lugar seguro',
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Error en comando gencode:', error);
            await interaction.reply({
                content: '```diff\n- ❌ Hubo un error al generar el código.\n```',
                ephemeral: true
            });
        }
    }
}; 