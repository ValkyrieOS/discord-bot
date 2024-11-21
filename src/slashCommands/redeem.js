const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadCodes, saveCodes } = require('../utils/codeManager');
const { saveVips } = require('../utils/vipManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('redeem')
        .setDescription('🎟️ Canjea un código')
        .addStringOption(option =>
            option.setName('codigo')
                .setDescription('Código a canjear')
                .setRequired(true)),
    async execute(interaction) {
        try {
            const codigo = interaction.options.getString('codigo').toUpperCase();
            const codesData = await loadCodes();

            // Verificar si el código existe
            if (!codesData.codes[codigo]) {
                return await interaction.reply({
                    content: '```diff\n- ❌ Código inválido o expirado.\n```',
                    ephemeral: true
                });
            }

            const codeInfo = codesData.codes[codigo];

            // Verificar si quedan usos
            if (codeInfo.usos_restantes <= 0) {
                return await interaction.reply({
                    content: '```diff\n- ❌ Este código ya no tiene usos disponibles.\n```',
                    ephemeral: true
                });
            }

            // Verificar si el usuario ya usó el código
            if (codeInfo.canjeados_por.includes(interaction.user.id)) {
                return await interaction.reply({
                    content: '```diff\n- ❌ Ya has canjeado este código anteriormente.\n```',
                    ephemeral: true
                });
            }

            // Aplicar beneficios según el tipo
            switch (codeInfo.tipo) {
                case 'vip':
                    if (!global.vipUsers) global.vipUsers = new Set();
                    
                    // Verificar si ya es VIP
                    if (global.vipUsers.has(interaction.user.id)) {
                        return await interaction.reply({
                            content: '```diff\n- ❌ Ya eres un usuario VIP.\n```',
                            ephemeral: true
                        });
                    }
                    
                    // Añadir VIP y guardar
                    global.vipUsers.add(interaction.user.id);
                    await saveVips();
                    break;
                    
                case 'premium':
                    // Implementar lógica para premium
                    break;
                case 'role':
                    // Implementar lógica para roles especiales
                    break;
            }

            // Actualizar información del código
            codeInfo.usos_restantes--;
            codeInfo.canjeados_por.push(interaction.user.id);

            // Si no quedan usos, eliminar el código
            if (codeInfo.usos_restantes <= 0) {
                delete codesData.codes[codigo];
            }

            await saveCodes(codesData);

            // Crear embed de confirmación
            const embed = new EmbedBuilder()
                .setTitle('🎉 ¡Código Canjeado!')
                .setColor('#00FF00')
                .addFields(
                    { 
                        name: '🎁 Recompensa', 
                        value: `Has obtenido: ${codeInfo.tipo.toUpperCase()}` 
                    },
                    { 
                        name: '⏳ Duración', 
                        value: codeInfo.duracion === 'permanent' ? 'Permanente' : `${codeInfo.duracion}` 
                    }
                )
                .setFooter({ 
                    text: codeInfo.usos_restantes > 0 ? 
                        `Usos restantes: ${codeInfo.usos_restantes}` : 
                        'Código agotado y eliminado',
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            // Enviar mensaje al canal de logs si existe
            try {
                const canalLogsId = global.logsChannels.get(interaction.guild.id);
                if (canalLogsId) {
                    const canalLogs = await interaction.guild.channels.fetch(canalLogsId);
                    if (canalLogs) {
                        const logsEmbed = new EmbedBuilder()
                            .setTitle('🎟️ Código Canjeado')
                            .setColor('#00FF00')
                            .addFields(
                                { name: '👤 Usuario', value: `${interaction.user.tag} (${interaction.user.id})` },
                                { name: '🎫 Código', value: codigo },
                                { name: '🎁 Tipo', value: codeInfo.tipo },
                                { name: '📊 Estado', value: `${codeInfo.usos_restantes} usos restantes` }
                            )
                            .setTimestamp();
                        
                        await canalLogs.send({ embeds: [logsEmbed] });
                    }
                }
            } catch (error) {
                console.error('Error al enviar logs:', error);
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Error en comando redeem:', error);
            await interaction.reply({
                content: '```diff\n- ❌ Hubo un error al canjear el código.\n```',
                ephemeral: true
            });
        }
    }
}; 