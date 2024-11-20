const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isOwner, OWNER_ID } = require('../utils/permissions');
const { saveVips } = require('../utils/vipManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vip')
        .setDescription('👑 Gestiona usuarios VIP')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Añade un usuario VIP')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('Usuario a añadir como VIP')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remueve un usuario VIP')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('Usuario a remover de VIP')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lista todos los usuarios VIP')),

    async execute(interaction) {
        try {
            // Verificar si es el owner
            if (!isOwner(interaction.user.id)) {
                return await interaction.reply({
                    content: '```diff\n- ❌ Solo el dueño del bot puede gestionar usuarios VIP.\n```',
                    ephemeral: true
                });
            }

            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'add': {
                    const user = interaction.options.getUser('usuario');
                    
                    if (user.id === OWNER_ID) {
                        return await interaction.reply({
                            content: '```diff\n- ❌ El dueño del bot ya tiene acceso VIP por defecto.\n```',
                            ephemeral: true
                        });
                    }

                    if (global.vipUsers.has(user.id)) {
                        return await interaction.reply({
                            content: '```diff\n- ❌ Este usuario ya es VIP.\n```',
                            ephemeral: true
                        });
                    }

                    global.vipUsers.add(user.id);
                    await saveVips();

                    const embed = new EmbedBuilder()
                        .setTitle('👑 Usuario VIP Añadido')
                        .setColor('#FFD700')
                        .setDescription(`${user.tag} ahora es un usuario VIP.`)
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'remove': {
                    const user = interaction.options.getUser('usuario');
                    
                    if (user.id === OWNER_ID) {
                        return await interaction.reply({
                            content: '```diff\n- ❌ No puedes remover al dueño del bot.\n```',
                            ephemeral: true
                        });
                    }

                    if (!global.vipUsers.has(user.id)) {
                        return await interaction.reply({
                            content: '```diff\n- ❌ Este usuario no es VIP.\n```',
                            ephemeral: true
                        });
                    }

                    global.vipUsers.delete(user.id);
                    await saveVips();

                    const embed = new EmbedBuilder()
                        .setTitle('👑 Usuario VIP Removido')
                        .setColor('#FF0000')
                        .setDescription(`${user.tag} ya no es un usuario VIP.`)
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'list': {
                    const vipList = [];
                    vipList.push(`• ${interaction.client.user.tag} (Owner)`);
                    
                    for (const userId of global.vipUsers) {
                        try {
                            const user = await interaction.client.users.fetch(userId);
                            vipList.push(`• ${user.tag} (${userId})`);
                        } catch {
                            vipList.push(`• ID: ${userId} (Usuario no encontrado)`);
                        }
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('👑 Lista de Usuarios VIP')
                        .setColor('#FFD700')
                        .setDescription(vipList.join('\n'))
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    break;
                }
            }
        } catch (error) {
            console.error('Error en comando VIP:', error);
            await interaction.reply({
                content: '```diff\n- ❌ Hubo un error al ejecutar el comando.\n```',
                ephemeral: true
            });
        }
    }
}; 