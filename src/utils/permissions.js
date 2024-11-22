const OWNER_ID = "631907198930386950";

const freeCommands = [
  // Comandos básicos de información
  "help",
  "botinfo",
  "ping",
  "user",
  "servers",
  "avatar",

  // Comandos básicos de moderación
  "warn",
  "kick",
  "ban",
  "unban",
  "mute",

  // Comandos de utilidad básicos
  "suggest",
  "ticket",
  "redeem",

  // Comandos sociales básicos
  "hug",
  "kiss",
  "pat",
  "slap",
  "economy",
];

if (!global.vipUsers) {
  global.vipUsers = new Set();
}

function isVIP(userId) {
  return global.vipUsers.has(userId) || userId === OWNER_ID;
}

function isOwner(userId) {
  return userId === OWNER_ID;
}

function isCommandFree(commandName) {
  return freeCommands.includes(commandName);
}

module.exports = {
  freeCommands,
  isVIP,
  isOwner,
  isCommandFree,
  OWNER_ID,
};
