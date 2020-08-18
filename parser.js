const fs = require('fs');
const path = require('path');
const Sentiment = require('sentiment');
const cliProgress = require('cli-progress');
const moment = require('moment')
const sen = new Sentiment()

const dirPath = path.resolve(__dirname, process.argv[2] || "./")
const minutesInterval = parseInt(process.argv[3]) || 60
const files = fs.readdirSync(dirPath)

let groupChat = {
    participants: [],
    messages: [],
    title: "Group Chat"
}
for(const file of files){
    if(path.extname(file) == ".json" && file != 'totalChat.json'){
        console.log(path.join(dirPath, file))
        let parsedJSON = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8'))
        if(parsedJSON.participants != undefined && parsedJSON.messages != undefined && parsedJSON.title != undefined){
            groupChat.participants = [...groupChat.participants, ...parsedJSON.participants]
            groupChat.messages = [...groupChat.messages, ...parsedJSON.messages]
        }
    }
}

groupChat.participants = removeDuplicates(groupChat.participants, "name")
groupChat.messages = groupChat.messages.sort((a, b) => {
    return parseInt(b.timestamp_ms) - parseInt(a.timestamp_ms);
})

groupChat.messages.forEach((v, i) => {
    v.time = moment(v.timestamp_ms).format('YYYY-MM-DD hh:mm:ss A')
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
        str += columnName+","
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

function roundTimestamp(timestamp){
    return moment(timestamp).second(0).millisecond(0).minute(Math.ceil(moment(timestamp).minute() / minutesInterval) * minutesInterval).toDate()
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
            reactions.add(new Buffer(reaction.toString('latin1'), 'latin1').toString('utf8'))
        }
    }
}
console.log("Reactions: ", reactions)

messageRally = [];
textDump = {};
usersBlankObject = {};
usersMessageFreqBlankObject = {};
reactionMatrix = {}

const categories = [
    "Messages",
    "Sends",
    "Characters",
    "Sentiment",
    "Reactions",
    "Photos",
    "Audios",
    "Files",
    "Removed Messages"
]

counter = 0;
for (const key of actors){
    textDump[key] = "";

    usersBlankObject[key] = counter;
    counter++;

    reactionMatrix[key] = {}
    for( const reaction of reactions){
        for( const key2 of actors ){
            reactionMatrix[key][key2+" "+reaction] = 0
        }
    }
}

for(const category of categories){
    for (const key of actors){
        usersMessageFreqBlankObject[`${key} ${category}`] = 0;
    }
}

textDump["total"] = "";

for(const category of categories){
    usersMessageFreqBlankObject[`Total ${category}`] = 0;
}

//Set up hour long blocks 
chatInfoObj = {};
timestamp = roundTimestamp(groupChat[gcLength-1].timestamp_ms);
counter = 0;
indexOfChatInfoObj = {};
while (timestamp <= roundTimestamp(groupChat[0].timestamp_ms)) {
    chatInfoObj[timestamp] = {...{'time':(timestamp.getMonth()+1)+"/"+timestamp.getDate()+"/"+timestamp.getFullYear(), 'hour':timestamp.getHours()+":00"}, 
                                ...usersMessageFreqBlankObject,
                                ...{"People Talking":0, "People In Chat":0, "Additions": "", "Removals": "", "People Added": "", "People Removed": "" }};  
    indexOfChatInfoObj[timestamp] = counter;
    counter++; 
    timestamp = moment(timestamp).add(minutesInterval, 'minute').toDate()
    //console.log(timestamp, roundTimestamp(groupChat[0].timestamp_ms))
}

const bar = new cliProgress.SingleBar({
    format: 'Processing [{bar}] {percentage}% | Time Elapsed: {duration}s 😎'
}, cliProgress.Presets.shades_classic)
bar.start(100, 0)

