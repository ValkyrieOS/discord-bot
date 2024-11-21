const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('📊 Crea una encuesta')
        .addStringOption(option =>
            option.setName('pregunta')
                .setDescription('Pregunta de la encuesta')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('opcion1')
                .setDescription('Primera opción')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('opcion2')
                .setDescription('Segunda opción')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('opcion3')
                .setDescription('Tercera opción (opcional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('opcion4')
                .setDescription('Cuarta opción (opcional)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        try {
            const pregunta = interaction.options.getString('pregunta');
            const opciones = [
                interaction.options.getString('opcion1'),
                interaction.options.getString('opcion2'),
                interaction.options.getString('opcion3'),
                interaction.options.getString('opcion4')
            ].filter(Boolean); // Eliminar opciones nulas

            const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
            const opcionesFormateadas = opciones.map((opcion, index) => 
                `${emojis[index]} ${opcion}`
            );

            const embed = new EmbedBuilder()
                .setTitle('📊 Nueva Encuesta')
                .setColor('#FF9900')
                .setDescription(`**${pregunta}**\n\n${opcionesFormateadas.join('\n')}`)
                .addFields({
                    name: '📝 Instrucciones',
                    value: 'Reacciona con el emoji correspondiente para votar'
                })
                .setFooter({ 
                    text: `Creada por ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            const message = await interaction.reply({ 
                embeds: [embed],
                fetchReply: true
            });

            // Añadir reacciones iniciales
            for (let i = 0; i < opciones.length; i++) {
                await message.react(emojis[i]);
            }

        } catch (error) {
            console.error('Error en comando poll:', error);
            await interaction.reply({
                content: '```diff\n- ❌ Hubo un error al crear la encuesta.\n```',
                ephemeral: true
            });
        }
    }
}; 