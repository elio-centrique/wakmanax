const i18next = require('i18next');

const dotenv = require("dotenv")
dotenv.config();

const { Client, Intents } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commands = [
    new SlashCommandBuilder()
        .setName('config')
        .setNameLocalization('fr', 'config')
        .setDescription('configure command')
        .setDescriptionLocalization('fr', 'Commande de configuration')
        .addStringOption(option =>
            option
                .setName('language')
                .setNameLocalization('fr', 'langue')
                .setDescription('The language wanted for the bot.')
                .setDescriptionLocalization('fr', 'La langue que le bot utilisera')
                .setRequired(false))
        .addChannelOption(option =>
            option
                .setName('channel')
                .setNameLocalization('fr', 'canal')
                .setDescription('the channel to send the almanax')
                .setDescriptionLocalization('fr', 'La canal qui recevra l\'amanax')
                .setRequired(false)),

    new SlashCommandBuilder()
        .setName('reset')
        .setNameLocalization('fr', 'reset')
        .setDescriptionLocalization('fr', 'Supprime la configuration du bot de la base de données')
        .setDescription('Delete the configuration of the bot from the database.'),

    new SlashCommandBuilder()
        .setName('send')
        .setNameLocalization('fr','envoyer')
        .setDescriptionLocalization('fr', 'Envoie l\'almanax dans le canal configuré')
        .setDescription('send the almanax to the configured channel'),

    new SlashCommandBuilder()
        .setName('type')
        .setNameLocalization('fr','type')
        .setDescriptionLocalization('fr', 'Changer la taille du message de l\'almanax')
        .setDescription('Change how the bot displays the Almanax')
    
].map(command => command.toJSON());

const private_commands = [
    new SlashCommandBuilder()
        .setName('resend')
        .setNameLocalization('fr','renvoyer')
        .setDescriptionLocalization('fr', 'Envoie l\'almanax à tous les serveurs')
        .setDescription('resend the almanax for every guilds')
        .setDefaultPermission(false),

    new SlashCommandBuilder()
        .setName('bdd')
        .setDescription('purify the Database')
        .setDescriptionLocalization('fr', 'purifie la base de données')
        .setDefaultPermission(false),

    new SlashCommandBuilder()
        .setName('update')
        .setNameLocalization('fr', 'maj')
        .setDescriptionLocalization('fr', 'Envoie un message à tous les serveurs de la langue choisie')
        .setDescription('send a message to all servers')
        .addStringOption(option =>
            option
                .setName('language')
                .setNameLocalization('fr', 'langue')
                .setDescriptionLocalization('fr', 'La langue choisie')
                .setDescription('The language of the message')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('message')
                .setNameLocalization('fr', 'message')
                .setDescriptionLocalization('fr', 'le message à envoyer')
                .setDescription('The message to send')
                .setRequired(true))
        .setDefaultPermission(false),
    
    new SlashCommandBuilder()
        .setName('stats')
        .setDescription('check the bot stats')
        .setDescriptionLocalization('fr', 'donne les statistiques du bot')
        .setDefaultPermission(false)
].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.token);

rest.get(Routes.applicationGuildCommands(process.env.clientId, process.env.guildId)).then(data => {
    const promises = [];
    for (const command of data) {
        const deleteUrl = `${Routes.applicationGuildCommands(process.env.clientId, process.env.guildId)}/${command.id}`;
        promises.push(rest.delete(deleteUrl));
    }
    rest.put(Routes.applicationGuildCommands(process.env.clientId, process.env.guildId), { body: private_commands })
        .then(() => console.log('Successfully registered privates commands.'))
        .catch(console.error);
    return Promise.all(promises);
})

rest.get(Routes.applicationCommands(process.env.clientId)).then(data => {
    const promises = [];
    for (const command of data) {
        const deleteUrl = `${Routes.applicationCommands(process.env.clientId)}/${command.id}`;
        promises.push(rest.delete(deleteUrl));
    }
    rest.put(Routes.applicationCommands(process.env.clientId), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error);
    return Promise.all(promises);
});



rest.put(Routes.applicationCommands(process.env.clientId), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);


rest.put(Routes.applicationGuildCommands(process.env.clientId, process.env.guildId), { body: private_commands })
    .then(() => console.log('Successfully registered guild commands.'))
    .catch(console.error);
