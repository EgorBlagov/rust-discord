const discordjs = require('discord.js');
const EventEmitter = require('events');

class Discord extends EventEmitter {
    constructor(options) {
        super();
        this.channel = null;
        this.botToken = options.token;
        this.channelName = options.channel;
        this.sendRetries = options['retry-count'];
        this.sendRetryPeriod = options['send-period'];
        this.reconnectPeriod  = options['reconnect-period'];
        this.initClient();
    }

    initClient() {
        this.client = new discordjs.Client({
            disabledEvents: ['TYPING_START']
        });
        this.client.on('ready', () => this.handleReady());
        this.client.on('message', (msg) => this.handleMessage(msg));
        this.client.on('error', (err) => {
            console.log(`error: ${JSON.stringify(err)}`);
            this.reconnect();
        });
    }

    reconnect() {
        this.client.destroy();
        this.channel = undefined;
        this.login();
    }

    async login() {
        try {
            await this.client.login(this.botToken);
        } catch (err) {
            console.error("Discord unable to login");
            setTimeout(() => this.login(), this.reconnectPeriod);
        }
    }

    handleReady() {
        this.channel = this.client.channels.filter(x => x.name === this.channelName).first();
        if (this.channel === undefined) {
            console.error(`Unable to find channel ${this.channelName}`);
            this.reconnect();
            return;
        }
        console.log(`found channel: ${this.guild.name}: ${this.channel.name}`);
        this.emit('connected');
    }

    handleMessage(msg) {
        if (msg.author.id == this.client.user.id) {
            return;
        }

        if (msg.channel !== this.channel) {
            return;
        }

        console.log(`Discord <- ${msg.author.username}: ${msg.content}`);
        const roles = this.guild.members.filter(x => x.user === msg.author).first().roles.filter(x => x.name !== '@everyone');
        this.emit('message', msg.author.username, msg.content, roles);
    }

    async send(message) {
        if (this.channel != undefined) {
            let retriesLeft = this.sendRetries;

            this.guild.roles.tap((r) => {
                message = message.replace(`@${r.name}`, `<@&${r.id}>`);
            });

            this.guild.members.tap((m) => {
                message = message.replace(`@${m.user.username}`, `<@${m.user.id}>`);
            })

            while(retriesLeft > 0) {
                try {
                    retriesLeft--;
                    await this.channel.send(message);
                    break;
                } catch (error) {
                    if (retriesLeft === 0) {
                        console.error(`Unable to send: ${message}, skipping`);
                    } else {
                        console.warn(`Unable to send: ${message}, retries left: ${retriesLeft}, retrying in ${this.sendRetryPeriod/1000}`);
                        await new Promise(resolve => setTimeout(resolve, this.sendRetryPeriod));
                    }
                }
            }
        }
    }

    get guild() {
        return this.channel.guild
    } 
    
    get connected() {
        return this.channel != undefined && this.client != undefined;
    }
}

module.exports.Discord = Discord;
