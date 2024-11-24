const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { loadEconomy, saveEconomy } = require("../utils/economyManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("economy")
    .setDescription("💰 Sistema de economía")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("balance")
        .setDescription("Ver tu balance actual o el de otro usuario")
        .addUserOption((option) =>
          option
            .setName("usuario")
            .setDescription("Usuario a consultar")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("daily")
        .setDescription("Reclamar tu recompensa diaria")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("work").setDescription("Trabajar para ganar monedas")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rob")
        .setDescription("Intentar robar monedas a otro usuario")
        .addUserOption((option) =>
          option
            .setName("usuario")
            .setDescription("Usuario a robar")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leaderboard")
        .setDescription("Ver el ranking de usuarios más ricos")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("transfer")
        .setDescription("Transferir dinero a otro usuario")
        .addUserOption((option) =>
          option
            .setName("usuario")
            .setDescription("Usuario a transferir")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("cantidad")
            .setDescription("Cantidad a transferir")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("coinflip")
        .setDescription("🎲 Apuesta monedas en cara o cruz")
        .addIntegerOption((option) =>
          option
            .setName("cantidad")
            .setDescription("Cantidad a apostar")
            .setRequired(true)
            .setMinValue(50)
        )
        .addStringOption((option) =>
          option
            .setName("lado")
            .setDescription("Elige cara o cruz")
            .setRequired(true)
            .addChoices(
              { name: "Cara", value: "cara" },
              { name: "Cruz", value: "cruz" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("duel")
        .setDescription("⚔️ Desafía a otro usuario a un duelo por monedas")
        .addUserOption((option) =>
          option
            .setName("usuario")
            .setDescription("Usuario a desafiar")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("cantidad")
            .setDescription("Cantidad a apostar")
            .setRequired(true)
            .setMinValue(100)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("slots")
        .setDescription("🎰 Juega a la máquina tragamonedas")
        .addIntegerOption((option) =>
          option
            .setName("cantidad")
            .setDescription("Cantidad a apostar")
            .setRequired(true)
            .setMinValue(50)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("blackjack")
        .setDescription("🃏 Juega al blackjack")
        .addIntegerOption((option) =>
          option
            .setName("cantidad")
            .setDescription("Cantidad a apostar")
            .setRequired(true)
            .setMinValue(100)
        )
    ),

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
          inventory: [],
        };
      }

      switch (subcommand) {
        case "balance": {
          const targetUser =
            interaction.options.getUser("usuario") || interaction.user;
          const userEconomy = economyData[guildId][targetUser.id] || {
            balance: 0,
          };

          const embed = new EmbedBuilder()
            .setTitle("💰 Balance")
            .setColor("#FFD700")
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
              {
                name: "👤 Usuario",
                value: targetUser.toString(),
                inline: true,
              },
              {
                name: "💵 Balance",
                value: `${userEconomy.balance} monedas`,
                inline: true,
              }
            )
            .setFooter({ text: `ID: ${targetUser.id}` })
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
          break;
        }

        case "work": {
          const userEconomy = economyData[guildId][userId];
          const now = Date.now();
          const cooldown = 30 * 60 * 1000; // 30 minutos

          if (userEconomy.lastWork && now - userEconomy.lastWork < cooldown) {
            const timeLeft = cooldown - (now - userEconomy.lastWork);
            const minutes = Math.ceil(timeLeft / (60 * 1000));
            return await interaction.reply({
              content: `⏰ Debes esperar ${minutes} minutos para volver a trabajar.`,
              ephemeral: true,
            });
          }

          const jobs = [
            { name: "Programador", reward: [100, 300] },
            { name: "Chef", reward: [80, 250] },
            { name: "Médico", reward: [150, 400] },
            { name: "Profesor", reward: [90, 280] },
            { name: "Artista", reward: [70, 220] },
          ];

          const job = jobs[Math.floor(Math.random() * jobs.length)];
          const reward =
            Math.floor(Math.random() * (job.reward[1] - job.reward[0])) +
            job.reward[0];

          userEconomy.balance += reward;
          userEconomy.lastWork = now;
          await saveEconomy(economyData);

          const embed = new EmbedBuilder()
            .setTitle("💼 Trabajo Completado")
            .setColor("#00FF00")
            .setDescription(
              `Trabajaste como **${job.name}** y ganaste **${reward}** monedas!`
            )
            .addFields({
              name: "💰 Balance Actual",
              value: `${userEconomy.balance} monedas`,
              inline: true,
            })
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
          break;
        }

        case "rob": {
          const targetUser = interaction.options.getUser("usuario");
          const userEconomy = economyData[guildId][userId];
          const now = Date.now();
          const cooldown = 60 * 60 * 1000; // 1 hora

          if (userEconomy.lastRob && now - userEconomy.lastRob < cooldown) {
            const timeLeft = cooldown - (now - userEconomy.lastRob);
            const minutes = Math.ceil(timeLeft / (60 * 1000));
            return await interaction.reply({
              content: `⏰ Debes esperar ${minutes} minutos para volver a robar.`,
              ephemeral: true,
            });
          }

          if (
            !economyData[guildId][targetUser.id] ||
            economyData[guildId][targetUser.id].balance < 50
          ) {
            return await interaction.reply({
              content: "❌ Este usuario no tiene suficiente dinero para robar.",
              ephemeral: true,
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
              .setTitle("🦹 Robo Exitoso")
              .setColor("#FF0000")
              .setDescription(
                `Has robado **${stolenAmount}** monedas a ${targetUser}!`
              )
              .addFields(
                {
                  name: "💰 Tu Balance",
                  value: `${userEconomy.balance} monedas`,
                  inline: true,
                },
                {
                  name: "👥 Balance de la víctima",
                  value: `${targetEconomy.balance} monedas`,
                  inline: true,
                }
              )
              .setTimestamp();

            await interaction.reply({ embeds: [embed] });
          } else {
            const fine = Math.floor(userEconomy.balance * 0.05); // 5% de multa
            userEconomy.balance -= fine;

            await saveEconomy(economyData);

            const embed = new EmbedBuilder()
              .setTitle("🚔 Robo Fallido")
              .setColor("#FF0000")
              .setDescription(
                `¡Te han atrapado! Has pagado una multa de **${fine}** monedas.`
              )
              .addFields({
                name: "💰 Balance Actual",
                value: `${userEconomy.balance} monedas`,
                inline: true,
              })
              .setTimestamp();

            await interaction.reply({ embeds: [embed] });
          }
          break;
        }

        case "leaderboard": {
          const guildEconomy = economyData[guildId];
          const sortedUsers = Object.entries(guildEconomy)
            .sort(([, a], [, b]) => b.balance - a.balance)
            .slice(0, 10);

          let description = "";

          for (let i = 0; i < sortedUsers.length; i++) {
            const [userId, data] = sortedUsers[i];
            try {
              const user = await interaction.client.users.fetch(userId);
              const medal = i < 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}.`;
              description += `${medal} ${user.tag}: **${data.balance}** monedas\n`;
            } catch (error) {
              console.error(`Error al obtener usuario ${userId}:`, error);
              description += `${i + 1}. Usuario Desconocido: **${
                data.balance
              }** monedas\n`;
            }
          }

          const embed = new EmbedBuilder()
            .setTitle("🏆 Top 10 Usuarios más Ricos")
            .setColor("#FFD700")
            .setDescription(
              description || "No hay usuarios en el ranking todavía."
            )
            .setFooter({
              text: `Servidor: ${interaction.guild.name}`,
              iconURL: interaction.guild.iconURL(),
            })
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
          break;
        }

        case "daily": {
          const userEconomy = economyData[guildId][userId];
          const now = Date.now();
          const lastDaily = userEconomy.lastDaily;
          const cooldown = 24 * 60 * 60 * 1000; // 24 horas

          if (lastDaily && now - lastDaily < cooldown) {
            const timeLeft = cooldown - (now - lastDaily);
            const hours = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutes = Math.floor(
              (timeLeft % (60 * 60 * 1000)) / (60 * 1000)
            );

            return await interaction.reply({
              content: `⏰ Debes esperar ${hours}h ${minutes}m para tu próxima recompensa diaria.`,
              ephemeral: true,
            });
          }

          const reward = Math.floor(Math.random() * 401) + 100; // 100-500 monedas
          userEconomy.balance += reward;
          userEconomy.lastDaily = now;

          await saveEconomy(economyData);

          const embed = new EmbedBuilder()
            .setTitle("💰 Recompensa Diaria")
            .setColor("#00FF00")
            .setDescription(
              `Has recibido **${reward}** monedas!\nBalance actual: **${userEconomy.balance}** monedas`
            )
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
          break;
        }

        case "transfer": {
          const targetUser = interaction.options.getUser("usuario");
          const amount = interaction.options.getInteger("cantidad");
          const userEconomy = economyData[guildId][userId];

          if (targetUser.bot) {
            return await interaction.reply({
              content: "❌ No puedes transferir dinero a bots.",
              ephemeral: true,
            });
          }

          if (targetUser.id === userId) {
            return await interaction.reply({
              content: "❌ No puedes transferirte dinero a ti mismo.",
              ephemeral: true,
            });
          }

          if (userEconomy.balance < amount) {
            return await interaction.reply({
              content:
                "❌ No tienes suficiente dinero para esta transferencia.",
              ephemeral: true,
            });
          }

          // Inicializar economía del usuario objetivo si no existe
          if (!economyData[guildId][targetUser.id]) {
            economyData[guildId][targetUser.id] = {
              balance: 0,
              lastDaily: null,
            };
          }

          const targetEconomy = economyData[guildId][targetUser.id];
          userEconomy.balance -= amount;
          targetEconomy.balance += amount;

          await saveEconomy(economyData);

          const embed = new EmbedBuilder()
            .setTitle("💸 Transferencia Exitosa")
            .setColor("#00FF00")
            .setDescription(
              `Has transferido **${amount}** monedas a ${targetUser}`
            )
            .addFields(
              {
                name: "Tu balance actual",
                value: `${userEconomy.balance} monedas`,
                inline: true,
              },
              {
                name: "Balance del receptor",
                value: `${targetEconomy.balance} monedas`,
                inline: true,
              }
            )
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
          break;
        }

        case "coinflip": {
          const amount = interaction.options.getInteger("cantidad");
          const choice = interaction.options.getString("lado");
          const userEconomy = economyData[guildId][userId];

          if (userEconomy.balance < amount) {
            return await interaction.reply({
              content: "❌ No tienes suficientes monedas para apostar.",
              ephemeral: true,
            });
          }

          const result = Math.random() < 0.5 ? "cara" : "cruz";
          const won = choice === result;
          const winAmount = won ? amount : -amount;
          userEconomy.balance += winAmount;

          await saveEconomy(economyData);

          const embed = new EmbedBuilder()
            .setTitle("🎲 Coinflip")
            .setColor(won ? "#00FF00" : "#FF0000")
            .setDescription(
              [
                `Tu elección: **${choice}**`,
                `Resultado: **${result}**`,
                "",
                won
                  ? `¡Ganaste **${amount}** monedas!`
                  : `Perdiste **${amount}** monedas...`,
                "",
                `Balance actual: **${userEconomy.balance}** monedas`,
              ].join("\n")
            )
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
          break;
        }

        case "duel": {
          const targetUser = interaction.options.getUser("usuario");
          const amount = interaction.options.getInteger("cantidad");
          const userEconomy = economyData[guildId][userId];

          if (targetUser.bot) {
            return await interaction.reply({
              content: "❌ No puedes desafiar a un bot.",
              ephemeral: true,
            });
          }

          if (targetUser.id === userId) {
            return await interaction.reply({
              content: "❌ No puedes desafiarte a ti mismo.",
              ephemeral: true,
            });
          }

          if (userEconomy.balance < amount) {
            return await interaction.reply({
              content: "❌ No tienes suficientes monedas para el duelo.",
              ephemeral: true,
            });
          }

          if (
            !economyData[guildId][targetUser.id] ||
            economyData[guildId][targetUser.id].balance < amount
          ) {
            return await interaction.reply({
              content: "❌ El usuario objetivo no tiene suficientes monedas.",
              ephemeral: true,
            });
          }

          const embed = new EmbedBuilder()
            .setTitle("⚔️ Desafío de Duelo")
            .setColor("#FFD700")
            .setDescription(
              [
                `${interaction.user} desafía a ${targetUser} a un duelo!`,
                "",
                `💰 Apuesta: **${amount}** monedas`,
                "",
                "El retado tiene 30 segundos para aceptar.",
              ].join("\n")
            );

          // Crear botones
          const acceptButton = new ButtonBuilder()
            .setCustomId('accept_duel')
            .setLabel('Aceptar Duelo')
            .setStyle(ButtonStyle.Success)
            .setEmoji('⚔️');

          const rejectButton = new ButtonBuilder()
            .setCustomId('reject_duel')
            .setLabel('Rechazar')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌');

          const row = new ActionRowBuilder()
            .addComponents(acceptButton, rejectButton);

          const response = await interaction.reply({
            content: `${targetUser}`,
            embeds: [embed],
            components: [row],
            fetchReply: true
          });

          try {
            const confirmation = await response.awaitMessageComponent({
              filter: i => {
                if (i.user.id !== targetUser.id) {
                  i.reply({ 
                    content: "❌ Solo el usuario retado puede responder a este duelo.", 
                    ephemeral: true 
                  });
                  return false;
                }
                return true;
              },
              time: 30000
            });

            // Desactivar los botones
            const disabledRow = new ActionRowBuilder()
              .addComponents(
                acceptButton.setDisabled(true),
                rejectButton.setDisabled(true)
              );
            await response.edit({ components: [disabledRow] });

            if (confirmation.customId === 'accept_duel') {
              const winner = Math.random() < 0.5 ? interaction.user : targetUser;
              const loser = winner.id === interaction.user.id ? targetUser : interaction.user;

              economyData[guildId][winner.id].balance += amount;
              economyData[guildId][loser.id].balance -= amount;

              await saveEconomy(economyData);

              const resultEmbed = new EmbedBuilder()
                .setTitle("⚔️ Resultado del Duelo")
                .setColor("#00FF00")
                .setDescription(
                  [
                    `¡${winner} ha ganado el duelo!`,
                    "",
                    `Premio: **${amount}** monedas`,
                    "",
                    `Balance de ${winner}: **${economyData[guildId][winner.id].balance}** monedas`,
                    `Balance de ${loser}: **${economyData[guildId][loser.id].balance}** monedas`,
                  ].join("\n")
                );

              await interaction.followUp({ embeds: [resultEmbed] });
            } else {
              await interaction.followUp({
                content: "❌ El duelo ha sido rechazado.",
                ephemeral: true,
              });
            }
          } catch (error) {
            // Desactivar los botones cuando expire
            const disabledRow = new ActionRowBuilder()
              .addComponents(
                acceptButton.setDisabled(true),
                rejectButton.setDisabled(true)
              );
            await response.edit({ components: [disabledRow] });

            await interaction.followUp({
              content: "❌ El tiempo para aceptar el duelo ha expirado.",
              ephemeral: true,
            });
          }
          break;
        }

        case "slots": {
          const amount = interaction.options.getInteger("cantidad");
          const userEconomy = economyData[guildId][userId];

          if (userEconomy.balance < amount) {
            return await interaction.reply({
              content: "❌ No tienes suficientes monedas.",
              ephemeral: true,
            });
          }

          const slots = ["🍎", "🍊", "🍇", "🍒", "💎", "7️⃣"];
          const results = Array(3)
            .fill()
            .map(() => slots[Math.floor(Math.random() * slots.length)]);

          let winMultiplier = 0;
          if (results[0] === results[1] && results[1] === results[2]) {
            winMultiplier =
              results[0] === "7️⃣" ? 10 : results[0] === "💎" ? 7 : 5;
          } else if (results[0] === results[1] || results[1] === results[2]) {
            winMultiplier = 2;
          }

          const winAmount = amount * winMultiplier - amount;
          userEconomy.balance += winAmount;

          await saveEconomy(economyData);

          const embed = new EmbedBuilder()
            .setTitle("🎰 Tragamonedas")
            .setColor(winAmount > 0 ? "#00FF00" : "#FF0000")
            .setDescription(
              [
                "╔══════════╗",
                `║ ${results.join(" ")} ║`,
                "╚══════════╝",
                "",
                winAmount > 0
                  ? `¡Ganaste **${winAmount}** monedas!`
                  : `Perdiste **${amount}** monedas...`,
                "",
                `Balance actual: **${userEconomy.balance}** monedas`,
              ].join("\n")
            )
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
          break;
        }

        case "blackjack": {
          // ... implementación del blackjack ...
          break;
        }
      }
    } catch (error) {
      console.error("Error en comando economy:", error);
      await interaction.reply({
        content: "```diff\n- ❌ Hubo un error al ejecutar el comando.\n```",
        ephemeral: true,
      });
    }
  },
};
