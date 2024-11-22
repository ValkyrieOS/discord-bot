const fs = require('fs').promises;
const path = require('path');

const ECONOMY_FILE = path.join(__dirname, '../../data/economy.json');

// Asegurarse de que el directorio data existe
async function ensureDirectoryExists() {
    const dir = path.dirname(ECONOMY_FILE);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

async function loadEconomy() {
    try {
        await ensureDirectoryExists();
        const data = await fs.readFile(ECONOMY_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Si el archivo no existe, retornar objeto vacío
            return {};
        }
        console.error('Error al cargar la economía:', error);
        throw error;
    }
}

async function saveEconomy(economyData) {
    try {
        await ensureDirectoryExists();
        await fs.writeFile(ECONOMY_FILE, JSON.stringify(economyData, null, 2));
    } catch (error) {
        console.error('Error al guardar la economía:', error);
        throw error;
    }
}

module.exports = {
    loadEconomy,
    saveEconomy
}; 