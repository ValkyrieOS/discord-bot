const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calc')
        .setDescription('🔢 Realiza cálculos matemáticos')
        .addStringOption(option =>
            option.setName('operacion')
                .setDescription('Operación matemática (ej: 2+2, 5*3, 10/2)')
                .setRequired(true)),
    async execute(interaction) {
        try {
            let operacion = interaction.options.getString('operacion')
                .replace(/[^0-9+\-*/().]/g, '') // Solo permite números y operadores básicos
                .replace(/[+]{2,}/g, '+')       // Previene múltiples +
                .replace(/[-]{2,}/g, '-');      // Previene múltiples -

            // Validación de seguridad adicional
            if (operacion.length > 100) {
                throw new Error('Operación demasiado larga');
            }

            // Evaluar la operación de forma segura
            const resultado = Function('"use strict";return (' + operacion + ')')();

            if (!isFinite(resultado)) {
                throw new Error('Resultado no válido');
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🔢 Calculadora')
                .addFields(
                    { 
                        name: '📝 Operación', 
                        value: `\`${operacion}\``, 
                        inline: false 
                    },
                    { 
                        name: '✅ Resultado', 
                        value: `\`${resultado}\``, 
                        inline: false 
                    }
                )
                .setFooter({ 
                    text: `Solicitado por ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en comando calc:', error);
            await interaction.reply({
                content: '```diff\n- ❌ Operación no válida. Usa solo números y operadores básicos (+, -, *, /).\n```',
                ephemeral: true
            });
        }
    }
}; 