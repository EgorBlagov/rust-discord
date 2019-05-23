const minimist = require('minimist');
const fs = require('fs');
const path = require('path');
const { Manager } = require('./manager');

let argDescriptions = [
    {
        alias: 'h',
        name: 'help',
        description: 'Use to show this help',
        internal: true,
    },
    {
        alias: 's',
        name: 'service',
        description: 'Generate service file',
        internal: true,
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
    },
    {
        alias: 'r',
        name: 'reconnect-period',
        description: 'Delay between reconnects to RCON and Discord (ms)',
        default: 3000
    },
    {
        alias: 'R',
        name: 'retry-count',
        description: 'Number of retries when send to Discord',
        default: 3
    },
    {
        alias: 'S',
        name: 'send-period',
        description: 'Delay between sends to Discord (ms)',
        default: 1000
    }
]
const alias = {};
for (const arg of argDescriptions) {
    alias[arg.alias] = arg.name;
}

const argDefault = {};
for (const arg of argDescriptions) {
    if (arg.default !== undefined) {
        argDefault[arg.name] = arg.default;
    }
}

let args = minimist(process.argv.slice(2), {  
    alias,
    default: argDefault
});

if (args.help === true) {
    let result = '';
    for (const arg of argDescriptions) {
        result = result.concat(`-${arg.alias} --${arg.name}\t${arg.description}\n`);
    }
    console.log(result);
    process.exit(0);
}

for (const arg of argDescriptions) {
    if (args[arg.name] === undefined && arg.internal !== true) {
        console.error(`parameter '${arg.name}' is not specified please check args`);
        process.exit(1);
    }
}


if (args.service === true) {
    const argsToService = [];
    for (const entry of Object.entries(args)) {
        if (argDescriptions.find(x => x.name === entry[0]) === undefined) {
            continue;
        }
        const description = argDescriptions.filter(x => x.name === entry[0])[0];
        if (description.internal === true ||
            entry[0] === description.alias) {
            continue;
        }

        argsToService.push(`--${entry[0]} ${entry[1]}`);
    }
    const data = `[Unit]
Description=Discord connectivity service
After=network.target

[Service]
Type=simple
Restart=always
User=opasnostya
WorkingDirectory=${process.cwd()}
ExecStart=${path.resolve(process.cwd(), process.argv[0])} ${argsToService.join(' ')}

[Install]
WantedBy=multi-user.target
`
    const filename = 'discord.service';
    fs.writeFileSync(filename, data);
    console.log(`service was written to ${filename}`);
    process.exit(0);
}

const manager = new Manager(args);
manager.run();
