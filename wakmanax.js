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
    debug: true,
    resources: {
        en: {
            translation: {
                "update_permissions": ": Please update the Bot Permissions.",
                "sent_everyone": 'I just send almanax for every channels.',
                "fail_sent": "can't schedule the almanax messages, aborting. \n",
                "fail_set_language": "can't get language from database.\n",
                "not_enough_arguments": `You didn't provide enough arguments, `,
                "too_much_arguments": `You provide too much arguments, `,
                "guild_updated": ' has been updated.',
                "updated_guild": 'Your channel has been modified for ',
                "guild_configurated": " has been inserted on DB.",
                "configurated_guild": 'Your guild has been configured for ',
                "configuration_error": 'An error occured, your server was not added to the database. Please retry.',
                "no_argument": `This command don't need arguments!`,
                'guild_cleared': 'Your Almanax channel has been cleared, I will no more post on your server.',
                'error_clear_guild': 'Your guild couldn\'t be deleted from the database. Please retry.',
                'retry_help': 'a!retry: tries to fire the almanax to your registered channel.',
                'reset_help': 'a!reset: Reset the current configuration of your server. Usefull if you want to remove the bot.',
                'configure_help': 'a!configure: configure the bot for your server. You can use this command to change the output channel or the language. Usage: a!configure en #channel.',
                'help': 'Here\'s the list of the commands:'
            }
        },
        fr: {
            translation: {
                "update_permissions": ": Please update the Bot Permissions.",
                "sent_everyone": 'I just send almanax for every channels.',
                "fail_sent": "can't schedule the almanax messages, aborting. \n",
                "fail_set_language": "can't get language from database.\n",
                "not_enough_arguments": `Vous n'avez pas mis assez d'arguments, `,
                "too_much_arguments": `Vous avez mis trop d'arguments, `,
                "guild_updated": ' has been updated.',
                "updated_guild": 'Votre canal a bien été modifié pour celui-ci: ',
                "guild_configurated": " has been inserted on DB.",
                "configurated_guild": 'Votre serveur a été configuré pour le canal ',
                "configuration_error": 'Une erreur est survenue, votre serveur n\'a pas pu être ajouté. Merci de réessayer.',
                "no_argument": `Cette command ne nécessite aucun argument!`,
                'guild_cleared': 'Votre configuration a été supprimée. Je ne posterai plus sur ce serveur.',
                'error_clear_guild': 'Votre serveur n\'a pas pu être supprimé de la base de données. Merci de réessayer.',
                'retry_help': 'a!retry: tente d\'envoyer l\'alamanax sur le canal configuré.',
                'reset_help': 'a!reset: Supprime la configuration actuelle duserveur. Utile si vous souhaitez retirer le bot de votre serveur.',
                'configure_help': 'a!configure: configure le bot pour votre serveur. Vous pouvez utiliser cette commande pour changer la langue ou le canal. Utilisation: a!configure fr #canal.',
                'help': 'Voici la liste des commandes:'
            }
        }
    }
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
                        console.log(cursor.guild + i18next.t("update_permissions"));
                    }
                }
            });
            console.log(i18next.t("sent_everyone"))
        }
    })
}

function setLanguage(language = null) {
    if (language) {
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
        console.log(i18next.t("fail_set_language") + e);
    }
}

client.on('ready', () => {
    try {
        cron.schedule('0 5 23 * * *', () =>{
            send_message();
            almanax_sent = true;
        }, {timezone: 'Europe/Paris'})
        cron.schedule('0 10 23 * * *', () =>{
            almanax_sent = false;
        }, {timezone: 'Europe/Paris'})
    } catch(e) {
        console.log(i18next.t("fail_sent") + e)
    }
    
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    setLanguage(args[0])
    
    if (command === 'configure') {
        if (args.length < 2) {
            return message.channel.send(i18next.t('not_enough_arguments') + message.author);
        }
        try {
            collection.findOne({guild: {$eq: message.guild.name}}, (err, result) => {
                if(result && result.guild == message.guild.name) {
                    let canal;
                    message.mentions.channels.forEach(channel => {
                        canal = channel.id
                    })
                    collection.updateOne({guild: {$eq: message.guild.name}}, {$set: {channel: canal, language: args[0]}})
                    console.log(message.guild.name + i18next.t('guild_updated'))
                    message.channel.send(i18next.t('updated_guild') + args[1])
                } else {
                    let canal;
                    message.mentions.channels.forEach(channel => {
                        canal = channel.id
                    })
                    let insertSQL = {guild: message.guild.name, language: args[0], channel: canal}
                    collection.insertOne(insertSQL)
                    console.log(message.guild.name + i18next.t('guild_configurated'));
                    message.channel.send(i18next.t('configurated_guild') + args[1])
                }
            })
        } catch(e) {
            console.log("can't add this server on database. Aborting. \n" + e);
            message.channel.send(i18next.t("configuration_error"))
        }
    }
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    setLanguage();
    
    if (command === 'reset') {
        if (args.length > 0) {
            return message.channel.send(i18next.t('no_argument'));
        }
         try {
            collection.findOneAndDelete({guild: {$eq: message.guild.name}}, (err, result) => {
                if(result) {
                    console.log(message.guild.name + ' has been removed from the Database')
                    return message.channel.send(i18next.t('guild_cleared'))
                }
            })
         } catch(e) {
             console.log("can't remove the server from the database. Aborting. \n" + e);
             return message.channel.send(i18next.t('error_clear_guild'))
         }
    }
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot || message.author.id != "109752351643955200") return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    setLanguage()
    
    if (command === 'resend') {
        if (args.length > 0) {
            return message.channel.send(i18next.t('no_argument'));
        }
        send_message();
    }
});

client.on('message', message => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    changeLanguage()
    
    if (command === 'retry') {
        if (args.length > 0) {
            return message.channel.send(i18next.t('no_argument'));
        }
        send_message()
    }
})

client.on('message', message => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    changeLanguage()
    
    if (command === 'help') {
        if (args.length > 0 && args.length < 2) {
            if(args[0] == 'retry') {
                return message.channel.send(i18next.t('retry_help'))
            }
            if(args[0] == 'reset') {
                return message.channel.send(i18next.t('reset_help'))
            }
            if(args[0] == 'configure') {
                return message.channel.send(i18next.t('configure_help'))
            }
        }
        else if(args.length == 0) {
            return message.channel.send(i18next.t('help') + "\n" + i18next.t('reset_help') + "\n" + i18next.t('retry_help') + "\n" + i18next.t('configure_help'))
        } else {
            return message.channel.send(i18next.t('too_much_arguments') + message.author);
        }
    }
})

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot || message.author.id != "109752351643955200") return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    changeLanguage()
    let sendmessage = ""
    
    if (command === 'update') {
        if (args.length < 0) {
            return message.channel.send(i18next.t('not_enough_arguments') + message.author);
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
