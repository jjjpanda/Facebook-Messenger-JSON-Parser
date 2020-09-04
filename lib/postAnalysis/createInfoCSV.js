const fs = require('fs');
const path = require('path')
const arrayToCSV = require('../tools/arrayToCSV');

module.exports = (chatInfoObj, dirPath) => {
    fs.writeFile(path.join(dirPath,"info.csv"), arrayToCSV(Object.values(chatInfoObj)), function(err) {
        if(err) {
            return console.log(err);
        }
    
        console.log("The analysis file was saved! 😏");
    }); 
}