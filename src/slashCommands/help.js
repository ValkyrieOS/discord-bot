const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("📚 Muestra todos los comandos disponibles"),
    async execute(interaction) {
        // Obtener todos los comandos
        const commandFiles = fs.readdirSync(path.join(__dirname)).filter(file => file.endsWith('.js'));
        const commands = {
            moderacion: [],
            social: [],
            nsfw: [],
            info: [],
            fun: []
        };

        // Clasificar comandos
        for (const file of commandFiles) {
            const command = require(`./${file}`);
            const desc = command.data.description;

            if (desc.includes('🛡️') || ['ban', 'kick', 'mute', 'warn', 'antiraid'].includes(command.data.name)) {
                commands.moderacion.push(command.data.name);
            } else if (desc.includes('💫') || ['hug', 'kiss', 'pat', 'slap', 'poke', 'cuddle', 'feed', 'dance', 'cry'].includes(command.data.name)) {
                commands.social.push(command.data.name);
            } else if (desc.includes('🔞')) {
                commands.nsfw.push(command.data.name);
            } else if (desc.includes('📊') || ['user', 'server', 'stats', 'roles', 'botinfo'].includes(command.data.name)) {
                commands.info.push(command.data.name);
            } else {
                commands.fun.push(command.data.name);
            }
        }

        const totalCommands = Object.values(commands).flat().length;

        // Crear botones para cada categoría
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('moderacion')
                    .setLabel(`Moderación (${commands.moderacion.length})`)
                    .setEmoji('🛡️')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('social')
                    .setLabel(`Social (${commands.social.length})`)
                    .setEmoji('💫')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('info')
                    .setLabel(`Info (${commands.info.length})`)
                    .setEmoji('📊')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('fun')
                    .setLabel(`Diversión (${commands.fun.length})`)
                    .setEmoji('🎮')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('nsfw')
                    .setLabel(`NSFW (${commands.nsfw.length})`)
                    .setEmoji('🔞')
                    .setStyle(ButtonStyle.Danger),
            );

        // Embed inicial
        const initialEmbed = new EmbedBuilder()
            .setColor("#0099ff")
            .setAuthor({
                name: "📚 Centro de Ayuda",
                iconURL: interaction.client.user.displayAvatarURL(),
            })
            .setDescription(`*¡Tenemos ${totalCommands} comandos disponibles!*\n*Selecciona una categoría para ver sus comandos:*`)
            .addFields(
                { name: '🛡️ Moderación', value: `\`${commands.moderacion.length} comandos\``, inline: true },
                { name: '💫 Social', value: `\`${commands.social.length} comandos\``, inline: true },
                { name: '📊 Info', value: `\`${commands.info.length} comandos\``, inline: true },
                { name: '🎮 Diversión', value: `\`${commands.fun.length} comandos\``, inline: true },
                { name: '🔞 NSFW', value: `\`${commands.nsfw.length} comandos\``, inline: true }
            )
            .setFooter({
                text: `Usa los comandos con responsabilidad • ${interaction.client.user.username}`,
                iconURL: interaction.client.user.displayAvatarURL(),
            })
            .setTimestamp();

        const response = await interaction.reply({
            embeds: [initialEmbed],
            components: [row],
        });

        // Crear collector para los botones
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return await i.reply({
                    content: '```diff\n- ❌ Solo quien usó el comando puede ver las categorías.\n```',
                    ephemeral: true
                });
            }

            const categoryNames = {
                moderacion: '🛡️ Moderación',
                social: '💫 Interacción Social',
                nsfw: '🔞 NSFW',
                info: '📊 Información',
                fun: '🎮 Diversión'
            };

            const categoryEmbed = new EmbedBuilder()
                .setColor("#0099ff")
                .setAuthor({
                    name: `📚 ${categoryNames[i.customId]}`,
                    iconURL: interaction.client.user.displayAvatarURL(),
                })
                .setDescription(`*Comandos disponibles en ${categoryNames[i.customId]}:*`)
                .addFields({
                    name: `${categoryNames[i.customId]} (${commands[i.customId].length})`,
                    value: commands[i.customId].length > 0 ?
                        `\`\`\`\n${commands[i.customId].map(cmd => `/${cmd}`).join('\n')}\`\`\`` :
                        '```\nNo hay comandos disponibles en esta categoría```'
                })
                .setFooter({
                    text: `Usa los comandos con responsabilidad • ${interaction.client.user.username}`,
                    iconURL: interaction.client.user.displayAvatarURL(),
                })
                .setTimestamp();

            await i.update({
                embeds: [categoryEmbed],
                components: [row]
            });
        });

        collector.on('end', () => {
            row.components.forEach(button => button.setDisabled(true));
            interaction.editReply({
                components: [row]
            }).catch(console.error);
        });
    },
};