//Going backwards in time
timestamp = roundTimestamp((groupChat[0].timestamp_ms));
chatInfoObj[timestamp]['People In Chat'] = currentUsers;
for (i = 0; i < gcLength; i++){
    bar.update(((i/ gcLength)*50))

    timestamp = roundTimestamp((groupChat[i].timestamp_ms));
    if(i != 0 && (timestamp != roundTimestamp((groupChat[i-1].timestamp_ms)))){
        for(j = 0; j < (roundTimestamp((groupChat[i-1].timestamp_ms))-roundTimestamp((groupChat[i].timestamp_ms)))/36e5; j++){
            timestamp = Object.keys(chatInfoObj)[indexOfChatInfoObj[roundTimestamp((groupChat[i].timestamp_ms)).toString()]+j]
            chatInfoObj[timestamp]['People In Chat'] = chatInfoObj[roundTimestamp((groupChat[i-1].timestamp_ms))]['People In Chat'];
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
    bar.update((50+(gcLength-i+1)*50/gcLength))
    
    messageRally.push({...usersBlankObject, "time til next": ''});
    if(i < gcLength-1){    
        messageRally[messageRally.length-1][groupChat[i].sender_name]++;
        messageRally[messageRally.length-1]["time til next"] = (groupChat[i-1] != undefined ? (groupChat[i].sender_name != groupChat[i-1].sender_name ? groupChat[i-1].timestamp_ms - groupChat[i].timestamp_ms : "") : "")
    }

    timestamp = roundTimestamp((groupChat[i].timestamp_ms));
    if(groupChat[i] != undefined){
        if(chatInfoObj[timestamp][groupChat[i].sender_name+" Sends"] === 0){
            chatInfoObj[timestamp]["People Talking"]++;
        }
        
        //Make number of messages always 1 to remove consideration of people sending consecutive messages.
        let numberOfMessages = groupChat[i+1] == undefined || groupChat[i+1].sender_name == groupChat[i].sender_name ? 0 : 1
        
        chatInfoObj[timestamp][groupChat[i].sender_name+" Messages"]+=numberOfMessages;
        chatInfoObj[timestamp]["Total Messages"]+=numberOfMessages;

        chatInfoObj[timestamp][groupChat[i].sender_name+" Sends"]++;
        chatInfoObj[timestamp]["Total Sends"]++;

        let messageValue = false

        if(groupChat[i].content != undefined){
            strToBeAdded = new Buffer(groupChat[i].content.toString('latin1'), 'latin1').toString('utf8')
            textDump[groupChat[i].sender_name] += strToBeAdded + "  ";
            textDump["total"] += strToBeAdded + "  ";

            chatInfoObj[timestamp][groupChat[i].sender_name+" Characters"]+=groupChat[i].content.replace(/\W/g, '').length;
            chatInfoObj[timestamp]["Total Characters"]+=groupChat[i].content.replace(/\W/g, '').length;

            chatInfoObj[timestamp][groupChat[i].sender_name+" Sentiment"]+=sen.analyze(groupChat[i].content).comparative;
            chatInfoObj[timestamp]["Total Sentiment"]+=sen.analyze(groupChat[i].content).comparative;
            
            messageValue = true
        }
        
        if(groupChat[i].photos != undefined){
            chatInfoObj[timestamp][groupChat[i].sender_name+" Photos"]+=groupChat[i].photos.length;
            chatInfoObj[timestamp]["Total Photos"]+=groupChat[i].photos.length;
            messageValue = true
        }

        if(groupChat[i].audio_files != undefined){
            chatInfoObj[timestamp][groupChat[i].sender_name+" Audios"]+=groupChat[i].audio_files.length;
            chatInfoObj[timestamp]["Total Audios"]+=groupChat[i].audio_files.length;
            messageValue = true
        }

        if(groupChat[i].files != undefined){
            chatInfoObj[timestamp][groupChat[i].sender_name+" Files"]+=groupChat[i].files.length;
            chatInfoObj[timestamp]["Total Files"]+=groupChat[i].files.length;
            messageValue = true
        }
        
        if(groupChat[i].reactions != undefined){
            for( const {reaction, actor} of groupChat[i].reactions){
                chatInfoObj[timestamp][actor+" Reactions"]++
                chatInfoObj[timestamp]["Total Reactions"]++

                reactionMatrix[groupChat[i].sender_name][actor+" "+reaction]++
            }
        }

        if(!messageValue){
            //Removed message
            chatInfoObj[timestamp][groupChat[i].sender_name+" Removed Messages"]++;
            chatInfoObj[timestamp]["Total Removed Messages"]++;
        }
    
    }
}

bar.stop()

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