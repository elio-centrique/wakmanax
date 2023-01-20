const {Permissions, MessageEmbed} = require("discord.js");
const i18next = require("i18next");
const moment = require('moment-timezone');
const fetch = require('node-fetch-npm');
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
                "and": ' and ',
                "updatepermissions": ": Please update the Bot Permissions.",
                "senteveryone": 'I just send almanax for every channels.',
                "failsent": " can't schedule the almanax messages, aborting. \n",
                "failsetlanguage": " can't get language from database.\n",
                "notenougharguments": 'You didn\'t provide enough arguments, ',
                "toomucharguments": 'You provide too much arguments, ',
                "guildupdated": ' has been updated.',
                "updatedguild": 'Your channel has been modified for ',
                "updatedlanguage": 'Your language has been modified for ',
                "updatedall": 'Your channel and language has been modified for ',
                "guildconfigurated": " has been inserted on DB.",
                "configuratedguild": 'Your guild has been configured for ',
                "configurationerror": ' An error occured, your server was not added to the database. Please retry.',
                "noargument": 'This command don\'t need arguments!',
                'guildcleared': 'Your Almanax channel has been cleared, I will no more post on your server.',
                'errorclear_guild': 'Your guild couldn\'t be deleted from the database. Please retry.',
                'retryhelp': 'a!retry: tries to fire the almanax to your registered channel.',
                'resethelp': 'a!reset: Reset the current configuration of your server. Usefull if you want to remove the bot.',
                'configurehelp': 'configure the bot for your server. You can use this command to change the output channel or the language.',
                'help': 'Here\'s the list of the commands:',
                'noauthorized': 'You\'re not allowed to use this command',
                'almanaxsend': 'Almanax has been send to <#',
                'selecttype': 'Select a length for the Almanax',
                'typedesclong': 'Display every information about the almanax (Meridia, Doziac, etc...)',
                'typedescshort': 'Display only the bonus and the picture of the Meridia',
                'short': 'short',
                'shorter': 'shorter',
                'typedescshorter': 'Display only the bonus of the day',
                'displayed': 'Your almanax will now be displayed ',
                'pleaseconfigure': 'Your server has not been configured. Please use /config before using this command.',
				'pleasesetchannel': 'No channel has been configurated. Please retry with a #channel to continue',

                'monthprotector': 'Month protector: ',
                'meridia': 'Meridia',
                'zodiac': 'Doziac sign',
                'ephemeris': 'Ephemeris',
                'rubricabrax': 'Rubricabrax',
            }
        },
        fr: {
            translation: {
                "and": " et ",
                "updatepermissions": ": Please update the Bot Permissions.",
                "senteveryone": 'I just send almanax for every channels.',
                "failsent": "can't schedule the almanax messages, aborting. \n",
                "failsetlanguage": " can't get language from database.\n",
                "notenougharguments": 'Vous n\'avez pas mis assez d\'arguments, ',
                "toomucharguments": 'Vous avez mis trop d\'arguments, ',
                "guildupdated": ' has been updated.',
                "updatedguild": 'Votre canal a bien été modifié pour celui-ci: ',
                "updatedlanguage": 'Votre langue a bien été modifié pour celle-ci: ',
                "updatedall": 'Votre canal et langue ont bien été modifiés pour ceux-ci ',
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
                'noauthorized': 'Vous n\'êtes pas autorisé à utiliser la commande.',
                'almanaxsend': 'L\'almanax a bien été envoyé sur le canal <#',
                'selecttype': 'Selectionnez la langueur de l\'Almanax',
                'typedesclong': 'Affiche toutes les informations à props de l\'Almanax(Méryde, Doziac, etc...)',
                'typedescshort': 'Affiche uniquement le bonus et l\'image du Méryde',
                'short': 'Court',
                'shorter': 'très court',
                'typedescshorter': 'Affiche uniquement le bonus du jour',
                'displayed': 'Votre Almanax sera affiché: ',
                'pleaseconfigure': 'Votre serveur n\'a pas été configuré. Utilisez /config Avant de réutiliser cette commande.',
				'pleasesetchannel': 'Aucun canal n\'a été configuré. Merci de réessayer en ajoutant un #canal pour continuer',

                'monthprotector': 'Protecteur du mois: ',
                'meridia': 'Méryde',
                'zodiac': 'Signe du Doziac',
                'ephemeris': 'Ephéméride',
                'rubricabrax': 'Rubricabrak',
            }
        }
    }
})

async function get_frame_fr(){
    const today = moment().tz('Europe/Paris');
    let json_frame;
    const response = await fetch('https://haapi.ankama.com/json/Ankama/v2/Almanax/GetEvent?lang=fr&date=' + today.format('YYYY-MM-DD'));
	await response.json().then(body => {
        json_frame = {
            day: today.date(),
            month: body.month.name,
            name: body.event['boss_name'],
            description_fr: body.event['boss_text'],
            ephemeris_fr: body.event.ephemeris,
            rubrikabrax_fr: body.event.rubrikabrax,
            zodiac: {
                name: body.zodiac.name,
                description_fr: body.zodiac.description,
                img: body.zodiac['image_url']
            },
            img: body.event['boss_image_url'],
            protector: {
                name: body.month['protector_name'],
                description_fr: body.month['protector_description'],
                img: body.month['protector_image_url']
            }
        }
    })
    return json_frame;
}

