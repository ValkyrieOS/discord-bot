const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('🎉 Crea un sorteo en el servidor')
        .addStringOption(option =>
            option.setName('premio')
                .setDescription('¿Qué quieres sortear?')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('ganadores')
                .setDescription('Número de ganadores')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(10))
        .addStringOption(option =>
            option.setName('tiempo')
                .setDescription('Duración del sorteo (1m, 1h, 1d)')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal donde se realizará el sorteo')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        // Verificar permisos
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
            return await interaction.reply({
                content: '```diff\n- ❌ Necesitas permisos de gestionar servidor para crear sorteos.\n```',
                ephemeral: true
            });
        }

        const premio = interaction.options.getString('premio');
        const ganadores = interaction.options.getInteger('ganadores');
        const tiempoStr = interaction.options.getString('tiempo');
        const canal = interaction.options.getChannel('canal') || interaction.channel;

        // Convertir tiempo a milisegundos
        const tiempoRegex = /^(\d+)([mhd])$/;
        const match = tiempoStr.match(tiempoRegex);

        if (!match) {
            return await interaction.reply({
                content: '```diff\n- ❌ Formato de tiempo inválido. Usa: 1m, 1h, 1d\n```',
                ephemeral: true
            });
        }

        const [, cantidad, unidad] = match;
        const multiplicadores = {
            'm': 60 * 1000,            // minutos
            'h': 60 * 60 * 1000,       // horas
            'd': 24 * 60 * 60 * 1000   // días
        };

        const duracion = parseInt(cantidad) * multiplicadores[unidad];
        const finalizaEn = Date.now() + duracion;

        // Crear embed del sorteo
        const embed = new EmbedBuilder()
            .setTitle('🎉 ¡NUEVO SORTEO!')
            .setColor('#FF1493')
            .setDescription(`
                ### 🎁 Premio: **${premio}**\n
                👥 Ganadores: **${ganadores}**
                ⏰ Finaliza: <t:${Math.floor(finalizaEn / 1000)}:R>\n
                *Reacciona con 🎉 para participar*
            `)
            .setFooter({
                text: `Sorteo creado por ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        // Enviar mensaje del sorteo
        const message = await canal.send({
            embeds: [embed]
        });

        // Añadir reacción inicial
        await message.react('🎉');

        // Confirmar creación
        await interaction.reply({
            content: '```diff\n+ ✅ Sorteo creado exitosamente en ' + canal + '\n```',
            ephemeral: true
        });

        // Esperar a que termine el sorteo
        setTimeout(async () => {
            const fetchedMessage = await canal.messages.fetch(message.id);
            const reaction = fetchedMessage.reactions.cache.get('🎉');

            // Obtener participantes
            const users = await reaction.users.fetch();
            const validParticipants = users.filter(user => !user.bot).values();
            const participantsArray = Array.from(validParticipants);

            if (participantsArray.length < ganadores) {
                const embedFinal = new EmbedBuilder()
                    .setTitle('🎉 Sorteo Finalizado')
                    .setColor('#FF0000')
                    .setDescription('### 🎁 Premio: **' + premio + '**\n\n❌ No hubo suficientes participantes\n*Se necesitaban ' + ganadores + ' participantes*')
                    .setTimestamp();

                return await fetchedMessage.edit({ embeds: [embedFinal] });
            }

            // Seleccionar ganadores
            const winners = [];
            for (let i = 0; i < ganadores && participantsArray.length > 0; i++) {
                const winnerIndex = Math.floor(Math.random() * participantsArray.length);
                winners.push(participantsArray.splice(winnerIndex, 1)[0]);
            }

            // Actualizar embed con ganadores
            const embedFinal = new EmbedBuilder()
                .setTitle('🎉 Sorteo Finalizado')
                .setColor('#00FF00')
                .setDescription('### 🎁 Premio: **' + premio + '**\n\n👑 Ganadores:\n' + winners.map(w => `> <@${w.id}>`).join('\n') + '\n\n*¡Felicidades a los ganadores!*')
                .setTimestamp();

            await fetchedMessage.edit({ embeds: [embedFinal] });

            // Anunciar ganadores
            await canal.send({
                content: '🎊 ¡Felicidades ' + winners.map(w => `<@${w.id}>`).join(', ') + '! Ganaron: **' + premio + '**',
                allowedMentions: { users: winners.map(w => w.id) }
            });

        }, duracion);
    }
}; 