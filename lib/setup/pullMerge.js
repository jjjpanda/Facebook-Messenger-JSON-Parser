const fs = require('fs');
const path = require('path');

module.exports = (pathToFile) => {
    const groupChat = JSON.parse(fs.readFileSync(pathToFile, 'latin1'))
    return {
        currentUsers: groupChat.participants.length,
        groupChat: groupChat.messages,
        gcLength: groupChat.messages.length,
    }
}