const fs = require('fs').promises;
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'serversaveconfig.json');

// Función para cargar la configuración
async function loadConfig() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            const initialConfig = {
                prefix: {},
                suggestions: {},
                logs: {},
                autorole: {}
            };
            await fs.writeFile(CONFIG_PATH, JSON.stringify(initialConfig, null, 2));
            return initialConfig;
        }
        throw error;
    }
}

// Función para guardar la configuración
async function saveConfig(config) {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

module.exports = { loadConfig, saveConfig }; 