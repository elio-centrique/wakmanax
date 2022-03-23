const i18next = require('i18next');

const dotenv = require("dotenv")
dotenv.config();

const Discord = require('discord.js');
const cron = require('node-cron');

const moment = require('moment-timezone');

const client = new Discord.Client();
const MongoClient = require('mongodb').MongoClient;
const prefix = "a!"

let collection = null;
const uri = "mongodb+srv://" + process.env['db_user'] + ":" +  process.env['db_pass'] + "@" +  process.env['db_name'] + "-l6ey6.gcp.mongodb.net/test?retryWrites=true&w=majority";
const mongo_client = new MongoClient(uri, { useNewUrlParser: true });
let almanax_sent = false;
let cheerio = require ('cheerio');
const axios = require('axios').default;


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
                "failsent": " can't schedule the almanax messages, aborting. \n",
                "failsetlanguage": " can't get language from database.\n",
                "notenougharguments": 'You didn\'t provide enough arguments, ',
                "toomucharguments": 'You provide too much arguments, ',
                "guildupdated": ' has been updated.',
                "updatedguild": 'Your channel has been modified for ',
                "guildconfigurated": " has been inserted on DB.",
                "configuratedguild": 'Your guild has been configured for ',
                "configurationerror": ' An error occured, your server was not added to the database. Please retry.',
                "noargument": 'This command don\'t need arguments!',
                'guildcleared': 'Your Almanax channel has been cleared, I will no more post on your server.',
                'errorclear_guild': 'Your guild couldn\'t be deleted from the database. Please retry.',
                'retryhelp': 'a!retry: tries to fire the almanax to your registered channel.',
                'resethelp': 'a!reset: Reset the current configuration of your server. Usefull if you want to remove the bot.',
                'configurehelp': 'a!configure: configure the bot for your server. You can use this command to change the output channel or the language. Usage: a!configure en #channel.',
                'help': 'Here\'s the list of the commands:',
                'noauthorized': 'You\'re not allowed to use this command',
                'nogames': 'No game has been registered yet for your server',
                'gamebonus': 'Your server will receive the bonus for those games: ',
                'gamesupdated': 'I will now give the almanax for theses games: ',
                'gamenotreconized': 'Your games haven\'t been reconized. Please try again'
            }
        },
        fr: {
            translation: {
                "updatepermissions": ": Please update the Bot Permissions.",
                "senteveryone": 'I just send almanax for every channels.',
                "failsent": "can't schedule the almanax messages, aborting. \n",
                "failsetlanguage": " can't get language from database.\n",
                "notenougharguments": 'Vous n\'avez pas mis assez d\'arguments, ',
                "toomucharguments": 'Vous avez mis trop d\'arguments, ',
                "guildupdated": ' has been updated.',
                "updatedguild": 'Votre canal a bien été modifié pour celui-ci: ',
                "guildconfigurated": " has been inserted on DB.",
                "configuratedguild": 'Votre serveur a été configuré pour le canal ',
                "configurationerror": ' Une erreur est survenue, votre serveur n\'a pas pu être ajouté. Merci de réessayer.',
                "noargument": 'Cette command ne nécessite aucun argument!',
                'guildcleared': 'Votre configuration a été supprimée. Je ne posterai plus sur ce serveur.',
                'errorclearguild': 'Votre serveur n\'a pas pu être supprimé de la base de données. Merci de réessayer.',
                'retryhelp': 'a!retry: tente d\'envoyer l\'alamanax sur le canal configuré.',
                'resethelp': 'a!reset: Supprime la configuration actuelle duserveur. Utile si vous souhaitez retirer le bot de votre serveur.',
                'configurehelp': 'a!configure: configure le bot pour votre serveur. Vous pouvez utiliser cette commande pour changer la langue ou le canal. Utilisation: a!configure fr #canal.',
                'help': 'Voici la liste des commandes:',
                'noauthorized': 'Vous n\'êtes pas autorisé à utiliser la commande.'
            }
        }
    }
})

