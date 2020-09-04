const fs = require('fs');
const path = require('path')

module.exports = (textDump, dirPath) => {
    //create text files containing all message contents per user
    dir = "./cloud"
    if (!fs.existsSync(path.join(dirPath, dir))){
        fs.mkdirSync(path.join(dirPath, dir));
    }
    for(const key of Object.keys(textDump)){
        fs.writeFile(path.join(dirPath,"./cloud/"+key+".txt"), textDump[key], function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The " +key+ " text file was saved! 📝");
        }); 
    }
}