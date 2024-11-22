const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('📚 Muestra la lista de comandos disponibles'),

    async getCommands() {
        const commandFiles = fs.readdirSync(path.join(__dirname)).filter(file => file.endsWith('.js'));
        const commands = {
            moderacion: [],
            social: [],
            economia: [],
            utilidad: [],
            diversion: [],
            info: []
        };

        for (const file of commandFiles) {
            const command = require(`./${file}`);
            const desc = command.data.description;
            const name = command.data.name;

            if (desc.includes('🛡️') || ['ban', 'kick', 'timeout', 'warn', 'antiraid', 'clear', 'lock', 'nuke', 'unban', 'role'].includes(name)) {
                commands.moderacion.push({ name, desc });
            } else if (desc.includes('💫') || ['hug', 'kiss', 'pat', 'slap', 'poke', 'cuddle', 'feed'].includes(name)) {
                commands.social.push({ name, desc });
            } else if (desc.includes('🔞') || ['economy', 'balance', 'daily', 'work', 'rob'].includes(name)) {
                commands.economia.push({ name, desc });
            } else if (desc.includes('🎫') || desc.includes('⚙️') || ['ticket', 'suggest', 'poll', 'autorole', 'config'].includes(name)) {
                commands.utilidad.push({ name, desc });
            } else if (desc.includes('🎮') || desc.includes('🎲') || ['8ball', 'choice', 'coinflip'].includes(name)) {
                commands.diversion.push({ name, desc });
            } else if (desc.includes('📊') || desc.includes('ℹ️') || ['help', 'serverinfo', 'botinfo', 'userinfo', 'ping', 'uniqueusers'].includes(name)) {
                commands.info.push({ name, desc });
            } else {
                commands.utilidad.push({ name, desc });
            }
        }

        return commands;
    },

    async execute(interaction) {
        try {
            const commands = await this.getCommands();

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
                        label: 'Economía',
                        description: 'Comandos de economía',
                        value: 'economia',
                        emoji: '💰'
                    },
                    {
                        label: 'Diversión',
                        description: 'Comandos de diversión',
                        value: 'diversion',
                        emoji: '🎮'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(menu);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📚 Sistema de Ayuda')
                .setDescription('Selecciona una categoría del menú para ver los comandos disponibles.')
                .addFields(
                    { name: '📊 Estadísticas', value: `> Comandos totales: **${Object.values(commands).flat().length}**` },
                    { 
                        name: '🔍 Categorías', 
                        value: [
                            '```md',
                            `1. Moderación (${commands.moderacion.length} comandos)`,
                            `2. Social (${commands.social.length} comandos)`,
                            `3. Información (${commands.info.length} comandos)`,
                            `4. Utilidad (${commands.utilidad.length} comandos)`,
                            `5. Economía (${commands.economia.length} comandos)`,
                            `6. Diversión (${commands.diversion.length} comandos)`,
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