async function set_games(message, mongo_collection, games) {
    console.log(["wakfu","dofus"].includes(games));
    if(["wakfu", "dofus"].includes(games.toString().toLowerCase())) {
        let result = await mongo_collection.findOne({guild_id: {$eq: message.guild.id}})
        if (result && result.guild_id === message.guild.id) {
            if (result.games) {
                mongo_collection.updateOne({guild_id: {$eq: message.guild.id}}, {$set: {games: games}});
                console.log("Update server " + message.guild.name + ": set games "+ games);
                return message.channel.send(i18next.t("gamesupdated") + games).catch((error)=>{
                    message.author.createDM().then(() => {
                        message.author.send(result.guild + ": P)lease update the Bot Permissions.")
                    })
                    console.log(result.guild + ": Please update the Bot Permissions.");
                });
            } else {
                return message.channel.send(i18next.t("nogames")).catch((error)=>{
                    message.author.createDM().then(() => {
                        message.author.send(result.guild + ": Please update the Bot Permissions.")
                    })
                    console.log(result.guild + ": Please update the Bot Permissions.");
                });
            }
        } else {
            return message.channel.send(i18next.t("nogames")).catch((error)=>{
                message.author.createDM().then(() => {
                    message.author.send(result.guild + ": Please update the Bot Permissions.")
                })
                console.log(result.guild + ": Please update the Bot Permissions.");
            });
        }
    } else {
        return message.channel.send(i18next.t("gamenotreconized")).catch((error)=>{
            message.author.createDM().then(() => {
                message.author.send(result.guild + ": Please update the Bot Permissions.")
            })
            console.log(result.guild + ": Please update the Bot Permissions.");
        });
    }

}

async function get_frame_fr(){
    let tmp_frame;
    await axios.get('http://www.krosmoz.com/fr/almanax').then((res) => {
        let $ = cheerio.load(res.data);

        let frame = {
            day: $("span[class=day-number]").text(),
            month: $("span[class=day-text]").text(),
            name: $("div#almanax_boss span.title").text(),
            description_fr: $("div#almanax_boss_desc").text().replace($("div#almanax_boss span.title").text(), ""),
            img: $("div#almanax_boss_image img").attr("src"),
            dofus_bonus_fr: {
                bonus: $("div.more").text()
                    .replace(/ {2,}/gm, "")
                    .replace(/\n{2,}/gm, "\n")
                    .slice($("div.more").text()
                        .replace(/ {2,}/gm, "")
                        .replace(/\n{2,}/gm, "\n").length / 2 + 1)
            }
        }
        return frame
    }).then((frame) => {
        tmp_frame = frame;
    })
    return tmp_frame;
}

async function get_frame_en() {
    let tmp_frame;
    await axios.get('http://www.krosmoz.com/en/almanax').then((res) => {
        let $ = cheerio.load(res.data);

        let frame = {
            day: $("span[class=day-number]").text().toString(),
            month: $("span[class=day-text]").text().toString(),
            name: $("div#almanax_boss span.title").text().toString(),
            description_en: $("div#almanax_boss_desc").text().toString(),
            img: $("div#almanax_boss_image img").attr("src").toString(),
            dofus_bonus_en: {
                bonus: $("div.more").text()
                    .replace(/ {2,}/gm, "")
                    .replace(/\n{2,}/gm, "\n")
                    .slice($("div.more").text()
                        .replace(/ {2,}/gm, "")
                        .replace(/\n{2,}/gm, "\n").length / 2 + 1)
            }
        }
        return frame
    }).then((frame) => {
        tmp_frame = frame;
    })
    return tmp_frame;
}

async function get_frame_total() {
    let json_total;
    let tmp_json;
    json_total = await get_frame_fr();
    tmp_json = await get_frame_en();
    json_total['description_en'] = tmp_json['description_en'];
    json_total['dofus_bonus_en'] = tmp_json['dofus_bonus_en'];
    return json_total;
}

