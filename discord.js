const discordjs = require('discord.js');

class Discord {
    constructor(botToken, channelName, manager) {
        this.channel = null;
        this.botToken = botToken;
        this.channelName = channelName;
        this.manager = manager;
        this.reconnectPeriod = 15000;
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
        this.manager.onDiscordReady(
            this.guild.name,
            this.channel.name,
            this.guild.roles.filter(x => x.name == 'Admin').first()
        );
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
        this.manager.onDiscordMessage(msg.author.username, msg.content, roles);
    }

    send(message) {
        if (this.channel != undefined) {
            this.channel.send(message);
        }
    }
    get guild() {
        return this.channel.guild
    }    
}

module.exports.Discord = Discord;
