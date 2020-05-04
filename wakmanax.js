const Discord = require('discord.js');
const cron = require('node-cron');
const fetch = require('node-fetch')

const client = new Discord.Client();
const MongoClient = require('mongodb').MongoClient;
const prefix = "a!"

let collection = null;
const uri = "mongodb+srv://" + process.env['db_user'] + ":" +  process.env['db_pass'] + "@" +  process.env['db_name'] + "-l6ey6.gcp.mongodb.net/test?retryWrites=true&w=majority";
const mongo_client = new MongoClient(uri, { useNewUrlParser: true });
let almanax_sent = false;

mongo_client.connect(err => {
    if(err) throw err;
    collection = mongo_client.db("wakmanax").collection("guilds");
});

function send_message() {
    fetch('http://almanax.kasswat.com', {method: 'get'}).then(res => res.json()).then((json) => {
        if(!almanax_sent) {
            collection.find().forEach(cursor => {
                let embed;
                if(cursor.language == 'fr' || cursor.language == 'français' || cursor.language == 'french') {
                    embed = new Discord.RichEmbed().setTitle(json['day'] + " " + json['month'] + " " + json['year'])
                    .setDescription(json['description'][0])
                    .addField('bonus', json['bonus'][0])
                    .setImage('https://vertylo.github.io/wakassets/merydes/' + json['img'] + '.png')
                } else {
                    embed = new Discord.RichEmbed().setTitle(json['day'] + " " + json['month'] + " " + json['year'])
                    .setDescription(json['description'][1])
                    .addField('bonus', json['bonus'][1])
                    .setImage('https://vertylo.github.io/wakassets/merydes/' + json['img'] + '.png')
                }
                if(client.channels.get(cursor.channel)) {
                    try {
                        client.channels.get(cursor.channel).send(embed)
                    } catch(error) {
                        console.log(cursor.guild + ": Please update the Bot Permissions.");
                    }
                }
            });
            almanax_sent = true;
            console.log('I just send almanax for every channels.')
        }
    })
}

client.on('ready', () => {
    try {
        cron.schedule('0 5 23 * * *', () =>{
            send_message();
        }, {timezone: 'Europe/Paris'})
        cron.schedule('0 10 23 * * *', () =>{
            almanax_sent = false;
        }, {timezone: 'Europe/Paris'})
    } catch(e) {
        console.log("can't schedule the almanax messages, aborting. \n" + e)
    }
    
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    
    if (command === 'configure') {
        if (args.length < 2) {
            return message.channel.send(`You didn't provide enough arguments, ${message.author}!`);
        }
        try {
            collection.findOne({guild: {$eq: message.guild.name}}, (err, result) => {
                if(result && result.guild == message.guild.name) {
                    let canal;
                    message.mentions.channels.forEach(channel => {
                        canal = channel.id
                    })
                    collection.updateOne({guild: {$eq: message.guild.name}}, {$set: {channel: canal, language: args[0]}})
                    console.log('A guild has been updated')
                    message.channel.send('Your channel has been modified for ' + args[1])
                } else {
                    let canal;
                    message.mentions.channels.forEach(channel => {
                        canal = channel.id
                    })
                    let insertSQL = {guild: message.guild.name, language: args[0], channel: canal}
                    collection.insertOne(insertSQL)
                    console.log("A guild has been inserted on DB.");
                    message.channel.send('Your guild has been configured for ' + args[1])
                }
            })
        } catch(e) {
            console.log("can't add this server on database. Aborting. \n" + e);
            message.channel.send('An error occured, your server was not added to the database. Please retry.')
        }
    }
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    
    if (command === 'reset') {
        if (args.length > 0) {
            return message.channel.send(`This command don't need arguments!`);
        }
         try {
            collection.findOneAndDelete({guild: {$eq: message.guild.name}}, (err, result) => {
                if(result) {
                    return message.channel.send('Your Almanax channel has been cleared, I will no more post on your server.')
                }
            })
         } catch(e) {
             console.log("can't remove the server from the database. Aborting. \n" + e);
             return message.channel.send('Your guild couldn\'t be deleted from the database. Please retry.')
         }
    }
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot || message.author.id != "109752351643955200") return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    
    if (command === 'resend') {
        if (args.length > 0) {
            return message.channel.send(`This command don't need arguments!`);
        }
        send_message();
    }
});

client.on('message', message => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    
    if (command === 'retry') {
        if (args.length > 0) {
            return message.channel.send(`This command don't need arguments!`);
        }
        fetch('http://almanax.kasswat.com', {method: 'get'}).then(res => res.json()).then((json) => {
            collection.findOne({guild: {$eq: message.guild.name}}, (err, cursor) => {
                try{
                    if(cursor.language == 'fr' || cursor.language == 'français' || cursor.language == 'french') {
                        embed = new Discord.RichEmbed().setTitle(json['day'] + " " + json['month'] + " " + json['year'])
                        .setDescription(json['description'][0])
                        .addField('bonus', json['bonus'][0])
                        .setImage('https://vertylo.github.io/wakassets/merydes/' + json['img'] + '.png')
                    } else {
                        embed = new Discord.RichEmbed().setTitle(json['day'] + " " + json['month'] + " " + json['year'])
                        .setDescription(json['description'][1])
                        .addField('bonus', json['bonus'][1])
                        .setImage('https://vertylo.github.io/wakassets/merydes/' + json['img'] + '.png')
                    }
                    if(client.channels.get(cursor.channel)) {
                        client.channels.get(cursor.channel).send(embed)
                    }
                } catch(error) {
                    console.log(cursor.guild + ": Please update the Bot Permissions.");
                }
            })
        });
    }
})

client.on('message', message => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    
    if (command === 'help') {
        if (args.length > 0 && args.length < 2) {
            if(args[0] == 'retry') {
                return message.channel.send('a!retry: tries to fire the almanax to your registered channel.')
            }
            if(args[0] == 'reset') {
                return message.channel.send('a!reset: Reset the current configuration of your server. Usefull if you want to remove the bot.')
            }
            if(args[0] == 'configure') {
                return message.channel.send('a!configure: configure the bot for your server. You can use this command to change the output channel. Usage: a!configure <language> <#channel>.')
            }
        }
        else if(args.length == 0) {
            return message.channel.send('Here\'s the list of the commands:\na!retry: tries to fire the almanax to your registered channel.\na!reset: Reset the current configuration of your server. Usefull if you want to remove the bot.\na!configure: configure the bot for your server. You can use this command to change the output channel. Usage: a!configure <language> <#channel>.')
        } else {
            return message.channel.send(`Too much argument for this command!`);
        }
    }
})

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot || message.author.id != "109752351643955200") return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    let sendmessage = ""
    
    if (command === 'update') {
        if (args.length < 0) {
            return message.channel.send(`This command need arguments!`);
        }
        for (let index = 1; index < args.length; index++) {
            sendmessage += args[index] + " "
        }

        if (args[0] == 'fr') {
            collection.find().forEach(cursor => {
                if(cursor.language == 'fr' || cursor.language == 'français' || cursor.language == 'french') {
                    if(client.channels.get(cursor.channel)) {
                        client.channels.get(cursor.channel).send(sendmessage)
                    }
                }
            });
        } else {
            collection.find().forEach(cursor => {
                if(cursor.language == 'en' || cursor.language == 'english' || cursor.language == 'anglais') {
                    if(client.channels.get(cursor.channel)) {
                        client.channels.get(cursor.channel).send(sendmessage)
                    }
                }
            });
        }
    }
})

/*
client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();

    if(command === 'news') {

    }
})
*/
client.login(process.env['token']);
