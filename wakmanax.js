const dotenv = require("dotenv")
dotenv.config();
const { MessageEmbed, Client, Intents, Collection, Interaction, Permissions, MessageActionRow, MessageSelectMenu} = require('discord.js');
const i18next = require('i18next');
const cron = require('node-cron');
const moment = require('moment-timezone');
const fs = require("fs");
const client = new Client({intents: [Intents.FLAGS.GUILDS] });
const {MongoClient, ServerApiVersion} = require('mongodb');
const {locale} = require("moment/moment");

let collection = null;
const uri = "mongodb+srv://" + process.env['db_user'] + ":" +  process.env['db_pass'] + "@" +  process.env['db_name'] + "-l6ey6.gcp.mongodb.net/" + process.env['db_name'] + "?retryWrites=true&w=majority";
const mongo_client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
let almanax_sent = false;
/*let cheerio = require ('cheerio');
const axios = require('axios').default;
*/

eval(fs.readFileSync('./src/functions.js') + '');


client.once('ready', async() => {
    try {
        cron.schedule('00 00 * * *', () =>{
            console.log('sending almanax from cron');
            send_message(client, collection);
            almanax_sent = true;
        }, {timezone: 'Europe/Paris'})
        cron.schedule('05 00 * * *', () =>{
            console.log('reset timer cron')
            almanax_sent = false;
        }, {timezone: 'Europe/Paris'})
    } catch(e) {
        console.error(i18next.t("failsent") + e)
    }
    /*
    await client.application.commands.create({
        name: 'resend',
        description: "Resend the almanax to every server",
        default_permission: false,

    });
    */
    console.log('bien lancé');

});