function get_wakfu_bonus(){
    let bonus = [];
    const today = moment().tz('Europe/Paris');
    const compare = moment("20191121").tz('Europe/Paris');
    let difference = today.diff(compare, 'days');
    switch(difference % 5) {
        case 0:
            bonus[0] = "+40 Prospection";
            bonus[1] = "+40 Prospecting";
            break;
        case 1:
            bonus[0] = "+20% XP & Vitesse de Fabrication";
            bonus[1] = "+20% XP & Speed Craft";
            break;
        case 2:
            bonus[0] = "+30% XP Récolte et Plantation";
            bonus[1] = "+30% XP Harvest & Planting";
            break;
        case 3:
            bonus[0] = "+20% Quantité de Récolte et Chance de Plantation";
            bonus[1] = "+20% Quantity of Harvest & +20% Chance of Planting";
            break;
        case 4:
            bonus[0] = "+40 Sagesse";
            bonus[1] = "+40 Wisdom";
            break;
    }
    return bonus;
}


async function send_message() {
    get_frame_total().then((json) => {
        let wakfu_bonus = get_wakfu_bonus();
        let embed;
        json['description_fr'] = json['description_fr'].slice(json['description_fr'].indexOf(" "));
        json['description_en'] = json['description_en'].slice(json['description_en'].indexOf(" "));
        client.guilds.cache.forEach(guild => {
            collection.findOne({guild_id: {$eq: guild.id}}, async (err, cursor) => {
                if (cursor) {
                    if (cursor && cursor.language) {
                        if (cursor.language.toLowerCase() === 'fr' || cursor.language.toLowerCase() === 'français' || cursor.language.toLowerCase() === 'french') {
                            embed = new Discord.MessageEmbed().setTitle(json['day'] + " " + json['month'] + " 977")
                                .setDescription(json['description_fr'])
                                .addField('\u200b', '\u200b')
                                .addField('BONUS WAKFU', wakfu_bonus[0])
                                //.addField('\u200b', '\u200b')
                                //.addField('BONUS DOFUS', json['dofus_bonus_fr']['bonus'])
                                .setImage(json['img'])
                        } else {
                            embed = new Discord.MessageEmbed().setTitle(json['day'] + " " + json['month'] + " 977")
                                .setDescription(json['description_en'])
                                .addField('\u200b', '\u200b')
                                .addField('WAKFU\'S BONUS', wakfu_bonus[1])
                                //.addField('\u200b', '\u200b')
                                //.addField('BONUS DOFUS', json['dofus_bonus_en']['bonus'])
                                .setImage(json['img'])
                        }
                    }
                    if (client.channels.cache.get(cursor.channel)) {
                        client.channels.cache.get(cursor.channel).send(embed).catch((error)=>{
                            console.log(cursor.guild + ": Please update the Bot Permissions.");
                        });
                    }
                }
            })
        });
        console.log(i18next.t("senteveryone"))
    })

}

function setLanguage(message, language = undefined) {
    if (language !== undefined) {
        i18next.changeLanguage(language);
        return;
    }
    try {
        collection.findOne({guild_id: {$eq: message.guild.id}}, (err, result) => {
            if(result && result.guild_id === message.guild.id) {
                i18next.changeLanguage(result.language);
            } else {
                i18next.changeLanguage('en');
            }
        })
    } catch(e) {
        console.log(message.guild.name + i18next.t("failsetlanguage") + e);
    }
}

client.once('ready', () => {
    try {
        cron.schedule('00 00 * * *', () =>{
            console.log('sending almanax from cron');
            send_message();
            almanax_sent = true;
        }, {timezone: 'Europe/Paris'})
        cron.schedule('05 23 * * *', () =>{
            console.log('reset timer cron')
            almanax_sent = false;
        }, {timezone: 'Europe/Paris'})
    } catch(e) {
        console.log(i18next.t("failsent") + e)
    }       
});

