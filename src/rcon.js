const WebRcon = require('webrconjs');
const EventEmitter = require('events');

const messageCode = 'discord.send';

function prefix(init) {
    return `[DiscordAPI] ${init}`;
}

class Rcon extends EventEmitter {
    constructor(options) {
        super();
        this.ip = options.ip;
        this.port = options.port;
        this.password = options.password;
        this.reconnectPeriod = options['reconnect-period'];
        console.log(`ws://${this.ip}:${this.port}/${this.password}`);
        this.initRcon();
    }

    async call(method, args) {
        if (!this.rcon.connected) {
            throw new Error('RCON is not connected');
        }

        this.rcon.run(method);
        try {
            const rcon = this.rcon;
            const result = await new Promise((resolve, reject) => {
                function methodHandler(msg) {
                    const content = msg.message;
                    if (content.startsWith(prefix(method))) {
                        rcon.removeListener('message', methodHandler);
                        resolve(content.slice(prefix(method).length));
                    }
                }
                rcon.on('message', methodHandler);
                setTimeout(() => {
                    rcon.removeListener('message', methodHandler);
                    reject(`Unable to execute ${method}, timeout is reached`);
                }, 5000);
            });
            return result;
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    initRcon() {
        this.rcon = new WebRcon(this.ip, this.port);
        this.rcon.on('connect', () => this.handleConnected());
        this.rcon.on('disconnect', () => {
            console.log('RCON disconnected');
            this.reconnect();
        });
        this.rcon.on('message', (msg) => this.processMessage(msg));
        this.rcon.on('error', (err) => console.log('RCON error:', err));
    }

    handleConnected() {
        console.log('RCON connected');
        this.emit('connected');
    }

    processMessage (msg) {
        if (msg.type !== 'Generic') {
            return;
        }

        let message = msg.message;
        if (message.startsWith(prefix(messageCode))) {
            message = message.slice(prefix(messageCode).length);
            console.log(`RCON <- SERVER: ${message}`);
            this.emit('message', message);
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
