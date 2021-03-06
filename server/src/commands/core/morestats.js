/*
  Description: Outputs more info than the legacy stats command
*/

// module support functions
const stripIndents = require('common-tags').stripIndents;

const formatTime = (time) => {
  let seconds = time[0] + time[1] / 1e9;

  let minutes = Math.floor(seconds / 60);
  seconds = seconds % 60;

  let hours = Math.floor(minutes / 60);
  minutes = minutes % 60;

  let days = Math.floor(hours / 24);
  hours = hours % 24;

  return `${days.toFixed(0)}d ${hours.toFixed(0)}h ${minutes.toFixed(0)}m ${seconds.toFixed(0)}s`;
};

// module main
exports.run = async (core, server, socket, data) => {
  // gather connection and channel count
  let ips = {};
  let channels = {};
  for (let client of server.clients) {
    if (client.channel) {
      channels[client.channel] = true;
      ips[client.remoteAddress] = true;
    }
  }

  let uniqueClientCount = Object.keys(ips).length;
  let uniqueChannels = Object.keys(channels).length;

  ips = null;
  channels = null;

  // dispatch info
  server.reply({
    cmd: 'info',
    text: stripIndents`current-connections: ${uniqueClientCount}
                       current-channels: ${uniqueChannels}
                       users-joined: ${(core.managers.stats.get('users-joined') || 0)}
                       invites-sent: ${(core.managers.stats.get('invites-sent') || 0)}
                       messages-sent: ${(core.managers.stats.get('messages-sent') || 0)}
                       users-banned: ${(core.managers.stats.get('users-banned') || 0)}
                       users-kicked: ${(core.managers.stats.get('users-kicked') || 0)}
                       stats-requested: ${(core.managers.stats.get('stats-requested') || 0)}
                       server-uptime: ${formatTime(process.hrtime(core.managers.stats.get('start-time')))}`
  }, socket);

  // stats are fun
  core.managers.stats.increment('stats-requested');
};

// module hook functions
exports.initHooks = (server) => {
  server.registerHook('in', 'chat', this.statsCheck);
};

// hooks chat commands checking for /stats
exports.statsCheck = (core, server, socket, payload) => {
  if (typeof payload.text !== 'string') {
    return false;
  }

  if (payload.text.startsWith('/stats')) {
    this.run(core, server, socket, {
      cmd: 'morestats'
    });

    return false;
  }

  return payload;
};

// module meta
exports.info = {
  name: 'morestats',
  description: 'Sends back current server stats to the calling client',
  usage: `
    API: { cmd: 'morestats' }
    Text: /stats`
};
