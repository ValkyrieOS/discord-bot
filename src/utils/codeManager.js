const fs = require('fs').promises;
const path = require('path');

const CODES_FILE = path.join(__dirname, '../../data/codes.json');

// Asegurar que el directorio data existe
async function ensureDirectory() {
    const dir = path.dirname(CODES_FILE);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

// Cargar códigos
async function loadCodes() {
    try {
        await ensureDirectory();
        const data = await fs.readFile(CODES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Si el archivo no existe o está corrupto, crear uno nuevo
        const defaultData = { codes: {} };
        await saveCodes(defaultData);
        return defaultData;
    }
}

// Guardar códigos
async function saveCodes(data) {
    await ensureDirectory();
    await fs.writeFile(CODES_FILE, JSON.stringify(data, null, 2));
}

module.exports = { loadCodes, saveCodes }; 