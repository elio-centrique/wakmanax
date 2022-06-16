# Wakmanax

Wakmanax is a Discord bot created with the Almanax API data provided by a fan.

Wakmanax was developed to give the lore, the meryde and the daily bonus of the Wakfu almanax.

## How to use it

First of all, you need to be an administrator of a server to invite the bot. If you are, congratulation, you can click on this link to invite the bot:

[https://discord.com/api/oauth2/authorize?client_id=665325374388830210&permissions=68608&scope=applications.commands%20bot](https://discord.com/api/oauth2/authorize?client_id=665325374388830210&permissions=68608&scope=applications.commands%20bot)

This bot need read, write and add links permissions.

## And then?

That's all, the bot is ready to use, yeah !

## Commands

There are several commands for Wakmanax, but only one is usually useful.

All arguments between [] are optionals.

The commands for Wakmanax: (prefix "/")

    /config  language #channel
    Configure the channel where the bot will post
    This command can be used to reconfigure the bot

    /send
    Fire the almanax on the configurated channel.
    Usefull if you need to test your configuration

    /reset
    Resets the bot (it will no longer post a message until the a!configure command has been used again)
    There is no need to use a!reset to reconfigure a channel, you can use a!configure to change the message destination channel and the language.

More commands will come in the next updates.

## Support

If you need help with the bot (connection issues, usage, suggestions, etc...), you can join the discord server:

https://discord.gg/w5kbMsT

## Contribution

### Installation

You can contribute to this project by cloning it.

First of all, you need to install a NodeJS environment.

Then, go to the repository folder, open a CMD and type "npm install" (keep it open after the installation).

After that, go to https://discordapp.com/developers/applications and create a new application.

Go to "Bot", configure it and copy the token.

search in the code the "client.token()" line and replace its content.

You'll also need a Mongo database. You can create a free database on Mongo Atlas and then add your own credentials.

Finnaly, run the "node Wakmanax.js" command to run the bot.

That's it, the bot is ready to use.

Don't forget to invite your bot on your server by creating a invitation link:

https://discordapi.com/permissions.html (type your Client ID available in your Discord application. 

(The bot need read, write and send links permissions.)

### Github

The main github repository obey to several rules:

- master & develop branches is now a archive branch for V1.
- v2 branch is a read-only branch for devs. Only me can pull request and push on it.
- develop-v2 branch is only a merge branch. Please create a new branch from develop and create a pull request when you need to merge your work.
- you can fork and use the repository as a template. You're free to do wathever you want on it, but you need to display that's it's a fork from this repo.

Please respect these rules.

Wakmanax is owned by Elio-Centrique. All right reserved © 2020
