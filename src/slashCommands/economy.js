const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadEconomy, saveEconomy } = require('../utils/economyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy')
        .setDescription('💰 Sistema de economía')
        .addSubcommand(subcommand =>
            subcommand
                .setName('balance')
                .setDescription('Ver tu balance actual o el de otro usuario')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('Usuario a consultar')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('daily')
                .setDescription('Reclamar tu recompensa diaria'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('work')
                .setDescription('Trabajar para ganar monedas'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('rob')
                .setDescription('Intentar robar monedas a otro usuario')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('Usuario a robar')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('Ver el ranking de usuarios más ricos'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('transfer')
                .setDescription('Transferir dinero a otro usuario')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('Usuario a transferir')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('cantidad')
                        .setDescription('Cantidad a transferir')
                        .setRequired(true)
                        .setMinValue(1))),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;

            const economyData = await loadEconomy();
            
            if (!economyData[guildId]) {
                economyData[guildId] = {};
            }
            
            if (!economyData[guildId][userId]) {
                economyData[guildId][userId] = {
                    balance: 0,
                    lastDaily: null,
                    lastWork: null,
                    lastRob: null,
                    inventory: []
                };
            }

            switch (subcommand) {
                case 'balance': {
                    const targetUser = interaction.options.getUser('usuario') || interaction.user;
                    const userEconomy = economyData[guildId][targetUser.id] || { balance: 0 };

                    const embed = new EmbedBuilder()
                        .setTitle('💰 Balance')
                        .setColor('#FFD700')
                        .setThumbnail(targetUser.displayAvatarURL())
                        .addFields(
                            { name: '👤 Usuario', value: targetUser.toString(), inline: true },
                            { name: '💵 Balance', value: `${userEconomy.balance} monedas`, inline: true }
                        )
                        .setFooter({ text: `ID: ${targetUser.id}` })
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'work': {
                    const userEconomy = economyData[guildId][userId];
                    const now = Date.now();
                    const cooldown = 30 * 60 * 1000; // 30 minutos

                    if (userEconomy.lastWork && now - userEconomy.lastWork < cooldown) {
                        const timeLeft = cooldown - (now - userEconomy.lastWork);
                        const minutes = Math.ceil(timeLeft / (60 * 1000));
                        return await interaction.reply({
                            content: `⏰ Debes esperar ${minutes} minutos para volver a trabajar.`,
                            ephemeral: true
                        });
                    }

                    const jobs = [
                        { name: 'Programador', reward: [100, 300] },
                        { name: 'Chef', reward: [80, 250] },
                        { name: 'Médico', reward: [150, 400] },
                        { name: 'Profesor', reward: [90, 280] },
                        { name: 'Artista', reward: [70, 220] }
                    ];

                    const job = jobs[Math.floor(Math.random() * jobs.length)];
                    const reward = Math.floor(Math.random() * (job.reward[1] - job.reward[0])) + job.reward[0];

                    userEconomy.balance += reward;
                    userEconomy.lastWork = now;
                    await saveEconomy(economyData);

                    const embed = new EmbedBuilder()
                        .setTitle('💼 Trabajo Completado')
                        .setColor('#00FF00')
                        .setDescription(`Trabajaste como **${job.name}** y ganaste **${reward}** monedas!`)
                        .addFields(
                            { name: '💰 Balance Actual', value: `${userEconomy.balance} monedas`, inline: true }
                        )
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'rob': {
                    const targetUser = interaction.options.getUser('usuario');
                    const userEconomy = economyData[guildId][userId];
                    const now = Date.now();
                    const cooldown = 60 * 60 * 1000; // 1 hora

                    if (userEconomy.lastRob && now - userEconomy.lastRob < cooldown) {
                        const timeLeft = cooldown - (now - userEconomy.lastRob);
                        const minutes = Math.ceil(timeLeft / (60 * 1000));
                        return await interaction.reply({
                            content: `⏰ Debes esperar ${minutes} minutos para volver a robar.`,
                            ephemeral: true
                        });
                    }

                    if (!economyData[guildId][targetUser.id] || economyData[guildId][targetUser.id].balance < 50) {
                        return await interaction.reply({
                            content: '❌ Este usuario no tiene suficiente dinero para robar.',
                            ephemeral: true
                        });
                    }

                    const success = Math.random() > 0.5;
                    const targetEconomy = economyData[guildId][targetUser.id];
                    userEconomy.lastRob = now;

                    if (success) {
                        const stolenAmount = Math.floor(targetEconomy.balance * 0.1); // 10% del balance
                        userEconomy.balance += stolenAmount;
                        targetEconomy.balance -= stolenAmount;

                        await saveEconomy(economyData);

                        const embed = new EmbedBuilder()
                            .setTitle('🦹 Robo Exitoso')
                            .setColor('#FF0000')
                            .setDescription(`Has robado **${stolenAmount}** monedas a ${targetUser}!`)
                            .addFields(
                                { name: '💰 Tu Balance', value: `${userEconomy.balance} monedas`, inline: true },
                                { name: '👥 Balance de la víctima', value: `${targetEconomy.balance} monedas`, inline: true }
                            )
                            .setTimestamp();

                        await interaction.reply({ embeds: [embed] });
                    } else {
                        const fine = Math.floor(userEconomy.balance * 0.05); // 5% de multa
                        userEconomy.balance -= fine;

                        await saveEconomy(economyData);

                        const embed = new EmbedBuilder()
                            .setTitle('🚔 Robo Fallido')
                            .setColor('#FF0000')
                            .setDescription(`¡Te han atrapado! Has pagado una multa de **${fine}** monedas.`)
                            .addFields(
                                { name: '💰 Balance Actual', value: `${userEconomy.balance} monedas`, inline: true }
                            )
                            .setTimestamp();

                        await interaction.reply({ embeds: [embed] });
                    }
                    break;
                }

                case 'leaderboard': {
                    const guildEconomy = economyData[guildId];
                    const sortedUsers = Object.entries(guildEconomy)
                        .sort(([, a], [, b]) => b.balance - a.balance)
                        .slice(0, 10);

                    let description = '';
                    
                    for (let i = 0; i < sortedUsers.length; i++) {
                        const [userId, data] = sortedUsers[i];
                        try {
                            const user = await interaction.client.users.fetch(userId);
                            const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`;
                            description += `${medal} ${user.tag}: **${data.balance}** monedas\n`;
                        } catch (error) {
                            console.error(`Error al obtener usuario ${userId}:`, error);
                            description += `${i + 1}. Usuario Desconocido: **${data.balance}** monedas\n`;
                        }
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('🏆 Top 10 Usuarios más Ricos')
                        .setColor('#FFD700')
                        .setDescription(description || 'No hay usuarios en el ranking todavía.')
                        .setFooter({ 
                            text: `Servidor: ${interaction.guild.name}`,
                            iconURL: interaction.guild.iconURL()
                        })
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'daily': {
                    const userEconomy = economyData[guildId][userId];
                    const now = Date.now();
                    const lastDaily = userEconomy.lastDaily;
                    const cooldown = 24 * 60 * 60 * 1000; // 24 horas

                    if (lastDaily && now - lastDaily < cooldown) {
                        const timeLeft = cooldown - (now - lastDaily);
                        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

                        return await interaction.reply({
                            content: `⏰ Debes esperar ${hours}h ${minutes}m para tu próxima recompensa diaria.`,
                            ephemeral: true
                        });
                    }

                    const reward = Math.floor(Math.random() * 401) + 100; // 100-500 monedas
                    userEconomy.balance += reward;
                    userEconomy.lastDaily = now;

                    await saveEconomy(economyData);

                    const embed = new EmbedBuilder()
                        .setTitle('💰 Recompensa Diaria')
                        .setColor('#00FF00')
                        .setDescription(`Has recibido **${reward}** monedas!\nBalance actual: **${userEconomy.balance}** monedas`)
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'transfer': {
                    const targetUser = interaction.options.getUser('usuario');
                    const amount = interaction.options.getInteger('cantidad');
                    const userEconomy = economyData[guildId][userId];

                    if (targetUser.bot) {
                        return await interaction.reply({
                            content: '❌ No puedes transferir dinero a bots.',
                            ephemeral: true
                        });
                    }

                    if (targetUser.id === userId) {
                        return await interaction.reply({
                            content: '❌ No puedes transferirte dinero a ti mismo.',
                            ephemeral: true
                        });
                    }

                    if (userEconomy.balance < amount) {
                        return await interaction.reply({
                            content: '❌ No tienes suficiente dinero para esta transferencia.',
                            ephemeral: true
                        });
                    }

                    // Inicializar economía del usuario objetivo si no existe
                    if (!economyData[guildId][targetUser.id]) {
                        economyData[guildId][targetUser.id] = {
                            balance: 0,
                            lastDaily: null
                        };
                    }

                    const targetEconomy = economyData[guildId][targetUser.id];
                    userEconomy.balance -= amount;
                    targetEconomy.balance += amount;

                    await saveEconomy(economyData);

                    const embed = new EmbedBuilder()
                        .setTitle('💸 Transferencia Exitosa')
                        .setColor('#00FF00')
                        .setDescription(`Has transferido **${amount}** monedas a ${targetUser}`)
                        .addFields(
                            { name: 'Tu balance actual', value: `${userEconomy.balance} monedas`, inline: true },
                            { name: 'Balance del receptor', value: `${targetEconomy.balance} monedas`, inline: true }
                        )
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                    break;
                }
            }
        } catch (error) {
            console.error('Error en comando economy:', error);
            await interaction.reply({
                content: '```diff\n- ❌ Hubo un error al ejecutar el comando.\n```',
                ephemeral: true
            });
        }
    }
}; 