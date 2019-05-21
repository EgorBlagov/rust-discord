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
        this.rcon.on('message', (msg) => this.onServerMessage(msg));
        this.discord = new Discord(options);
        this.discord.on('message', (username, content, roles) => this.onDiscordMessage(username, content, roles));
    }

    onServerMessage(message) {
        this.discord.send(message);
    }

    onDiscordMessage(username, content, roles) {
        const message = new Message(username, content, roles);
        this.rcon.run(`discordapi.message "${this.escape(message.toString())}"`);
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