client.on('interactionCreate', async(interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    await interaction.deferReply();
    await setLanguage(interaction)

    if (commandName === 'config') {
        if (interaction.options._hoistedOptions.length === 0) {
            return interaction.editReply(i18next.t('notenougharguments')).catch((error)=>{
                sendError(interaction)
            });
        }
        let channel = interaction.options.getChannel('channel')
        let language = interaction.options.getString('language')
        if(channel === null) {
            collection.findOne({guild_id: {$eq: interaction.guild.id}}, async (err, cursor) => {
                if(cursor && cursor.channel) {
                    channel = await client.channels.fetch(cursor.channel);
                } else {
                    channel = "";
                }
            });
        }
        if(language === null) {
            collection.findOne({guild_id: {$eq: interaction.guild.id}}, (err, cursor) => {
                if(cursor && cursor.language) {
                    language = cursor.language.toLowerCase();
                    i18next.language
                } else {
                    language = "en";
                }
            });
        }
		if(channel === "" || channel === null) {
			return i18next.t('pleasesetchannel');
		}
        await i18next.changeLanguage(language);
        try {
            collection.findOne({guild_id: {$eq: interaction.guild.id}}, (err, result) => {
                if(result && result.guild_id === interaction.guild.id) {
                    collection.updateOne({guild_id: {$eq: interaction.guild.id}}, {$set: {channel: channel.id, language: language, guild: interaction.guild.name}})
                    console.log(interaction.guild.name + i18next.t('guildupdated'))
                    if(language && channel){
                        interaction.editReply(i18next.t('updatedall') + channel.name + i18next.t('and') + language).catch((error)=>{
                            sendError(interaction)
                        });
                    } else if(channel) {
                        interaction.editReply(i18next.t('updatedguild') + channel.name).catch((error)=>{
                            sendError(interaction)
                        });
                    } else {
                        interaction.editReply(i18next.t('updatedlanguage') + language).catch((error)=>{
                            sendError(interaction)
                        });
                    }
                } else {
                    let insertSQL = {guild_id: interaction.guild.id, guild: interaction.guild.name, language: language, channel: channel.id}
                    collection.insertOne(insertSQL)
                    console.log(interaction.guild.name + i18next.t('guildconfigurated'));
                    interaction.editReply(i18next.t('configuratedguild') + channel.name).catch((error)=>{
                        sendError(interaction)
                    });
                }
            });
        } catch(e) {
            console.log(interaction.guild.name + " can't add this server on database. Aborting. \n" + e);
            interaction.editReply(i18next.t("configurationerror")).catch((error)=>{
                sendError(interaction)
            });
        }
    }

    if (commandName === 'reset') {
        checkCommandUsage(interaction);
        try {
            collection.findOneAndDelete({guild_id: {$eq: interaction.guild.id}}, (err, result) => {
                if(result) {
                    console.log(interaction.guild.name + ' has been removed from the Database')
                    return interaction.editReply(i18next.t('guildcleared')).catch((error)=>{
                        sendError(interaction)
                    });
                }
            })
        } catch(e) {
            console.log(interaction.guild.name + " can't remove the server from the database. Aborting. \n" + e);
            return interaction.editReply(i18next.t('errorclearguild')).catch((error)=>{
                sendError(interaction);
            });
        }
    }

    if (commandName === 'resend') {
        checkArgs(interaction);
        checkPrivilege(interaction);
        if(interaction.user.id === "109752351643955200") {
            console.log("it SHOULD be normal and intended that this line appear. If not, i'm in real trouble.")
            send_message(client, collection, interaction);
        } else {
            console.log(interaction.user.username + " from " + interaction.guild.name + " tries to send Almanax.")
        }
    }
    
    if (commandName === 'stats') {
        checkCommandUsage(interaction);
        if(interaction.user.id === "109752351643955200") {
            let count = 0;
            client.guilds.cache.forEach(guild => {
                count++;
            });
            interaction.editReply('Il y a ' + count + ' serveurs qui m\'utilisent... Incroyable').catch((error)=>{
                sendError(interaction);
            });
        }
    }

    if (commandName === 'send') {
        checkArgs(interaction);
        await get_frame_total().then((json) => {
            let wakfu_bonus = get_wakfu_bonus();
            let embed;
            collection.findOne({guild_id: {$eq: interaction.guild.id}}, (err, cursor) => {
                if(cursor && cursor.language) {
                    if(cursor.language.toLowerCase() === 'fr' || cursor.language.toLowerCase() === 'français' || cursor.language.toLowerCase() === 'french') {
                        embed = new MessageEmbed().setTitle(json.day + " " + json.month + " 977")
                            .setDescription('**BONUS WAKFU** \n *' + wakfu_bonus[0] + '*')

                        if(cursor.type && cursor.type === 'long') {
                            if(moment().tz('Europe/Paris').date() === 1) {
                                embed.addField('\u200b', '\u200b')
                                    .addField(i18next.t('monthprotector'), json.protector.description_fr)
                            }
                            embed.addField('\u200b', '\u200b')
                                .addField(i18next.t('meridia'), json.description_fr)
                                .addField('\u200b', '\u200b')
                                .addField(i18next.t('zodiac'), json.zodiac.description_fr)
                                .addField('\u200b', '\u200b')
                                .addField(i18next.t('ephemeris'), json.ephemeris_fr)
                                .addField('\u200b', '\u200b')
                                .addField(i18next.t('rubricabrax'), json.rubrikabrax_fr);
                        }
                        if(cursor.type && (cursor.type === 'long' || cursor.type === 'short')){
                            embed.setImage(json.img)
                        }
                    } else {
                        embed = new MessageEmbed().setTitle(json['day'] + " " + json['month'] + " 977")
                            .setDescription('**WAKFU BONUS** \n *' + wakfu_bonus[1] + '*')
                        if (cursor.type && cursor.type === 'long') {
                            if (moment().tz('Europe/Paris').date() === 1) {
                                embed.addField('\u200b', '\u200b')
                                    .addField(i18next.t('monthprotector'), json.protector.description_en)
                            }
                            embed.addField('\u200b', '\u200b')
                                .addField(i18next.t('meridia'), json.description_en)
                                .addField('\u200b', '\u200b')
                                .addField(i18next.t('zodiac'), json.zodiac.description_en)
                                .addField('\u200b', '\u200b')
                                .addField(i18next.t('ephemeris'), json.ephemeris_en)
                                .addField('\u200b', '\u200b')
                                .addField(i18next.t('rubricabrax'), json.rubrikabrax_en)
                        }
                        if (cursor.type && (cursor.type === 'long' || cursor.type === 'short')) {
                            embed.setImage(json.img)
                        }
                    }
                }
                if (client.channels.cache.get(cursor.channel)) {
                    client.channels.cache.get(cursor.channel).send({embeds: [embed]}).catch((error)=>{
                        sendError(interaction)
                    });
                    interaction.editReply(i18next.t('almanaxsend')+ client.channels.cache.get(cursor.channel) + '>');
                }
            })
        })
    }

    if(commandName === 'type'){
        const row = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('typeAlma')
                    .setPlaceholder(i18next.t('selecttype'))
                    .addOptions([
                        {
                            label: 'Long',
                            description: i18next.t('typedesclong'),
                            value: 'long'
                        },
                        {
                            label: i18next.t('short'),
                            description: i18next.t('typedescshort'),
                            value: 'short'
                        },
                        {
                            label: i18next.t('shorter'),
                            description: i18next.t('typedescshorter'),
                            value: 'shorter'
                        },
                    ]),
            )
        interaction.editReply({components: [row]});
    }

    if (commandName === 'update') {
        checkPrivilege(interaction);
        if (interaction.options._hoistedOptions.length < 2) {
            return interaction.editReply(i18next.t('notenougharguments')).catch((error)=>{
                sendError(interaction);
            });
        }
        let language = interaction.options.getString('language')
        let message = interaction.options.getString('message')

        if (language === 'fr') {
            collection.find().forEach(cursor => {
                if(cursor && cursor.language.toLowerCase() === 'fr' || cursor.language.toLowerCase() === 'français' || cursor.language.toLowerCase() === 'french') {
                    if(client.channels.cache.get(cursor.channel)) {
                        client.channels.cache.get(cursor.channel).send(message).catch((error)=>{
                        });
                    }
                }
            });
        } else {
            collection.find().forEach(cursor => {
                if(cursor && cursor.language.toLowerCase() !== 'fr' && cursor.language.toLowerCase() !== 'français' && cursor.language.toLowerCase() !== 'french') {
                    if(client.channels.cache.get(cursor.channel)) {
                        client.channels.cache.get(cursor.channel).send(message).catch((error)=>{
                        });
                    }
                }
            });
        }
    }

    if (commandName === 'bdd') {
        checkArgs(interaction);
        checkPrivilege(interaction);
        client.guilds.cache.forEach(guild => {
            let id_guild = guild.id;
            let guild_name = guild.name;
            try {
                collection.updateOne({guild: {$eq: guild_name}}, {$set: {guild_id: id_guild, type: "long"}})
            } catch (e) {
                console.log("erreur en modifiant " + guild_name)
            }
        });
        interaction.editReply('Modifications faites avec succès');
    }
    /*
    if (commandName === 'help') {
        let embed = new MessageEmbed()
            .setTitle('Help menu:');
        (await client.guilds.cache.get(process.env.guildId)?.commands.fetch()).forEach(command => {
            /* if(command.perm)
            embed.addField(command.name, )
        })
    } */
});

client.on('interactionCreate', async(interaction) => {
    if (!interaction.isSelectMenu()) return;
    if(interaction.customId === 'typeAlma'){
        try {
            collection.findOne({guild_id: {$eq: interaction.guild.id}}, (err, result) => {
                if(result && result.guild_id === interaction.guild.id) {
                    collection.updateOne({guild_id: {$eq: interaction.guild.id}}, {$set: {type: interaction.values[0]}})
                    console.log(interaction.guild.name + i18next.t('guildupdated'))
                    interaction.update({content: i18next.t('displayed') + i18next.t(interaction.values[0]), components: []}).catch((error)=>{
                        sendError(interaction);
                    });
                } else {
                    interaction.update(i18next.t('pleaseconfigure'))
                }
            });
        } catch(e) {
            console.log(interaction.guild.name + " can't modify this server on database. Aborting. \n" + e);
            interaction.editReply(i18next.t("configurationerror")).catch((error)=>{
                sendError(interaction);
            });
        }
    }
});

//TODO changer les commandes en commandes globales

client.login(process.env['token']);