client.on('message', async(message) => {
    if (!message.content.startsWith(prefix) || message.author.bot ) return;
    let requester = null;
    await message.guild.members.fetch(message.author).then((user) => {
        requester = user;
    });
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    setLanguage(message);
    
    if (command === 'configure') {
        if (args.length < 2) {
            return message.channel.send(i18next.t('notenougharguments') + message.author).catch((error)=>{
                message.author.createDM().then(() => {
                    message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                })
                console.log(message.guild.name + ": Please update the Bot Permissions.");
            });;
        }
        try {
            collection.findOne({guild_id: {$eq: message.guild.id}}, (err, result) => {
                if(result && result.guild_id === message.guild.id) {
                    let canal;
                    message.mentions.channels.forEach(channel => {
                        canal = channel.id
                    })
                    collection.updateOne({guild_id: {$eq: message.guild.id}}, {$set: {channel: canal, language: args[0], guild: message.guild.name}})
                    console.log(message.guild.name + i18next.t('guildupdated'))
                    message.channel.send(i18next.t('updatedguild') + args[1]).catch((error)=>{
                        message.author.createDM().then(() => {
                            message.author.send(result.guild + ": Please update the Bot Permissions.")
                        })
                        console.log(result.guild + ": Please update the Bot Permissions.");
                    });
                } else {
                    let canal;
                    message.mentions.channels.forEach(channel => {
                        canal = channel.id
                    })
                    let insertSQL = {guild_id: message.guild.id, guild: message.guild.name, language: args[0], channel: canal}
                    collection.insertOne(insertSQL)
                    console.log(message.guild.name + i18next.t('guildconfigurated'));
                    message.channel.send(i18next.t('configuratedguild') + args[1]).catch((error)=>{
                        message.author.createDM().then(() => {
                            message.author.send(result.guild + ": Please update the Bot Permissions.")
                        })
                        console.log(result.guild + ": Please update the Bot Permissions.");
                    });
                }
            })
        } catch(e) {
            console.log(message.guild.name + " can't add this server on database. Aborting. \n" + e);
            message.channel.send(i18next.t("configurationerror")).catch((error)=>{
                message.author.createDM().then(() => {
                    message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                })
                console.log(message.guild.name + ": Please update the Bot Permissions.");
            });
        }
    }

    if (command === 'reset') {
        if (args.length > 0) {
            return message.channel.send(i18next.t('noargument')).catch((error)=>{
                message.author.createDM().then(() => {
                    message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                })
                console.log(message.guild.name + ": Please update the Bot Permissions.");
            });
        }
        try {
            collection.findOneAndDelete({guild_id: {$eq: message.guild.id}}, (err, result) => {
                if(result) {
                    console.log(message.guild.name + ' has been removed from the Database')
                    return message.channel.send(i18next.t('guildcleared')).catch((error)=>{
                        message.author.createDM().then(() => {
                            message.author.send(result.guild + ": Please update the Bot Permissions.")
                        })
                        console.log(result.guild + ": Please update the Bot Permissions.");
                    });
                }
            })
        } catch(e) {
            console.log(message.guild.name + " can't remove the server from the database. Aborting. \n" + e);
            return message.channel.send(i18next.t('errorclearguild')).catch((error)=>{
                message.author.createDM().then(() => {
                    message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                })
                console.log(message.guild.name + ": Please update the Bot Permissions.");
            });
        }
    }

    if (command === 'resend') {
        if (args.length > 0) {
            return message.channel.send(i18next.t('noargument')).catch((error)=>{
                message.author.createDM().then(() => {
                    message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                })
                console.log(message.guild.name + ": Please update the Bot Permissions.");
            });
        } if(message.author.id === "109752351643955200") {
            console.log("it SHOULD be normal and intended that this line appear. If not, i'm in real trouble.")
            send_message();
        } else {
            console.log(message.author.username + " from " + message.guild.name + " tries to send Almanax.")
        }
    }
    count = 0

    if (command === 'stats') {
        count = 0
        if (args.length > 0) {
            return message.channel.send(i18next.t('noargument')).catch((error)=>{
                message.author.createDM().then(() => {
                    message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                })
                console.log(message.guild.name + ": Please update the Bot Permissions.");
            });
        } if(message.author.id === "109752351643955200") {
            client.guilds.cache.forEach(guild => {
                count++;
            });
            message.channel.send('Il y a ' + count + ' serveurs qui m\'utilisent... Incroyable').catch((error)=>{
                message.author.createDM().then(() => {
                    message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                })
                console.log(message.guild.name + ": Please update the Bot Permissions.");
            });
        } else {
            console.log(message.author.username + " from " + message.guild.name + " tries to gets my stats.")
            message.channel.send(i18next.t('noauthorized')).catch((error)=>{
                message.author.createDM().then(() => {
                    message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                })
                console.log(message.guild.name + ": Please update the Bot Permissions.");
            });
        }

    }

    if (command === 'retry') {
        if (args.length > 0) {
            return message.channel.send(i18next.t('noargument')).catch((error)=>{
                message.author.createDM().then(() => {
                    message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                })
                console.log(message.guild.name + ": Please update the Bot Permissions.");
            });
        }
        get_frame_total().then((json) => {
            let wakfu_bonus = get_wakfu_bonus();
            let embed;
            json['description_fr'] = json['description_fr'].slice(json['description_fr'].indexOf(" "));
            json['description_en'] = json['description_en'].slice(json['description_en'].indexOf(" "));
            collection.findOne({guild_id: {$eq: message.guild.id}}, (err, cursor) => {
                if(cursor.language) {
                    if(cursor.language.toLowerCase() === 'fr' || cursor.language.toLowerCase() === 'français' || cursor.language.toLowerCase() === 'french') {
                        embed = new Discord.MessageEmbed().setTitle(json['day'] + " " + json['month'] + " 977")
                            .setDescription(json['description_fr'])
                            .addField('\u200b', '\u200b')
                            .addField('BONUS WAKFU', wakfu_bonus[0])
                            .addField('\u200b', '\u200b')
                            .addField('BONUS DOFUS', json['dofus_bonus_fr']['bonus'])
                            .setImage(json['img'])
                    } else {
                        embed = new Discord.MessageEmbed().setTitle(json['day'] + " " + json['month'] + " 977")
                            .setDescription(json['description_en'])
                            .addField('\u200b', '\u200b')
                            .addField('WAKFU\'S BONUS', wakfu_bonus[1])
                            .addField('\u200b', '\u200b')
                            .addField('BONUS DOFUS', json['dofus_bonus_en']['bonus'])
                            .setImage(json['img'])
                    }
                }
                if(client.channels.cache.get(cursor.channel)) {
                    client.channels.cache.get(cursor.channel).send(embed).catch((error)=>{
                        message.author.createDM().then(() => {
                            message.author.send(cursor.guild + ": Please update the Bot Permissions.")
                        })
                        console.log(cursor.guild + ": Please update the Bot Permissions.");
                    });
                }
            })
        })
    }

    if (command === 'help') {
        if (args.length > 0 && args.length < 2) {
            if(args[0] === 'retry') {
                return message.channel.send(i18next.t('retryhelp')).catch((error)=>{
                    message.author.createDM().then(() => {
                        message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                    })
                    console.log(message.guild.name + ": Please update the Bot Permissions.");
                });
            }
            if(args[0] === 'reset') {
                return message.channel.send(i18next.t('resethelp')).catch((error)=>{
                    message.author.createDM().then(() => {
                        message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                    })
                    console.log(message.guild.name + ": Please update the Bot Permissions.");
                });
            }
            if(args[0] === 'configure') {
                return message.channel.send(i18next.t('configurehelp')).catch((error)=>{
                    message.author.createDM().then(() => {
                        message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                    })
                    console.log(message.guild.name + ": Please update the Bot Permissions.");
                });
            }
        }
        else if(args.length === 0) {
            return message.channel.send(i18next.t('help') + "\n" + i18next.t('resethelp') + "\n" + i18next.t('retryhelp') + "\n" + i18next.t('configurehelp')).catch((error)=>{
                message.author.createDM().then(() => {
                    message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                })
                console.log(message.guild.name + ": Please update the Bot Permissions.");
            });
        } else {
            return message.channel.send(i18next.t('toomucharguments') + message.author.username).catch((error)=>{
                message.author.createDM().then(() => {
                    message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                })
                console.log(message.guild.name + ": Please update the Bot Permissions.");
            });
        }
    }

    if (command === 'update') {
        let sendmessage = "";
        if (args.length < 0) {
            return message.channel.send(i18next.t('notenougharguments') + message.author).catch((error)=>{
                message.author.createDM().then(() => {
                    message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                })
                console.log(message.guild.name + ": Please update the Bot Permissions.");
            });
        }
        for (let index = 1; index < args.length; index++) {
            sendmessage += args[index] + " "
        }

        if (args[0] === 'fr') {
            collection.find().forEach(cursor => {
                if(cursor && cursor.language.toLowerCase() === 'fr' || cursor.language.toLowerCase() === 'français' || cursor.language.toLowerCase() === 'french') {
                    if(client.channels.cache.get(cursor.channel)) {
                        client.channels.cache.get(cursor.channel).send(sendmessage).catch((error)=>{
                            message.author.createDM().then(() => {
                                message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                            })
                            console.log(message.guild.name + ": Please update the Bot Permissions.");
                        });
                    }
                }
            });
        } else {
            collection.find().forEach(cursor => {
                if(cursor && cursor.language.toLowerCase() !== 'fr' && cursor.language.toLowerCase() !== 'français' && cursor.language.toLowerCase() !== 'french') {
                    if(client.channels.cache.get(cursor.channel)) {
                        client.channels.cache.get(cursor.channel).send(sendmessage).catch((error)=>{
                            message.author.createDM().then(() => {
                                message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                            })
                            console.log(message.guild.name + ": Please update the Bot Permissions.");
                        });
                    }
                }
            });
        }
    }

    if (command === 'bdd') {
        if (args.length > 0) {
            return message.channel.send(i18next.t('noargument'));
        } if(message.author.id === "109752351643955200") {
            client.guilds.cache.forEach(guild => {
                let id_guild = guild.id;
                let guild_name = guild.name;
                try {
                    collection.updateOne({guild: {$eq: guild_name}}, {$set: {guild_id: id_guild}})
                } catch (e) {
                    console.log("erreur en modifiant " + guild_name)
                }

            });
        } else {
            console.log(message.author.username + " from " + message.guild.name + " tries to use bdd command.")
            return message.channel.send(i18next.t('noauthorized')).catch((error)=>{
                message.author.createDM().then(() => {
                    message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                })
                console.log(message.guild.name + ": Please update the Bot Permissions.");
            });
        }
    }

    if(command === 'set_game') {
        if (args.length > 0) {
            return message.channel.send(i18next.t('noargument'));
        } if(message.author.id === "109752351643955200") {
            client.guilds.cache.forEach(guild => {
                let games = ['wakfu', 'dofus'];
                let guild_name = guild.name;
                try {
                    collection.updateOne({guild: {$eq: guild_name}}, {$set: {games: games}})
                } catch (e) {
                    console.log("erreur en modifiant " + guild_name)
                }

            });
        } else {
            console.log(message.author.username + " from " + message.guild.name + " tries to use bdd command.");
            return message.channel.send(i18next.t('noauthorized')).catch((error)=>{
                message.author.createDM().then(() => {
                    message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                })
                console.log(message.guild.name + ": Please update the Bot Permissions.");
            });
        }
    }

    if(command === 'games'){
        if (args.length === 0) {
            try {
                let games = [];
                let result = await collection.findOne({guild_id: {$eq: message.guild.id}})
                if (result && result.guild_id === message.guild.id) {
                    if (result.games) {
                        return message.channel.send(i18next.t('gamebonus') + ' ' + result.games).catch((error)=>{
                            message.author.createDM().then(() => {
                                message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                            })
                            console.log(message.guild.name + ": Please update the Bot Permissions.");
                        });

                    } else {
                        console.log(result);
                        return message.channel.send(i18next.t("nogames")).catch((error)=>{
                            message.author.createDM().then(() => {
                                message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                            })
                            console.log(message.guild.name + ": Please update the Bot Permissions.");
                        });
                    }
                } else {
                    return message.channel.send(i18next.t("nogames")).catch((error)=>{
                        message.author.createDM().then(() => {
                            message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                        })
                        console.log(message.guild.name + ": Please update the Bot Permissions.");
                    });
                }
            } catch (e) {
                console.log("une erreur s'est produite lors de la récupération des jeux pour le serveur " + message.guild.name);
            }
        } else if (args.length === 1 || args.length === 2) {
            await set_games(message, collection, args);
        } else {
            return message.channel.send(i18next.t('toomucharguments')).catch((error)=>{
                message.author.createDM().then(() => {
                    message.author.send(message.guild.name + ": Please update the Bot Permissions.")
                })
                console.log(message.guild.name + ": Please update the Bot Permissions.");
            });
        }
    }
});

client.login(process.env['token']);
