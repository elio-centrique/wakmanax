const Discord = require('discord.js');
const cron = require('node-cron');
const http = require('http')

const client = new Discord.Client();
const MongoClient = require('mongodb').MongoClient;
const prefix = "a!"

let collection = null;
const uri = "mongodb+srv://" + process.env['db_user'] + ":" + process.env['db_pass'] + "@" + process.env['db_name'] + "-l6ey6.gcp.mongodb.net/test?retryWrites=true&w=majority";
const mongo_client = new MongoClient(uri, { useNewUrlParser: true });
mongo_client.connect(err => {
    if(err) throw err;
    collection = mongo_client.db("wakmanax").collection("guilds");
});

client.on('ready', () => {
    cron.schedule('0 22 * * *', () =>{
        let data;
        http.get('http://almanax.kasswat.com', (resp) => {
            resp.on('data', (chunk) => {
                data = JSON.parse(chunk);
            })
        })
        collection.find().forEach(cursor => {
            let embed;
            if(cursor.language == 'fr' || cursor.language == 'français' || cursor.language == 'french') {
                embed = new RichEmbed().setTitle(data['day'] + " " + data['month'] + " " + data['year']).setDescription(data['description'][0]).addField('bonus', data['bonus'][0])
            } else {
                embed = new RichEmbed().setTitle(data['day'] + " " + data['month'] + " " + data['year']).setDescription(data['description'][1]).addField('bonus', data['bonus'][1])
            }
            client.channels.get(cursor.channel).send(embed)
        });
        console.log('send almanax')
    }, {timezone: 'Europe/Paris'})
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    
    if (command === 'configure') {
        if (args.length < 2) {
            return message.channel.send(`You didn't provide enough arguments, ${message.author}!`);
        }
        collection.findOne({guild: {$eq: message.guild.name}}, (err, result) => {
            if(result && result.guild == message.guild.name) {
                collection.updateOne({guild: {$eq: message.guild.name}}, {$set: {channel: args[1], language: args[0]}})
                console.log('A guild has been updated')
                message.channel.send('Your channel has been modified for ' + args[1])
            } else {
                let insertSQL = {guild: message.guild.name, language: args[0], channel: args[1]}
                collection.insertOne(insertSQL)
                console.log("A guild has been inserted on DB.");
                message.channel.send('Your guild has been configured for ' + args[1])
            }
        })
    }
});

client.login(process.env['token']);