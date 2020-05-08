const i18next = require('i18next');

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

i18next.init({
    lng: 'en',
    whitelist: ['fr', 'en'],
    debug: false,
    fallbackLng: 'en',
    preload: ['fr', 'en'],
    resources: {
        en: {
            translation: {
                "updatepermissions": ": Please update the Bot Permissions.",
                "senteveryone": 'I just send almanax for every channels.',
                "failsent": "can't schedule the almanax messages, aborting. \n",
                "failsetlanguage": "can't get language from database.\n",
                "notenougharguments": `You didn't provide enough arguments, `,
                "toomucharguments": `You provide too much arguments, `,
                "guildupdated": ' has been updated.',
                "updatedguild": 'Your channel has been modified for ',
                "guildconfigurated": " has been inserted on DB.",
                "configuratedguild": 'Your guild has been configured for ',
                "configurationerror": 'An error occured, your server was not added to the database. Please retry.',
                "noargument": `This command don't need arguments!`,
                'guildcleared': 'Your Almanax channel has been cleared, I will no more post on your server.',
                'errorclear_guild': 'Your guild couldn\'t be deleted from the database. Please retry.',
                'retryhelp': 'a!retry: tries to fire the almanax to your registered channel.',
                'resethelp': 'a!reset: Reset the current configuration of your server. Usefull if you want to remove the bot.',
                'configurehelp': 'a!configure: configure the bot for your server. You can use this command to change the output channel or the language. Usage: a!configure en #channel.',
                'help': 'Here\'s the list of the commands:'
            }
        },
        fr: {
            translation: {
                "updatepermissions": ": Please update the Bot Permissions.",
                "senteveryone": 'I just send almanax for every channels.',
                "failsent": "can't schedule the almanax messages, aborting. \n",
                "failsetlanguage": "can't get language from database.\n",
                "notenougharguments": `Vous n'avez pas mis assez d'arguments, `,
                "toomucharguments": `Vous avez mis trop d'arguments, `,
                "guildupdated": ' has been updated.',
                "updatedguild": 'Votre canal a bien été modifié pour celui-ci: ',
                "guildconfigurated": " has been inserted on DB.",
                "configuratedguild": 'Votre serveur a été configuré pour le canal ',
                "configurationerror": 'Une erreur est survenue, votre serveur n\'a pas pu être ajouté. Merci de réessayer.',
                "noargument": `Cette command ne nécessite aucun argument!`,
                'guildcleared': 'Votre configuration a été supprimée. Je ne posterai plus sur ce serveur.',
                'errorclearguild': 'Votre serveur n\'a pas pu être supprimé de la base de données. Merci de réessayer.',
                'retryhelp': 'a!retry: tente d\'envoyer l\'alamanax sur le canal configuré.',
                'resethelp': 'a!reset: Supprime la configuration actuelle duserveur. Utile si vous souhaitez retirer le bot de votre serveur.',
                'configurehelp': 'a!configure: configure le bot pour votre serveur. Vous pouvez utiliser cette commande pour changer la langue ou le canal. Utilisation: a!configure fr #canal.',
                'help': 'Voici la liste des commandes:'
            }
        }
    }
})

function send_message() {
    fetch('http://almanax.kasswat.com', {method: 'get'}).then(res => res.json()).then((json) => {
        let embed;
        client.guilds.cache.forEach(guild => {
            console.log(guild)
            collection.findOne({guild: {$eq: guild.name}}, (err, cursor) => {
                if(cursor.language && (cursor.language == 'fr' || cursor.language == 'français' || cursor.language == 'french')) {
                    embed = new Discord.MessageEmbed().setTitle(json['day'] + " " + json['month'] + " " + json['year'])
                    .setDescription(json['description'][0])
                    .addField('bonus', json['bonus'][0])
                    .setImage('https://vertylo.github.io/wakassets/merydes/' + json['img'] + '.png')
                } else if(cursor.language){
                    embed = new Discord.MessageEmbed().setTitle(json['day'] + " " + json['month'] + " " + json['year'])
                    .setDescription(json['description'][1])
                    .addField('bonus', json['bonus'][1])
                    .setImage('https://vertylo.github.io/wakassets/merydes/' + json['img'] + '.png')
                }
                if(client.channels.cache.get(cursor.channel)) {
                    try {
                        client.channels.cache.get(cursor.channel).send(embed)
                    } catch(error) {
                        console.log(cursor.guild + ": Please update the Bot Permissions.");
                    }
                }
            })
        });
        console.log(i18next.t("senteveryone"))
    })
}

function setLanguage(message, language = undefined) {
    if (language != undefined) {
        i18next.changeLanguage(language);
        return;
    }
    try {
        collection.findOne({guild: {$eq: message.guild.name}}, (err, result) => {
            if(result && result.guild == message.guild.name) {
                i18next.changeLanguage(result.language);
            } else {
                i18next.changeLanguage('en');
            }
        })
    } catch(e) {
        console.log(i18next.t("failsetlanguage") + e);
    }
}

