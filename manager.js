const { Rcon } = require('./rcon');
const { Discord } = require('./discord');

class Role {
    constructor(role) {
        this.color = `#${role.color.toString(16)}`;
        this.name = role.name;
        this.id = role.id;
    }

    toString() {
        return JSON.stringify(this);
    }
}

class ReadyEvent {
    constructor(serverName, channelName, adminRole) {
        this.server = serverName;
        this.channel = channelName;
        this.adminRole = new Role(adminRole);
    }

    toString() {
        return JSON.stringify(this);
    }
}

class Message {
    constructor(username, content, roles) {
        this.username = username;
        this.content = content;
        this.roles = roles.map(x => new Role(x));
    }
    
    toString() {
        return JSON.stringify(this);
    }
}

class Manager {
    constructor(options) {
        this.rcon = new Rcon(options.RconIP, options.RconPort, options.RconPassword, this);
        this.discord = new Discord(options.BotToken, options.ChannelName, this);
    }

    onServerMessage(message) {
        this.discord.send(message);
    }

    onDiscordMessage(username, content, roles) {
        const message = new Message(username, content, roles);
        this.rcon.run(`discordapi.message "${this.escape(message.toString())}"`);
    }

    onDiscordReady(serverName, channelName, adminRole) {
        const readyEvent = new ReadyEvent(serverName, channelName, adminRole);    
        this.rcon.run(`discordapi.ready "${this.escape(readyEvent.toString())}"`);
    }

    escape(input) {
        return input.replace(/(["\\])/gm, '\\$1');
    }

    run() {
        this.rcon.connect();
        this.discord.login();
    }
}

module.exports.Manager = Manager;