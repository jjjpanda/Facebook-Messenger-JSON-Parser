const moment = require('moment')

let minutesInterval = parseInt(process.argv[3]) || 60

module.exports = {
    roundTimestamp: (timestamp) => {
        const value = moment(timestamp).valueOf()
        return (moment(value - (value % (minutesInterval * 60 * 1000)) + (minutesInterval * 60 * 1000))).second(0).millisecond(0).valueOf()
    }, 

    minuteIntervalInMilliSeconds: () => {
        return minutesInterval * 60 * 1000 //milliseconds
    },

    getMinutesInterval: () => {
        return minutesInterval
    }
}