client.once('ready', () => {
    try {
        cron.schedule('42 23 * * *', () =>{
            console.log('sending almanax from cron');
            send_message();
            almanax_sent = true;
        }, {timezone: 'Europe/Paris'})
        cron.schedule('15 23 * * *', () =>{
            console.log('reset timer cron')
            almanax_sent = false;
        }, {timezone: 'Europe/Paris'})
    } catch(e) {
        console.log(i18next.t("failsent") + e)
    }       
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    setLanguage(message, args[0])
    
    if (command === 'configure') {
        if (args.length < 2) {
            return message.channel.send(i18next.t('notenougharguments') + message.author);
        }
        try {
            collection.findOne({guild: {$eq: message.guild.name}}, (err, result) => {
                if(result && result.guild == message.guild.name) {
                    let canal;
                    message.mentions.channels.forEach(channel => {
                        canal = channel.id
                    })
                    collection.updateOne({guild: {$eq: message.guild.name}}, {$set: {channel: canal, language: args[0]}})
                    console.log(message.guild.name + i18next.t('guildupdated'))
                    message.channel.send(i18next.t('updatedguild') + args[1])
                } else {
                    let canal;
                    message.mentions.channels.forEach(channel => {
                        canal = channel.id
                    })
                    let insertSQL = {guild: message.guild.name, language: args[0], channel: canal}
                    collection.insertOne(insertSQL)
                    console.log(message.guild.name + i18next.t('guildconfigurated'));
                    message.channel.send(i18next.t('configuratedguild') + args[1])
                }
            })
        } catch(e) {
            console.log("can't add this server on database. Aborting. \n" + e);
            message.channel.send(i18next.t("configurationerror"))
        }
    }
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    setLanguage(message);
    
    if (command === 'reset') {
        if (args.length > 0) {
            return message.channel.send(i18next.t('noargument'));
        }
         try {
            collection.findOneAndDelete({guild: {$eq: message.guild.name}}, (err, result) => {
                if(result) {
                    console.log(message.guild.name + ' has been removed from the Database')
                    return message.channel.send(i18next.t('guildcleared'))
                }
            })
         } catch(e) {
             console.log("can't remove the server from the database. Aborting. \n" + e);
             return message.channel.send(i18next.t('errorclearguild'))
         }
    }
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot ) return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    setLanguage(message)
    
    if (command === 'resend') {
        if (args.length > 0) {
            return message.channel.send(i18next.t('noargument'));
        } if(message.author.id == "109752351643955200") {
            console.log("it SHOULD be normal and intended that this line appear. If not, i'm in real trouble.")
            send_message();
        } else {
            console.log(message.author.username + " from " + message.guild.name + " tries to send Almanax.")
        }
        
    }
});

client.on('message', message => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    setLanguage(message)
    
    if (command === 'retry') {
        if (args.length > 0) {
            return message.channel.send(i18next.t('noargument'));
        }
        fetch('http://almanax.kasswat.com', {method: 'get'}).then(res => res.json()).then((json) => {
            collection.findOne({guild: {$eq: message.guild.name}}, (err, cursor) => {
                    if(cursor.language == 'fr' || cursor.language == 'français' || cursor.language == 'french') {
                        embed = new Discord.MessageEmbed().setTitle(json['day'] + " " + json['month'] + " " + json['year'])
                        .setDescription(json['description'][0])
                        .addField('bonus', json['bonus'][0])
                        .setImage('https://vertylo.github.io/wakassets/merydes/' + json['img'] + '.png')
                    } else {
                        embed = new Discord.MessageEmbed().setTitle(json['day'] + " " + json['month'] + " " + json['year'])
                        .setDescription(json['description'][1])
                        .addField('bonus', json['bonus'][1])
                        .setImage('https://vertylo.github.io/wakassets/merydes/' + json['img'] + '.png')
                    }
                    if(client.channels.cache.get(cursor.channel)) {
                        try {
                            return client.channels.cache.get(cursor.channel).send(embed)
                        } catch(error) {
                            console.log(cursor.guild + ": Please update the Bot Permissions.");
                            return message.channel.send("Please update the Bot Permissions.");
                        }
                        
                    }
            })
        });
    }
});

client.on('message', message => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    setLanguage(message)
    
    if (command === 'help') {
        if (args.length > 0 && args.length < 2) {
            if(args[0] == 'retry') {
                return message.channel.send(i18next.t('retryhelp'))
            }
            if(args[0] == 'reset') {
                return message.channel.send(i18next.t('resethelp'))
            }
            if(args[0] == 'configure') {
                return message.channel.send(i18next.t('configurehelp'))
            }
        }
        else if(args.length == 0) {
            return message.channel.send(i18next.t('help') + "\n" + i18next.t('resethelp') + "\n" + i18next.t('retryhelp') + "\n" + i18next.t('configurehelp'))
        } else {
            return message.channel.send(i18next.t('toomucharguments') + message.author);
        }
    }
})

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot || message.author.id != "109752351643955200") return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    setLanguage(message)
    let sendmessage = ""
    
    if (command === 'update') {
        if (args.length < 0) {
            return message.channel.send(i18next.t('notenougharguments') + message.author);
        }
        for (let index = 1; index < args.length; index++) {
            sendmessage += args[index] + " "
        }

        if (args[0] == 'fr') {
            collection.find().forEach(cursor => {
                if(cursor.language == 'fr' || cursor.language == 'français' || cursor.language == 'french') {
                    if(client.channels.cache.get(cursor.channel)) {
                        client.channels.cache.get(cursor.channel).send(sendmessage)
                    }
                }
            });
        } else {
            collection.find().forEach(cursor => {
                if(cursor.language == 'en' || cursor.language == 'english' || cursor.language == 'anglais') {
                    if(client.channels.cache.get(cursor.channel)) {
                        client.channels.cache.get(cursor.channel).send(sendmessage)
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