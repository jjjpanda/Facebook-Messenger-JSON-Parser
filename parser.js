var fs = require('fs');
var path = require('path');
var Sentiment = require('sentiment');
var sen = new Sentiment()

const dirPath = path.resolve(__dirname, process.argv[2] || "./")
const files = fs.readdirSync(dirPath)

let groupChat = {
    participants: [],
    messages: [],
    title: "Group Chat"
}
for(const file of files){
    if(path.extname(file) == ".json" && file != 'totalChat.json'){
        //console.log(path.join(dirPath, file))
        let parsedJSON = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8'))
        if(parsedJSON.participants != undefined && parsedJSON.messages != undefined && parsedJSON.title != undefined){
            groupChat.participants = [...groupChat.participants, ...parsedJSON.participants]
            groupChat.messages = [...groupChat.messages, ...parsedJSON.messages]
        }
    }
}

groupChat.participants = removeDuplicates(groupChat.participants, "name")
groupChat.messages.sort((a, b) => {
    return a.timestamp_ms > b.timestamp_ms;
})

fs.writeFileSync(path.join(dirPath,"totalChat.json"), JSON.stringify(groupChat, null, 1), 'utf8')

//var groupChat = JSON.parse(fs.readFileSync('message.json','utf8'));

function removeDuplicates(originalArray, prop) {
    var newArray = [];
    var lookupObject  = {};

    for(var i in originalArray) {
       lookupObject[originalArray[i][prop]] = originalArray[i];
    }

    for(i in lookupObject) {
        newArray.push(lookupObject[i]);
    }
     return newArray;
}

function arrayToCSV(objArray) {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = `${Object.keys(array[0]).map(value => `"${value}"`).join(",")}` + '\r\n';
    return array.reduce((str, next) => {
        str += `${Object.values(next).map(value => `"${value}"`).join(",")}` + '\r\n';
        return str;
       }, str);
}

function objectOfObjectsToCSV(obj) {
    let str = ","
    columns = new Set()
    for( const columnName of Object.keys(obj[Object.keys(obj)[0]])){
        str += new Buffer(columnName.toString('latin1'), 'latin1').toString('utf8')+","
        columns.add(columnName)
    }

    str+="\r\n"
    
    for(const rowName of Object.keys(obj)){
        str += rowName+","
        for( const columnName of columns){
            str+= obj[rowName][columnName]+','
        }
        str+="\r\n"
    }
    return str
}

function roundToHour(timestamp){
    return new Date(timestamp.getYear()+1900, timestamp.getMonth(), timestamp.getDate(), timestamp.getHours(), 0, 0, 0);    
}

currentUsers = groupChat.participants.length;
groupChat = groupChat.messages;
gcLength = groupChat.length;

actors = new Set();
reactions = new Set()
for (i = gcLength-1; i >= 0; i--){
    actors.add(groupChat[i].sender_name);
    if(groupChat[i].reactions != undefined){
        for(const {reaction} of groupChat[i].reactions ){
            reactions.add(reaction)
        }
    }
}
console.log(reactions)

messageRally = [];
textDump = {};
usersBlankObject = {};
usersMessageFreqBlankObject = {};
reactionMatrix = {}

counter = 0;
for (const key of actors){
    textDump[key] = "";
    usersMessageFreqBlankObject[key+" Number Of Messages"] = 0;
    usersBlankObject[key] = counter;
    counter++;

    reactionMatrix[key] = {}
    for( const reaction of reactions){
        for( const key2 of actors ){
            reactionMatrix[key][key2+" "+reaction] = 0
        }
    }
}

usersMessageFreqBlankObject["Total Number Of Messages"] = 0;

textDump["total"] = "";

for (const key of actors){
    usersMessageFreqBlankObject[key+" Number Of Characters"] = 0;
}
usersMessageFreqBlankObject["Total Number Of Characters"] = 0;

for (const key of actors){
    usersMessageFreqBlankObject[key+" Sentiment"] = 0;
}
usersMessageFreqBlankObject["Total Sentiment"] = 0;

for (const key of actors){
    usersMessageFreqBlankObject[key+" Reactions"] = 0;
}
usersMessageFreqBlankObject["Total Number Of Reactions"] = 0;


