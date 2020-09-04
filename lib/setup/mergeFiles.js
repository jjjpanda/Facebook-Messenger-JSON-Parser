const fs = require('fs');
const path = require('path');
const moment = require('moment')
const removeDuplicates = require('../tools/removeDuplicates');

module.exports = (dirPath) => {
    let files
    try {
        files = fs.readdirSync(dirPath)
    } catch (error) {
        console.log(`😯 This directory ${dirPath} is not real.\nOr maybe this script can't access it.`)
        process.exit(1)
    }

    let groupChat = {
        participants: [],
        messages: [],
        title: "Group Chat"
    }

    let numberOfJSONs = 0
    for(const file of files){
        if(path.extname(file) == ".json" && file != 'totalChat.json'){
            let parsedJSON = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8'))
            if(parsedJSON.participants != undefined && parsedJSON.messages != undefined && parsedJSON.title != undefined){
                numberOfJSONs++
                groupChat.participants = [...groupChat.participants, ...parsedJSON.participants]
                groupChat.messages = [...groupChat.messages, ...parsedJSON.messages]
                console.log(`JSON: ${path.join(dirPath, file)} ✔`)
            }
            else{
                numberOfJSONs--
                console.log(`JSON: ${path.join(dirPath, file)} ❌`)
            }
        }
    }

    if(numberOfJSONs <= 0){
        console.log(`❌ No Facebook JSONs found in ${dirPath}\n Now exiting... 😥`)
        process.exit(1)
    }
    
    groupChat.participants = removeDuplicates(groupChat.participants, "name")
    groupChat.messages = groupChat.messages.sort((a, b) => {
        return parseInt(b.timestamp_ms) - parseInt(a.timestamp_ms);
    })
    
    groupChat.messages.forEach((v, i) => {
        v.time = moment(v.timestamp_ms).format('YYYY-MM-DD hh:mm:ss A')
    })

    fs.writeFileSync(path.join(dirPath,"totalChat.json"), JSON.stringify(groupChat, null, 1), 'latin1')

    return path.join(dirPath,"totalChat.json")
}