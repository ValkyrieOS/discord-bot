const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chiste')
        .setDescription('Cuenta un chiste aleatorio')
        .addStringOption(option =>
            option.setName('categoria')
                .setDescription('Categoría del chiste')
                .setRequired(false)
                .addChoices(
                    { name: '🐾 Animales', value: 'animales' },
                    { name: '🎮 Videojuegos', value: 'videojuegos' },
                    { name: '🎭 Clásicos', value: 'clasicos' }
                )),
    async execute(interaction) {
        const categoria = interaction.options.getString('categoria') || 'random';
        
        const chistes = {
            animales: [
                "¿Qué le dice un jaguar a otro jaguar? Jaguar you?",
                "¿Qué le dice una iguana a su hermana gemela? Somos iguanitas",
                "¿Qué le dice un pez a otro pez? Nada",
                "¿Qué hace una abeja en el gimnasio? Zumba",
                "¿Por qué el gato no juega al póker? Porque tiene mala suerte con los perros"
            ],
            videojuegos: [
                "¿Por qué Mario Bros fue al médico? Porque le faltaba una vida",
                "¿Qué le dice un jugador de Minecraft a otro? Que cubo más bonito",
                "¿Por qué Pac-Man fue al psicólogo? Porque tenía fantasmas que lo perseguían",
                "¿Qué le dice un pixel a otro pixel? Nos vemos en HD"
            ],
            clasicos: [
                "¿Por qué el libro de matemáticas está triste? Porque tiene muchos problemas",
                "¿Qué le dice un pollito a otro pollito? Necesitamos pollo apoyo",
                "¿Por qué los pájaros no usan Facebook? Porque ya tienen Twitter",
                "¿Qué hace una persona con un sobre de ketchup en la oreja? Está escuchando salsa"
            ]
        };

        let chisteSeleccionado;
        if (categoria === 'random') {
            const todasCategorias = [...chistes.animales, ...chistes.videojuegos, ...chistes.clasicos];
            chisteSeleccionado = todasCategorias[Math.floor(Math.random() * todasCategorias.length)];
        } else {
            chisteSeleccionado = chistes[categoria][Math.floor(Math.random() * chistes[categoria].length)];
        }

        const embed = new EmbedBuilder()
            .setTitle('😂 ¡Hora del chiste!')
            .setDescription(chisteSeleccionado)
            .setColor('#FFD700')
            .setFooter({ text: categoria === 'random' ? '¡Jaja!' : `Categoría: ${categoria}` });

        await interaction.reply({ embeds: [embed] });
    },
}; 