//Set up hour long blocks 
chatInfoObj = {};
timestamp = roundToHour(new Date(groupChat[gcLength-1].timestamp_ms));
counter = 0;
indexOfChatInfoObj = {};
while (timestamp <= roundToHour(new Date(groupChat[0].timestamp_ms))) {
    chatInfoObj[timestamp] = {...{'time':(timestamp.getMonth()+1)+"/"+timestamp.getDate()+"/"+timestamp.getFullYear(), 'hour':timestamp.getHours()+":00"}, 
                                ...usersMessageFreqBlankObject,
                                ...{"People Talking":0, "People In Chat":0, "Additions": "", "Removals": "", "People Added": "", "People Removed": "" }};  
    indexOfChatInfoObj[timestamp] = counter;
    counter++; 
    timestamp.setHours(timestamp.getHours()+1);
}

//Going backwards in time
timestamp = roundToHour(new Date(groupChat[0].timestamp_ms));
chatInfoObj[timestamp]['People In Chat'] = currentUsers;
for (i = 0; i < gcLength; i++){
    //console.log(((i/ gcLength)*50).toFixed(2)+ "%")

    timestamp = roundToHour(new Date(groupChat[i].timestamp_ms));
    if(i != 0 && (timestamp != roundToHour(new Date(groupChat[i-1].timestamp_ms)))){
        for(j = 0; j < (roundToHour(new Date(groupChat[i-1].timestamp_ms))-roundToHour(new Date(groupChat[i].timestamp_ms)))/36e5; j++){
            timestamp = Object.keys(chatInfoObj)[indexOfChatInfoObj[roundToHour(new Date(groupChat[i].timestamp_ms)).toString()]+j]
            chatInfoObj[timestamp]['People In Chat'] = chatInfoObj[roundToHour(new Date(groupChat[i-1].timestamp_ms))]['People In Chat'];
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

//Going forwards in time
for (i = gcLength-1; i >= 0; i--){
    //console.log((50+(gcLength-i+1)*50/gcLength).toFixed(2)+ "%")

    messageRally.push({...usersBlankObject});
    if(i < gcLength-1 && messageRally[messageRally.length-2][groupChat[i].sender_name] == messageRally[messageRally.length-1][groupChat[i].sender_name])
        messageRally[messageRally.length-1][groupChat[i].sender_name]++;

    timestamp = roundToHour(new Date(groupChat[i].timestamp_ms));
    if(groupChat[i].content != undefined){
        strToBeAdded = new Buffer(groupChat[i].content.toString('latin1'), 'latin1').toString('utf8')
        textDump[groupChat[i].sender_name] += strToBeAdded + "  ";
        textDump["total"] += strToBeAdded + "  ";
        if(chatInfoObj[timestamp][groupChat[i].sender_name+" Number Of Messages"] === 0){
            chatInfoObj[timestamp]["People Talking"]++;
        }
        chatInfoObj[timestamp][groupChat[i].sender_name+" Number Of Messages"]++;
        chatInfoObj[timestamp]["Total Number Of Messages"]++;
        chatInfoObj[timestamp][groupChat[i].sender_name+" Number Of Characters"]+=groupChat[i].content.replace(/\W/g, '').length;
        chatInfoObj[timestamp]["Total Number Of Characters"]+=groupChat[i].content.replace(/\W/g, '').length;
        
        if(groupChat[i].reactions != undefined){
            for( const {reaction, actor} of groupChat[i].reactions){
                chatInfoObj[timestamp][actor+" Reactions"]++
                chatInfoObj[timestamp]["Total Number Of Reactions"]++

                reactionMatrix[groupChat[i].sender_name][actor+" "+reaction]++
            }
        }
        
        chatInfoObj[timestamp][groupChat[i].sender_name+" Sentiment"]+=sen.analyze(groupChat[i].content).comparative;
        chatInfoObj[timestamp]["Total Sentiment"]+=sen.analyze(groupChat[i].content).comparative;
    }
}

//create text files containing all message contents per user
dir = "./cloud"
if (!fs.existsSync(dir)){
    fs.mkdirSync(path.join(dirPath, dir));
}
for(const key of Object.keys(textDump)){
    fs.writeFile(path.join(dirPath,"./cloud/"+key+".txt"), textDump[key], function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The " +key+ " text file was saved!");
    }); 
}

fs.writeFile(path.join(dirPath,'reactions.csv'), objectOfObjectsToCSV(reactionMatrix), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The reactions file was saved!");
})

fs.writeFile(path.join(dirPath,"info.csv"), arrayToCSV(Object.values(chatInfoObj)), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The analysis file was saved!");
}); 

fs.writeFile(path.join(dirPath,"rally.csv"), arrayToCSV(messageRally), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The rally file was saved!");
}); 