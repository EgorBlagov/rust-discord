const WebRcon = require('webrconjs');
const EventEmitter = require('events');

const messageCommand  = 'discord.send';
const terminateCommand = 'discord.terminate';

function prefix(command) {
    return `[DiscordAPI] ${command}`;
}

class Rcon extends EventEmitter{
    constructor(options) {
        super()
        this.ip = options.ip;
        this.port = options.port;
        this.password = options.password;
        this.reconnectPeriod = options['reconnect-period'];
        console.log(`ws://${this.ip}:${this.port}/${this.password}`);
        this.initRcon();
    }

    initRcon() {
        this.rcon = new WebRcon(this.ip, this.port);
        this.rcon.on('connect', () => {
            console.log('RCON connected');
            this.emit('connected');
        });
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
        if (message.startsWith(prefix(messageCommand))) {
            message = message.slice(prefix(messageCommand).length);
            console.log(`RCON <- SERVER: ${message}`);
            this.emit('message', message);
        } else if (message.startsWith(prefix(terminateCommand))) {
            this.emit('terminate');
        }
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

    get connected() {
        return this.rcon != undefined && this.rcon.connected;
    }
}

module.exports.Rcon = Rcon;