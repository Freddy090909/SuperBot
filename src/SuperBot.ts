import { SuperBotRepository } from "./SuperBotRepository";
import { MysqlError } from "mysql";
import * as config from "./../config.json";
import * as Discord from "discord.js";
import { InsertListMembersResult, CreatePlayersResult, Draft } from "../types/SuperBotRepository.models";
import { DraftRunner } from "./DraftRunner";

const client = new Discord.Client();
const repo = new SuperBotRepository();
const draftRunner = new DraftRunner(client, repo);

var _currentDraft: Draft;

client.on("message", async msg  => {
    if(msg.author.bot) return;
    if(msg.content.indexOf(config.prefix) !== 0) return;

    const cleanedMessage = msg.content.slice(config.prefix.length).trim();
    const firstSpace = cleanedMessage.indexOf(" ");
    const command = cleanedMessage.substring(0, firstSpace);
    const args = cleanedMessage.substring(firstSpace).trim();

    if(command == "help"){
        msg.channel.send(`Commands:
        createPlayers {ping Players} : Adds all players to the database for drafting.
        createDraft {name} : Creates a Draft with a given name.
        createList {name} : Creates a List with a given name.
        addToList {listName} {members (comma-separated)} : Adds all members to a given list.
        addPlayerToDraft {draftName} {ping Player} : Adds a player to a draft.
        startDraft {draftName} : Starts a draft. Only one draft can be active at a time.`);
    }

    if(command == "createPlayers") {       
        let users = msg.mentions.users.array();
        repo.createPlayers(users)
            .then((res: CreatePlayersResult) => {
                if(users.length === 1){
                    if(res.successfulRows === 1){
                        msg.channel.send(`${users[0].username} added.`)
                    }
                    else{
                        msg.channel.send(`${users[0].username} already exists, skipping.`);
                    }
                }
                else{
                    msg.channel.send(`${res.successfulRows} members added. ${res.failedRows} members skipped (already exist).`)
                }
            });
    }

    if(command == "createDraft"){
        let draftName = args;
        repo.createDraft(draftName)
            .then(() => { 
                msg.channel.send(`Created draft: ${draftName}.`) 
            })
            .catch((error: MysqlError) => {
                if(error.code === "ER_DUP_ENTRY"){
                    msg.channel.send(`${draftName} already exists.`);
                } else {
                    msg.channel.send(`${error.message}`);
                }
            });
    }

    if(command == "createList"){
        let listName = args;
        repo.createList(listName)
            .then(() => { 
                msg.channel.send(`Created list: ${listName}.`) 
            })
            .catch((error: MysqlError) => {
                if(error.code === "ER_DUP_ENTRY"){
                    msg.channel.send(`${listName} already exists.`);
                } else {
                    msg.channel.send(`${error.message}`);
                }
            });
    }

    if(command == "addToList"){
        let argsSpace = args.indexOf(" ");
        let listName = args.substring(0, argsSpace);
        let membersToAdd = args.substring(argsSpace).split(",").map(x => x.trim()); 
        repo.insertListMembers(listName, membersToAdd)
            .then((res: InsertListMembersResult) => {
                if(res.listNotFound){
                    msg.channel.send(`List ${listName} not found.`);
                } else {
                    if(membersToAdd.length === 1){
                        if(res.successfulRows === 1){
                            msg.channel.send(`${membersToAdd[0]} added.`)
                        }
                        else{
                            msg.channel.send(`${membersToAdd[0]} already exists, skipping.`);
                        }
                    }
                    else{
                        msg.channel.send(`${res.successfulRows} members added. ${res.failedRows} members skipped (already exist).`)
                    }
                }
            })
            .catch((error: MysqlError) => {                
                msg.channel.send(`${error.message}`);
            });
    }

    if(command == "startDraft"){
        if(draftRunner.isRunning()){
            msg.channel.send(`A draft is already in progress.`);
        }
        let draftName = args;
        repo.getDraft(draftName)
            .then(() => {
                repo.getDraft(draftName)
                    .then((draft: Draft) => { _currentDraft = draft });
                draftRunner.startDraft(msg.channel, _currentDraft);
            })
    }
})

client.login(config.token);
console.log("SuperBot is running.");