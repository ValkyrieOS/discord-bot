const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('📚 Muestra la lista de comandos disponibles'),

    async execute(interaction) {
        try {
            // Obtener todos los comandos
            const commandFiles = fs.readdirSync(path.join(__dirname)).filter(file => file.endsWith('.js'));
            const commands = {
                moderacion: [],
                social: [],
                nsfw: [],
                info: [],
                utilidad: [],
                diversion: []
            };

            // Clasificar comandos
            for (const file of commandFiles) {
                const command = require(`./${file}`);
                const desc = command.data.description;
                const name = command.data.name;

                if (desc.includes('🛡️') || ['ban', 'kick', 'timeout', 'warn', 'antiraid', 'clear', 'lock', 'nuke', 'unban', 'role'].includes(name)) {
                    commands.moderacion.push({ name, desc });
                } else if (desc.includes('💫') || ['hug', 'kiss', 'pat', 'slap', 'poke', 'cuddle', 'feed'].includes(name)) {
                    commands.social.push({ name, desc });
                } else if (desc.includes('🔞')) {
                    commands.nsfw.push({ name, desc });
                } else if (desc.includes('📊') || desc.includes('🕒') || ['user', 'server', 'stats', 'botinfo', 'time', 'servers', 'ping', 'avatar'].includes(name)) {
                    commands.info.push({ name, desc });
                } else if (desc.includes('🎫') || desc.includes('🔢') || desc.includes('⏰') || ['ticket', 'suggest', 'calc', 'remind', 'poll', 'autorole', 'config', 'cleartickets'].includes(name)) {
                    commands.utilidad.push({ name, desc });
                } else if (desc.includes('🎱') || desc.includes('🎲') || desc.includes('🪙') || ['8ball', 'choice', 'coinflip', 'giveaway'].includes(name)) {
                    commands.diversion.push({ name, desc });
                } else {
                    commands.diversion.push({ name, desc });
                }
            }

            // Si es una interacción del menú
            if (interaction.isStringSelectMenu()) {
                const category = interaction.values[0];
                const categoryCommands = commands[category];
                const categoryNames = {
                    moderacion: 'Moderación',
                    social: 'Social',
                    nsfw: 'NSFW',
                    info: 'Información',
                    utilidad: 'Utilidad',
                    diversion: 'Diversión'
                };

                const categoryEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`📚 Comandos de ${categoryNames[category]}`)
                    .setDescription(categoryCommands.map(cmd => `> \`/${cmd.name}\` - ${cmd.desc}`).join('\n'))
                    .setFooter({ 
                        text: interaction.user.tag,
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTimestamp();

                await interaction.update({ embeds: [categoryEmbed] });
                return;
            }

            // Crear el menú de selección
            const menu = new StringSelectMenuBuilder()
                .setCustomId('help_menu')
                .setPlaceholder('Selecciona una categoría')
                .addOptions([
                    {
                        label: 'Moderación',
                        description: 'Comandos de moderación',
                        value: 'moderacion',
                        emoji: '🛡️'
                    },
                    {
                        label: 'Social',
                        description: 'Comandos de interacción',
                        value: 'social',
                        emoji: '💫'
                    },
                    {
                        label: 'Información',
                        description: 'Comandos informativos',
                        value: 'info',
                        emoji: '📊'
                    },
                    {
                        label: 'Utilidad',
                        description: 'Comandos útiles',
                        value: 'utilidad',
                        emoji: '🛠️'
                    },
                    {
                        label: 'Diversión',
                        description: 'Comandos de diversión',
                        value: 'diversion',
                        emoji: '🎮'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(menu);

            // Crear embed inicial
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📚 Sistema de Ayuda')
                .setDescription('Selecciona una categoría del menú para ver los comandos disponibles.')
                .addFields(
                    { name: '📊 Estadísticas', value: `> Comandos totales: **${commandFiles.length}**` },
                    { 
                        name: '🔍 Categorías', 
                        value: [
                            '```md',
                            `1. Moderación (${commands.moderacion.length} comandos)`,
                            `2. Social (${commands.social.length} comandos)`,
                            `3. Información (${commands.info.length} comandos)`,
                            `4. Utilidad (${commands.utilidad.length} comandos)`,
                            `5. Diversión (${commands.diversion.length} comandos)`,
                            '```'
                        ].join('\n')
                    }
                )
                .setFooter({ 
                    text: interaction.user.tag,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                components: [row]
            });

        } catch (error) {
            console.error('Error en comando help:', error);
            await interaction.reply({
                content: '```diff\n- ❌ Hubo un error al mostrar la ayuda.\n```',
                ephemeral: true
            });
        }
    }
};
