const moment = require('moment')
const cliProgress = require('cli-progress');
const setUpUserBlankObj = require("./userBlankObj");
const {
    roundTimestamp,
    getMinutesInterval,
    minuteIntervalInMilliSeconds
} = require("../tools/roundTimestamp");

const minutesInterval = getMinutesInterval()

module.exports = (groupChat, gcLength, members, categories) => {
    let usersMessageFreqBlankObject = setUpUserBlankObj(members, categories)

    const numericalAggregate = {
        "People Talking": 0, 
        "People In Chat": 0,
        "Average Response Time": "",
        "Group Pic Change": 0,
        "Color Change": 0,
        "Nickname Change": 0,
        "Emoji Change": 0,
        "Chat Name Change": 0,
        "Additions": 0, 
        "Removals": 0, 
    }

    const textAggregate = {
        "People Added": "", 
        "People Removed": ""
    }

    const bar = new cliProgress.SingleBar({
        format: 'Setting Up Objects [{bar}] {percentage}% | Time Elapsed: {duration}s 🤔'
    }, cliProgress.Presets.shades_classic)
    bar.start(100, 0)

    let counter = 0;
    let indexOfChatInfoObj = {};
    let chatInfoObj = {}
    
    let timestamp = roundTimestamp(groupChat[gcLength - 1].timestamp_ms)
    let prevDifference = 0
    let difference = moment(roundTimestamp(groupChat[0].timestamp_ms)).diff(moment(timestamp), "millisecond")
    let totalDifference = difference
    //console.log(groupChat[gcLength - 1].timestamp_ms)

    while (difference >= 0) {
        bar.update(100 - (difference/totalDifference * 100))
        
        chatInfoObj[timestamp] = {...{'Date': moment(timestamp).format("MM/DD/YYYY hh:mm a")}, 
                                    ...usersMessageFreqBlankObject,
                                    ...numericalAggregate,
                                    ...textAggregate
                                };  
        indexOfChatInfoObj[timestamp] = counter;
        counter++; 
        
        prevDifference = difference
        let addTries = 1
        while(prevDifference - difference == 0){
            timestamp = moment(timestamp, 'x').add(minutesInterval * addTries, 'minute').second(0).millisecond(0).valueOf()
            difference = moment(roundTimestamp(groupChat[0].timestamp_ms)).diff(moment(timestamp), "millisecond")
            addTries++
            //console.log(prevDifference - difference , addTries)
        } 
        //console.log(timestamp, roundTimestamp(groupChat[0].timestamp_ms), difference)
    }
    
    bar.stop()

    //console.log(Object.keys(chatInfoObj) )

    return {
        chatInfoObj,
        indexOfChatInfoObj
    }
}