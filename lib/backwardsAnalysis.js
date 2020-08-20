const {
    roundTimestamp
} = require("./tools/roundTimestamp");

module.exports = (groupChat, gcLength, chatInfoObj, bar, currentUsers, indexOfChatInfoObj) => {
    //Going backwards in time
    timestamp = roundTimestamp((groupChat[0].timestamp_ms));
    chatInfoObj[timestamp]['People In Chat'] = currentUsers;
    for (i = 0; i < gcLength; i++){
        bar.update(((i/ gcLength)*50))

        timestamp = roundTimestamp((groupChat[i].timestamp_ms));
        if(i != 0 && (timestamp != roundTimestamp((groupChat[i-1].timestamp_ms)))){
            for(j = 0; j < (roundTimestamp((groupChat[i-1].timestamp_ms))-roundTimestamp((groupChat[i].timestamp_ms)))/36e5; j++){
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
    }
}