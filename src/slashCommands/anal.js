const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anal')
        .setDescription('🔞 Acción íntima especial')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('Usuario con quien interactuar')
                .setRequired(true)),
    async execute(interaction) {
        return await interaction.reply({
            content: '```diff\n- ⚠️ Este comando está temporalmente en mantenimiento debido a problemas con la API.\n- El equipo de ONAC Team está trabajando en ello.\n```',
            ephemeral: true
        });
    }
}; 