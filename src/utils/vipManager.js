const fs = require('fs').promises;
const path = require('path');

const CONFIG_DIR = path.join(__dirname, '../../config');
const VIP_FILE = path.join(CONFIG_DIR, 'vips.json');

// Asegurarse de que el directorio y archivo existen
async function initVipFile() {
    try {
        // Crear directorio config si no existe
        try {
            await fs.access(CONFIG_DIR);
        } catch {
            await fs.mkdir(CONFIG_DIR);
        }

        // Crear archivo vips.json si no existe
        try {
            await fs.access(VIP_FILE);
        } catch {
            await fs.writeFile(VIP_FILE, JSON.stringify({ vipUsers: [] }, null, 2));
        }
    } catch (error) {
        console.error('Error al inicializar archivo VIP:', error);
    }
}

async function loadVips() {
    await initVipFile();
    try {
        const data = await fs.readFile(VIP_FILE, 'utf8');
        const { vipUsers } = JSON.parse(data);
        global.vipUsers = new Set(vipUsers);
        return global.vipUsers;
    } catch (error) {
        console.error('Error al cargar VIPs:', error);
        global.vipUsers = new Set();
        return global.vipUsers;
    }
}

async function saveVips() {
    try {
        await initVipFile();
        const vipUsers = Array.from(global.vipUsers);
        await fs.writeFile(VIP_FILE, JSON.stringify({ vipUsers }, null, 2));
    } catch (error) {
        console.error('Error al guardar VIPs:', error);
        throw error;
    }
}

module.exports = {
    loadVips,
    saveVips
}; 