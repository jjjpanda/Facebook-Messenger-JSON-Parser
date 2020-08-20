const moment = require('moment')
const setUpUserBlankObj = require("./userBlankObj");
const {
    roundTimestamp
} = require("../tools/roundTimestamp");

module.exports = (groupChat, gcLength, members, categories, minutesInterval) => {
    let usersMessageFreqBlankObject = setUpUserBlankObj(members, categories)

    let chatInfoObj = {}
    let timestamp = roundTimestamp(groupChat[gcLength - 1].timestamp_ms)
    let counter = 0;
    let indexOfChatInfoObj = {};
    while (timestamp <= roundTimestamp(groupChat[0].timestamp_ms)) {
        chatInfoObj[timestamp] = {...{'time':(timestamp.getMonth()+1)+"/"+timestamp.getDate()+"/"+timestamp.getFullYear(), 'hour':timestamp.getHours()+":00"}, 
                                    ...usersMessageFreqBlankObject,
                                    ...{"People Talking":0, "People In Chat":0, "Additions": "", "Removals": "", "People Added": "", "People Removed": "" }};  
        indexOfChatInfoObj[timestamp] = counter;
        counter++; 
        timestamp = moment(timestamp).add(minutesInterval, 'minute').toDate()
        //console.log(timestamp, roundTimestamp(groupChat[0].timestamp_ms))
    }

    return {
        chatInfoObj,
        indexOfChatInfoObj
    }
}