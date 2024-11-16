const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const sancionesPath = path.join(__dirname, '../data/sanciones.json');

function cargarSanciones() {
    if (!fs.existsSync(sancionesPath)) {
        fs.writeFileSync(sancionesPath, JSON.stringify({ usuarios: {} }, null, 2));
        return { usuarios: {} };
    }
    return JSON.parse(fs.readFileSync(sancionesPath, 'utf-8'));
}

function guardarSanciones(data) {
    fs.writeFileSync(sancionesPath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulsa a un usuario del servidor')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('El usuario a expulsar')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Razón de la expulsión')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        const usuario = interaction.options.getUser('usuario');
        const razon = interaction.options.getString('razon');
        const moderador = interaction.user;

        // Verificar permisos
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({
                content: '❌ No tienes permisos para expulsar usuarios.',
                ephemeral: true
            });
        }

        try {
            const miembro = await interaction.guild.members.fetch(usuario.id);
            
            // Verificar si el bot puede expulsar al usuario
            if (!miembro.kickable) {
                return interaction.reply({
                    content: '❌ No puedo expulsar a este usuario. Puede que tenga un rol superior al mío.',
                    ephemeral: true
                });
            }

            // Verificar jerarquía de roles
            if (interaction.member.roles.highest.position <= miembro.roles.highest.position) {
                return interaction.reply({
                    content: '❌ No puedes expulsar a alguien con un rol igual o superior al tuyo.',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('👢 Usuario Expulsado')
                .setColor('#FF0000')
                .setThumbnail(usuario.displayAvatarURL())
                .addFields(
                    { name: '👤 Usuario', value: `${usuario.tag}`, inline: true },
                    { name: '🛡️ Moderador', value: `${moderador.tag}`, inline: true },
                    { name: '📝 Razón', value: razon }
                )
                .setTimestamp();

            // Intentar enviar DM al usuario antes de expulsarlo
            try {
                await usuario.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('👢 Has sido expulsado')
                            .setColor('#FF0000')
                            .addFields(
                                { name: '🛡️ Servidor', value: interaction.guild.name },
                                { name: '📝 Razón', value: razon },
                                { name: '👮 Moderador', value: moderador.tag }
                            )
                    ]
                });
            } catch (error) {
                console.log('No se pudo enviar DM al usuario');
            }

            // Registrar la expulsión
            const data = cargarSanciones();
            if (!data.usuarios[usuario.id]) {
                data.usuarios[usuario.id] = {
                    warns: [],
                    kicks: []
                };
            }

            data.usuarios[usuario.id].kicks.push({
                razon: razon,
                moderador: moderador.tag,
                fecha: new Date().toISOString()
            });

            guardarSanciones(data);

            // Expulsar al usuario
            await miembro.kick(razon);
            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '❌ Hubo un error al intentar expulsar al usuario.',
                ephemeral: true
            });
        }
    },
}; 