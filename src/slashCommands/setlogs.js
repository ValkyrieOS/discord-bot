const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const { loadConfig, saveConfig } = require("../utils/configManager");

// Crear una Collection global para almacenar los canales de logs
if (!global.logsChannels) {
  global.logsChannels = new Map();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setlogs")
    .setDescription("📝 Configura el canal de logs general")
    .addChannelOption((option) =>
      option
        .setName("canal")
        .setDescription("Canal donde se enviarán los logs")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    try {
      if (
        !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)
      ) {
        return await interaction.reply({
          content:
            "```diff\n- ❌ Solo los administradores pueden configurar el canal de logs.\n```",
          ephemeral: true,
        });
      }

      const canal = interaction.options.getChannel("canal");

      // Verificar permisos del bot en el canal
      const permissions = canal.permissionsFor(interaction.guild.members.me);
      if (!permissions.has(["ViewChannel", "SendMessages", "EmbedLinks"])) {
        return await interaction.reply({
          content:
            "```diff\n- ❌ No tengo los permisos necesarios en ese canal. Necesito: Ver canal, Enviar mensajes y Enviar enlaces.\n```",
          ephemeral: true,
        });
      }

      // Guardar el canal en la memoria y en la configuración
      global.logsChannels.set(interaction.guild.id, canal.id);

      // Cargar y actualizar la configuración
      const config = await loadConfig();
      if (!config.logs) config.logs = {};
      config.logs[interaction.guild.id] = canal.id;
      await saveConfig(config);

      // Enviar mensaje de prueba al canal
      const testEmbed = new EmbedBuilder()
        .setTitle("📝 Canal de Logs Configurado")
        .setDescription(
          "Este canal ha sido configurado como canal de logs general."
        )
        .addFields({
          name: "📋 Información",
          value: [
            "> Se registrarán los siguientes eventos:",
            "```md",
            "1. Moderación (kicks, bans, warns)",
            "2. Mensajes (ediciones, eliminaciones)",
            "3. Canales (creación, edición, eliminación)",
            "4. Roles (creación, edición, asignación)",
            "5. Miembros (entrada, salida, cambios)",
            "```",
          ].join("\n"),
        })
        .setColor("#00FF00")
        .setFooter({
          text: `Configurado por ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      await canal.send({ embeds: [testEmbed] });

      // Enviar confirmación al usuario
      const confirmEmbed = new EmbedBuilder()
        .setTitle("✅ Canal de Logs Configurado")
        .setColor("#00FF00")
        .setDescription(`Los logs generales serán enviados a ${canal}`)
        .addFields({
          name: "⚙️ Estado",
          value:
            "```diff\n+ Sistema de logs activado correctamente\n+ Canal configurado y probado\n```",
        })
        .setTimestamp();

      await interaction.reply({ embeds: [confirmEmbed] });
    } catch (error) {
      console.error("Error en comando setlogs:", error);
      await interaction.reply({
        content:
          "```diff\n- ❌ Hubo un error al configurar el canal de logs.\n```",
        ephemeral: true,
      });
    }
  },
};
