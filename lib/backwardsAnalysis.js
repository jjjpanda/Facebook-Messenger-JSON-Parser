const moment = require('moment')
const cliProgress = require('cli-progress');
const {
    roundTimestamp, minuteIntervalInMilliSeconds
} = require("./tools/roundTimestamp");

module.exports = (groupChat, gcLength, chatInfoObj, currentUsers, indexOfChatInfoObj) => {
    //Going backwards in time
    const bar = new cliProgress.SingleBar({
        format: 'Backwards Analysis [{bar}] {percentage}% | Time Elapsed: {duration}s 🧐'
    }, cliProgress.Presets.shades_classic)
    bar.start(100, 0)

    let timestamp = roundTimestamp((groupChat[0].timestamp_ms));
    
    //console.log('\n', timestamp)
    chatInfoObj[timestamp]['People In Chat'] = currentUsers;

    const changes = {
        picChange: /.* changed the group photo\./,
        colorChange: /.* changed the chat theme\./,
        nicknameChange: /.* set the nickname for .* to .*\./,
        emojiChange: /.* set the emoji to .*\./,
        chatNameChange: /.* named the group .*\./
    }

    for (i = 0; i < gcLength; i++){
        bar.update(((i/ gcLength)*100))

        timestamp = roundTimestamp((groupChat[i].timestamp_ms));
        if(i != 0 && (timestamp != roundTimestamp((groupChat[i-1].timestamp_ms)))){
            for(j = 0; j < moment(roundTimestamp((groupChat[i-1].timestamp_ms))).diff(moment(roundTimestamp((groupChat[i].timestamp_ms))), "millisecond") / minuteIntervalInMilliSeconds(); j++){
                timestamp = Object.keys(chatInfoObj)[indexOfChatInfoObj[roundTimestamp((groupChat[i].timestamp_ms)).toString()]+j]
                chatInfoObj[timestamp]['People In Chat'] = chatInfoObj[roundTimestamp((groupChat[i-1].timestamp_ms))]['People In Chat'];
            }
        }
        
        if(groupChat[i].type === "Subscribe"){
            for(user of groupChat[i].users){
                chatInfoObj[timestamp]['People Added'] += user["name"]+";";
                chatInfoObj[timestamp]['Additions']++;
                chatInfoObj[timestamp]['People In Chat']--;
            }
        }
        else if(groupChat[i].type === "Unsubscribe"){
            for(user of groupChat[i].users){
                chatInfoObj[timestamp]['People Removed'] += user["name"]+";";
                chatInfoObj[timestamp]['Removals']++;
                chatInfoObj[timestamp]['People In Chat']++;
            }
        }

        const msg = groupChat[i].content
        if(msg != undefined){
            if(changes.picChange.test(msg)){
                chatInfoObj[timestamp]["Group Pic Change"]++
            }
            else if(changes.colorChange.test(msg)){
                chatInfoObj[timestamp]["Color Change"]++
            }
            else if(changes.nicknameChange.test(msg)){
                chatInfoObj[timestamp]["Nickname Change"]++
            }
            else if(changes.emojiChange.test(msg)){
                chatInfoObj[timestamp]["Emoji Change"]++
            }
            else if(changes.chatNameChange.test(msg)){
                chatInfoObj[timestamp]["Chat Name Change"]++
            }
        }
    }
    
    bar.stop()
}