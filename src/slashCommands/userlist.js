const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userlist')
        .setDescription('📋 Obtiene una lista de usuarios del servidor en formato JSON')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        try {
            // Obtener todos los miembros del servidor
            const members = await interaction.guild.members.fetch();
            
            // Filtrar solo usuarios (no bots) y mapear la información necesaria
            const users = members
                .filter(member => !member.user.bot)
                .map(member => ({
                    user: member.user.username,
                    avatar_url: member.user.displayAvatarURL({ size: 1024 }) || null,
                    ...(member.id === interaction.guild.ownerId && { isOwner: true })
                }));

            // Crear el objeto JSON final
            const jsonData = {
                users: users
            };

            // Convertir a string y crear el buffer
            const jsonString = JSON.stringify(jsonData, null, 2);
            const buffer = Buffer.from(jsonString, 'utf-8');

            // Crear embed informativo
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('📋 Lista de Usuarios Generada')
                .setDescription(`Se han procesado **${users.length}** usuarios`)
                .setTimestamp();

            // Enviar el archivo JSON y el embed
            await interaction.reply({
                embeds: [embed],
                files: [{
                    attachment: buffer,
                    name: 'users_list.json'
                }],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error:', error);
            await interaction.reply({
                content: '```diff\n- ❌ Hubo un error al generar la lista de usuarios.\n```',
                ephemeral: true
            });
        }
    }
}; 