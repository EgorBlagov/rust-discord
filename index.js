const minimist = require('minimist');
const { Manager } = require('./manager');

let argDescriptions = [
    {
        alias: 'h',
        name: 'help',
        description: 'Use to show this help'
    },
    {
        alias: 't',
        name: 'token',
        description: 'Discord bot token'
    },
    {
        alias: 'c',
        name: 'channel',
        description: 'Discord channel name'
    },
    {
        alias: 'i',
        name: 'ip',
        description: '\tIP of Server RCON'
    },
    {
        alias: 'p',
        name: 'port',
        description: 'Port of Server RCON'
    },
    {
        alias: 'P',
        name: 'password',
        description: 'Password of Server RCON'
    }
]
const alias = {};
for (const arg of argDescriptions) {
    alias[arg.alias] = arg.name;
}

let args = minimist(process.argv.slice(2), {  
    alias
});

if (args.help === true) {
    let result = '';
    for (const arg of argDescriptions) {
        result = result.concat(`-${arg.alias} --${arg.name}\t${arg.description}\n`);
    }
    console.log(result);
    process.exit(0);
}

const Settings = {
    BotToken: args.token,
    ChannelName: args.channel,
    RconIP: args.ip,
    RconPort: args.port,
    RconPassword: args.password
}
for (const entry of Object.entries(Settings)) {
    if (entry[1] === undefined) {
        console.error(`parameter ${entry[0]} is not specified please check args`);
        process.exit(1);
    }
}
const manager = new Manager(Settings);
manager.run();
