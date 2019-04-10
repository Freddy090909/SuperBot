import * as Discord from "discord.js";
import * as config from "./../config.json";
import * as sql from "mysql";

const client = new Discord.Client();
const sqlCon = sql.createConnection({
    host: "localhost",
    user: "root",
    password: "fredrick",
    database: "superbot"
});

client.on("message", async msg  => {
    if(msg.author.bot) return;
    if(msg.content.indexOf(config.prefix) !== 0) return;

    const cleanedMessage = msg.content.slice(config.prefix.length).trim();
    const firstSpace = cleanedMessage.indexOf(' ');
    const command = cleanedMessage.substring(0, firstSpace);
    const args = cleanedMessage.substring(firstSpace).trim();

    if(command == "test"){
        msg.channel.send("yay");
        let user = msg.mentions.users.first();
        msg.channel.send(`${user.username}'s Discord ID is: ${user.id}`);
    }

    if(command == "createList"){
        let listName = args;
        sqlCon.query("INSERT INTO list (listName) VALUES (?)", [listName], 
            (error, results, fields) => {
                if(error) throw error;
                msg.channel.send(`Created ${listName}.`);
            });
    }
})

client.login(config.token);
console.log("SuperBot is running.");