const fs = require('fs');
const path = require('path')
const objectOfObjectsToCSV = require("../tools/objectOfObjectsToCSV");

module.exports = (reactionMatrix, dirPath ) => {
        
    fs.writeFile(path.join(dirPath,'reactions.csv'), objectOfObjectsToCSV(reactionMatrix), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The reactions file was saved! 😍");
    })
}