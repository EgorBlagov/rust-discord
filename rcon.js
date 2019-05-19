const WebRcon = require('webrconjs');

const magicDiscordPrefix = 'discord.send';
const discordPrefix = `[DiscordAPI] ${magicDiscordPrefix}`;

class Rcon {
    constructor(ip, port, password, manager) {
        this.ip = ip;
        this.port = port;
        this.password = password;
        this.reconnectPeriod = 15000;
        this.manager = manager;
        console.log(`${ip} ${port} ${password}`);
        this.initRcon();
    }

    initRcon() {
        this.rcon = new WebRcon(this.ip, this.port);
        this.rcon.on('connect', () => console.log('RCON connected'));
        this.rcon.on('disconnect', () => {
            console.log('RCON disconnected');
            this.reconnect();
        });
        this.rcon.on('message', (msg) => this.processMessage(msg));
        this.rcon.on('error', (err) => console.log('RCON error:', err));
    }

    processMessage (msg) {
        if (msg.type !== 'Generic') {
            return;
        }

        let message = msg.message;
        if (!message.startsWith(discordPrefix)) {
            return;
        }
        message = message.slice(discordPrefix.length);
        console.log(`RCON <- SERVER: ${message}`);
        this.manager.onServerMessage(message);
    }

    reconnect() {
        setTimeout(() => {
            console.log('RCON trying to reconnect');
            this.rcon.connect(this.password);
        }, this.reconnectPeriod);
    }

    run(cmd) {
        if (this.rcon != undefined && this.rcon.connect) {
            this.rcon.run(cmd);
        } else {
            console.error(`RCON is disconnected, unable to run ${cmd}`);
        }
    }

    connect() {
        this.rcon.connect(this.password);
    }
}

module.exports.Rcon = Rcon;