const fs = require('fs')
const path = require('path');
const arrayToCSV = require('../tools/arrayToCSV');

module.exports = (messageRally, dirPath) => {
    fs.writeFile(path.join(dirPath,"rally.csv"), arrayToCSV(messageRally), function(err) {
        if(err) {
            return console.log(err);
        }
    
        console.log("The rally file was saved! 🏁");
    }); 
}