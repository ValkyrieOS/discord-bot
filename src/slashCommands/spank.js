const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spank')
        .setDescription('🔞 Da una nalgada a alguien (NSFW)')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('Usuario a quien quieres nalguear')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText || !interaction.channel.nsfw) {
            return await interaction.reply({
                content: '```diff\n- ❌ Este comando solo puede ser usado en canales NSFW.\n```',
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('usuario');
        
        if (user.id === interaction.user.id) {
            return await interaction.reply({
                content: '```diff\n- ❌ ¿Auto-nalgadas? ¡Mejor busca a alguien más!\n```',
                ephemeral: true
            });
        }

        try {
            const response = await fetch('https://purrbot.site/api/img/nsfw/spank/gif');
            const data = await response.json();
            
            if (data.error) {
                throw new Error('API Error');
            }
            
            const embed = new EmbedBuilder()
                .setColor('#800000')
                .setAuthor({
                    name: '🔞 Interacción NSFW',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setDescription(`### 👋 ¡SPANK!\n\n> **${interaction.user}** le da una nalgada a **${user}**\n\n*¡Auch! Eso debió doler...*`)
                .setImage(data.link)
                .setFooter({ 
                    text: `🔞 Comando usado por ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error:', error);
            await interaction.reply({
                content: '```diff\n- ❌ ¡Ups! Algo salió mal con la nalgada 👋\n```',
                ephemeral: true
            });
        }
    }
}; 