const Discord = require('discord.js');
const cron = require('node-cron');
const fetch = require('node-fetch')

const client = new Discord.Client();
const MongoClient = require('mongodb').MongoClient;
const prefix = "a!"

let collection = null;
const uri = "mongodb+srv://" + process.env['db_user'] + ":" +  process.env['db_pass'] + "@" +  process.env['db_name'] + "-l6ey6.gcp.mongodb.net/test?retryWrites=true&w=majority";
const mongo_client = new MongoClient(uri, { useNewUrlParser: true });
mongo_client.connect(err => {
    if(err) throw err;
    collection = mongo_client.db("wakmanax").collection("guilds");
});

function send_message() {
    fetch('http://almanax.kasswat.com', {method: 'get'}).then(res => res.json()).then((json) => {
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
                client.channels.get(cursor.channel).send(embed)
            }
        });
        console.log('I just send almanax for every channels.')
    })
}

client.on('ready', () => {
    try {
        cron.schedule('45 7 * * *', () =>{
            send_message();
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
    if (!message.content.startsWith(prefix) || message.author.bot) return;
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
            })
        });
    }
})

client.login(process.env['token']);
