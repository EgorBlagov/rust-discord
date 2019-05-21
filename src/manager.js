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
        this.rcon = new Rcon(options);
        this.rcon.on('connected', () => this.onServerConnected());
        this.rcon.on('disconnected', () => this.onServerDisconnected());
        this.rcon.on('message', (msg) => this.onServerMessage(msg));
        this.discord = new Discord(options, this);
    }

    onServerMessage(message) {
        this.discord.send(message);
    }
    
    onDiscordMessage(username, content, roles) {
        const message = new Message(username, content, roles);
        this.rcon.run(`discordapi.message "${this.escape(message.toString())}"`);
    }

    onServerConnected() {
        this.notifyConnetion();
    }

    onServerInitRequest() {
        this.notifyConnetion();
    }

    onDiscordReady() {
        
        this.notifyConnetion();
    }

    notifyConnetion() {
        
        if (!this.discord.connected || !this.rcon.connected) {
            return;
        }
        const readyEvent = new ReadyEvent(this.discord.server, this.discord.channel.name, this.discord.adminRole);    
        console.log(readyEvent.toString());
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