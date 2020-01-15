require 'discordrb'
require 'json'
require 'date'
require 'open-uri'

is_send = false

bot = Discordrb::Commands::CommandBot.new token: ENV['token'], prefix: "a!", advanced_functionality: true, compress_mode: :large

bot.ready do |event|
    while(true)
        if(DateTime.now().hour() == 12 && DateTime.now.minute() == 26)
            if !is_send
                event.bot.servers.each() { |server|
                    server[1].channels.each() { |channel|
                        if channel.name == "almanax"
                            json = JSON.load(open("http://almanax.kasswat.com/"))
                            channel.send_embed do |embed|
                                embed.title = json['name']
                                embed.description = json['description'][0]
                                embed.image = Discordrb::Webhooks::EmbedImage.new(url: 'https://vertylo.github.io/wakassets/merydes/' + json['img'] + '.png')
                                embed.add_field(name: json['day'] + " " + json['month'] + " " + json['year'], value: json['bonus'][0])
                            end
                            is_send = true
                        end
                    }
                }
            end
        else
            is_send = false
        end
    end
end

bot.run