const moment = require('moment')

let minutesInterval = 60

module.exports = {
    roundTimestamp: (timestamp) => {
        return moment(timestamp).second(0).millisecond(0).minute(Math.ceil(moment(timestamp).minute() / minutesInterval) * minutesInterval).toDate()
    }, 

    setUpInterval: (newMinutesInterval) => {
        minutesInterval = newMinutesInterval
    }
}