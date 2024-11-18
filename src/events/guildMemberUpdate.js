module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember) {
        try {
            // Verificar si hay prefijos configurados
            if (!global.prefixConfig) return;
            
            const guildConfig = global.prefixConfig.get(newMember.guild.id);
            if (!guildConfig) return;

            // Obtener roles añadidos
            const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
            
            // Verificar si algún rol añadido tiene prefijo configurado
            for (const [roleId, prefix] of Object.entries(guildConfig)) {
                if (addedRoles.has(roleId)) {
                    try {
                        const newNickname = prefix.replace('{username}', newMember.user.username);
                        await newMember.setNickname(newNickname);
                        break; // Solo aplicar el primer prefijo encontrado
                    } catch (error) {
                        console.error('Error al aplicar prefijo automático:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error en evento guildMemberUpdate:', error);
        }
    }
}; 