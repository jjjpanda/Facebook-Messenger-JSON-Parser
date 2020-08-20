const fs = require('fs');
const path = require('path');
const moment = require('moment')
const removeDuplicates = require('../tools/removeDuplicates');

module.exports = (dirPath) => {
    const files = fs.readdirSync(dirPath)

    let groupChat = {
        participants: [],
        messages: [],
        title: "Group Chat"
    }
    for(const file of files){
        if(path.extname(file) == ".json" && file != 'totalChat.json'){
            console.log(path.join(dirPath, file))
            let parsedJSON = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8'))
            if(parsedJSON.participants != undefined && parsedJSON.messages != undefined && parsedJSON.title != undefined){
                groupChat.participants = [...groupChat.participants, ...parsedJSON.participants]
                groupChat.messages = [...groupChat.messages, ...parsedJSON.messages]
            }
        }
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