async function get_frame_en() {
    const today = moment().tz('Europe/Paris');
    let json_frame;
    const response = await fetch('https://haapi.ankama.com/json/Ankama/v2/Almanax/GetEvent?lang=en&date=' + today.format('YYYY-MM-DD'));
    await response.json().then(body => {
        json_frame = {
            day: today.date(),
            month: body.month.name,
            name: body.event['boss_name'],
            description_en: body.event['boss_text'],
            ephemeris_en: body.event.ephemeris,
            rubrikabrax_en: body.event.rubrikabrax,
            zodiac: {
                name: body.zodiac.name,
                description_en: body.zodiac.description,
                img: body.zodiac['image_url']
            },
            img: body.event['boss_image_url'],
            protector: {
                name: body.month['protector_name'],
                description_en: body.month['protector_description'],
                img: body.month['protector_image_url']
            }
        }
    })
    return json_frame;
}

async function get_frame_total() {
    let json_total = await get_frame_fr();
    let tmp_json = await get_frame_en();
    json_total.description_en = tmp_json.description_en;
    json_total.zodiac.description_en = tmp_json.zodiac.description_en;
    json_total.protector.description_en = tmp_json.protector.description_en;
    json_total.ephemeris_en = tmp_json.ephemeris_en;
    json_total.rubrikabrax_en = tmp_json.rubrikabrax_en;
    return json_total;
}

function get_wakfu_bonus(){
    let bonus = [];
    const today = moment().tz('Europe/Paris');
    const compare = moment("20191121").tz('Europe/Paris').hour(0);
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



async function send_message(client, collection, interaction = undefined) {
    get_frame_total().then((json) => {
        let wakfu_bonus = get_wakfu_bonus();
        let embed;
        client.guilds.cache.forEach(guild => {
            collection.findOne({guild_id: {$eq: guild.id}}, async (err, cursor) => {
                if (cursor && cursor.language) {
                    if(cursor.language.toLowerCase() === 'fr' || cursor.language.toLowerCase() === 'français' || cursor.language.toLowerCase() === 'french') {
						setLanguage(interaction, cursor.language);
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
						setLanguage(interaction, "en");
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
							if(json.rubrikabrax_en) {
                                embed.addField('\u200b', '\u200b')
									 .addField(i18next.t('rubricabrax'), json.rubrikabrax_en)
							}
                        }
                        if (cursor.type && (cursor.type === 'long' || cursor.type === 'short')) {
                            embed.setImage(json.img)
                        }
                    }
                    if (client.channels) {
                        let channel = client.channels.cache.get(cursor.channel);
						if (channel && typeof(channel.send) === 'function') {
							channel.send({embeds: [embed]}).catch((error)=>{
								if(interaction) {
									sendError(interaction, cursor);
								}
								//console.log(error)
							})
						}
					}
                }
            })
        });
		if(interaction){
			interaction.editReply(i18next.t('senteveryone'));
		}
        console.log(i18next.t("senteveryone"))
    })
}

async function setLanguage(interaction, language = undefined) {
    if (language !== undefined) {
        await i18next.changeLanguage(language);
        return;
    }
    try {
        collection.findOne({guild_id: {$eq: interaction.guild.id}}, async (err, result) => {
            if(result && result.guild_id === interaction.guild.id) {
                await i18next.changeLanguage(result.language);
            } else {
                await i18next.changeLanguage('en');
            }
        })
    } catch(e) {
        console.log(interaction.guild.name + i18next.t("failsetlanguage") + e);
    }
}

function checkArgs(interaction) {
    if (interaction.options._hoistedOptions.length > 0) {
        return interaction.editReply(i18next.t('noargument')).catch((error)=>{
            sendError(interaction);
        });
    }
}

function checkCommandUsage(interaction) {
    //checkPermission(interaction);
    checkArgs(interaction);
}

function sendError(interaction, cursor = null) {
    interaction.user.createDM().then(() => {
		if(cursor){
			interaction.user.send(cursor.guild + i18next.t('updatepermissions'))
			console.log(cursor.guild + i18next.t('updatepermissions'));
		} else {
			interaction.user.send(interaction.guild.name + i18next.t('updatepermissions'))
			console.log(interaction.guild.name + i18next.t('updatepermissions'));
		}
    })
    console.log(interaction.guild.name + i18next.t('updatepermissions'));
}

function checkPrivilege(interaction){
    if(interaction.user.id !== '109752351643955200'){
        return interaction.editReply(i18next.t('noauthorized'));
    }
}
