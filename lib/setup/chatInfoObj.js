const moment = require('moment')
const setUpUserBlankObj = require("./userBlankObj");
const {
    roundTimestamp
} = require("../tools/roundTimestamp");

module.exports = (groupChat, gcLength, members, categories, minutesInterval) => {
    let usersMessageFreqBlankObject = setUpUserBlankObj(members, categories)

    let chatInfoObj = {}
    let timestamp = roundTimestamp(groupChat[gcLength - 1].timestamp_ms)
    //console.log(groupChat[gcLength - 1].timestamp_ms)
    let counter = 0;
    let indexOfChatInfoObj = {};
    while (moment(roundTimestamp(groupChat[0].timestamp_ms)).diff(moment(timestamp), "millisecond") >= 0) {
        chatInfoObj[timestamp] = {...{'Date': moment(timestamp).format("MM/DD/YYYY hh:mm a")}, 
                                    ...usersMessageFreqBlankObject,
                                    ...{"People Talking":0, "People In Chat":0, "Additions": "", "Removals": "", "People Added": "", "People Removed": "" }};  
        indexOfChatInfoObj[timestamp] = counter;
        counter++; 
        timestamp = moment(timestamp).add(minutesInterval, 'minute').second(0).millisecond(0).valueOf()
        //console.log(timestamp, roundTimestamp(groupChat[0].timestamp_ms))
    }

    //console.log(Object.keys(chatInfoObj) )

    return {
        chatInfoObj,
        indexOfChatInfoObj
    }
}